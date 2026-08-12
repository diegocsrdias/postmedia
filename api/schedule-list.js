import { preflight, readJson } from './_lib/openai.js'
import { listJobs } from './_lib/supabase.js'

// Lista os agendamentos de um cliente. Entrada: { client }. Saída: { jobs }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '' } = await readJson(req)
    const jobs = await listJobs(client)
    res.status(200).json({ jobs })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
