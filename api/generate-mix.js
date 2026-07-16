import { chat, extractJsonArray, preflight, readJson } from './_lib/openai.js'
import { mixPrompt } from './_lib/prompts.js'
import { getClient } from './_lib/clients.js'

// Direcionamentos criativos sorteados a cada leva. Servem pra IA não convergir
// sempre no mesmo tipo de texto — cada geração parte de ângulos diferentes.
const DIRECTIONS = [
  'foque numa dor concreta e cotidiana do público',
  'traga um benefício específico e mensurável',
  'comece com uma pergunta provocativa',
  'quebre um mito comum sobre o tema',
  'conte um micro-cenário do dia a dia',
  'use um contraste antes/depois',
  'traga um dado ou número que surpreenda',
  'fale direto com quem está adiando resolver isso',
  'destaque um recurso pouco óbvio da marca',
  'use humor leve e uma pitada de exagero',
  'aposte numa frase de efeito curta e memorável',
  'responda a uma objeção típica de quem hesita',
  'mostre o custo de NÃO agir',
  'celebre uma pequena vitória do público',
]

/** Sorteia `k` direcionamentos distintos. */
function sampleDirections(k) {
  const out = []
  const pool = DIRECTIONS.slice()
  for (let i = 0; i < k && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { n = 4, existing = '', clientId = '' } = await readJson(req)
    const client = getClient(clientId)
    const count = Math.min(Math.max(Number(n) || 4, 1), 8)
    // um direcionamento por item (com teto), mais um sorteado extra pra variar
    const directions = sampleDirections(Math.min(count + 1, DIRECTIONS.length))
    const { system, user } = mixPrompt(count, client, directions, String(existing || ''))
    // temperature alta + presence/frequency penalty pra fugir da repetição
    const raw = await chat({
      system,
      user,
      maxTokens: 3200,
      temperature: 1.15,
      presencePenalty: 0.6,
      frequencyPenalty: 0.5,
    })
    const arr = extractJsonArray(raw)
    if (!Array.isArray(arr) || !arr.length) throw new Error('empty')
    res.status(200).json({ items: arr.slice(0, count) })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
