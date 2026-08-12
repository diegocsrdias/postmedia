import { preflight, readJson } from './_lib/openai.js'
import { listHistory } from './_lib/supabase.js'

// Lista o histórico de criativos (postados + baixados) de um cliente.
// Entrada: { client, status?, format?, limit? }. Saída: { items }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '', status = '', format = '', limit = 60 } = await readJson(req)
    const items = await listHistory(client, {
      status: status || undefined,
      format: format || undefined,
      limit,
    })
    res.status(200).json({ items })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
