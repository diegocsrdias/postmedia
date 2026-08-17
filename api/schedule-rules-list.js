import { preflight, readJson } from './_lib/openai.js'
import { listRules } from './_lib/supabase.js'

// Lista as regras de recorrência de um cliente. Entrada: { client }. Saída: { rules }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client } = await readJson(req)
    const rules = await listRules(client ? String(client) : '')
    res.status(200).json({ rules })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
