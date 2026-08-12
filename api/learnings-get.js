import { preflight, readJson } from './_lib/openai.js'
import { getLearnings } from './_lib/supabase.js'

// Devolve a memória de aprendizado de um cliente (ou null se ainda não foi
// construída). Entrada: { client }. Saída: { learnings }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '' } = await readJson(req)
    const learnings = await getLearnings(client)
    res.status(200).json({ learnings })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
