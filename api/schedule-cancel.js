import { preflight, readJson } from './_lib/openai.js'
import { updateJob } from './_lib/supabase.js'

// Cancela um agendamento pendente. Entrada: { id }. Saída: { ok }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { id = '' } = await readJson(req)
    if (!id) throw new Error('id ausente')
    await updateJob(String(id), { status: 'canceled' })
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
