import { preflight, readJson } from './_lib/openai.js'
import { deleteRule, cancelFutureRuleJobs } from './_lib/supabase.js'

// Apaga uma regra de recorrência e cancela seus jobs FUTUROS ainda pendentes
// (os que já foram publicados/estão publicando ficam como estão).
// Entrada: { id }. Saída: { ok }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { id } = await readJson(req)
    if (!id) throw new Error('id ausente')
    await cancelFutureRuleJobs(String(id))
    await deleteRule(String(id))
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
