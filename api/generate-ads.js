import { chat, extractJsonArray, preflight, readJson } from './_lib/openai.js'
import { adsPrompt } from './_lib/prompts.js'
import { getClient } from './_lib/clients.js'

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { n = 4, existingHeadlines = '', clientId = '' } = await readJson(req)
    const client = getClient(clientId)
    const count = Math.min(Math.max(Number(n) || 4, 1), 8)
    const { system, user } = adsPrompt(count, String(existingHeadlines || ''), client)
    const raw = await chat({ system, user, maxTokens: 1800 })
    const arr = extractJsonArray(raw)
    if (!Array.isArray(arr) || !arr.length) throw new Error('empty')
    res.status(200).json({ items: arr.slice(0, count) })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
