import { chat, extractJsonArray, preflight, readJson, sanitizeItems } from './_lib/openai.js'
import { mixPrompt } from './_lib/prompts.js'
import { getClient, isEditorial } from './_lib/clients.js'
import { safeLearnings } from './_lib/supabase.js'
import { DIRECTIONS, sampleDirections } from './_lib/directions.js'

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { n = 4, existing = '', clientId = '' } = await readJson(req)
    const client = getClient(clientId)
    const count = Math.min(Math.max(Number(n) || 4, 1), 8)
    // um direcionamento por item (com teto), mais um sorteado extra pra variar
    const pool = client.directions || DIRECTIONS
    const directions = sampleDirections(Math.min(count + 1, pool.length), client)
    const learnings = await safeLearnings(clientId || client.id)
    const { system, user } = mixPrompt(count, client, directions, String(existing || ''), learnings)
    // Penalties pra fugir da repetição. Temperatura menor no modo editorial
    // (saúde): a alta (1.15) rendia divagação e erros de digitação; a voz da
    // profissional pede precisão, e a variedade já vem dos `directions`.
    const raw = await chat({
      system,
      user,
      maxTokens: 3200,
      temperature: isEditorial(client) ? 0.95 : 1.15,
      presencePenalty: 0.6,
      frequencyPenalty: 0.5,
    })
    const arr = sanitizeItems(extractJsonArray(raw))
    if (!Array.isArray(arr) || !arr.length) throw new Error('empty')
    res.status(200).json({ items: arr.slice(0, count) })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
