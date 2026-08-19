import { readJson } from './_lib/openai.js'
import { cronGuard } from './_lib/cron.js'
import { updateJob } from './_lib/supabase.js'

// Callback do worker (GitHub Actions) ao TERMINAR de gerar/publicar um Reel.
// Fecha o job na fila: 'done' (com o post) ou 'error'. Protegido pelo CRON_SECRET
// (o worker o envia em ?key= ou Authorization: Bearer), como os demais endpoints
// acionados por automação.
//
// Entrada: { jobId, ok, postId?, permalink?, error? }.  Saída: { ok: true }.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (cronGuard(req, res)) return

  try {
    const body = await readJson(req)
    const jobId = String(body.jobId || body.job_id || '').trim()
    if (!jobId) throw new Error('jobId ausente')

    if (body.ok) {
      await updateJob(jobId, {
        status: 'done',
        result_post_id: body.postId || body.post_id || null,
        last_error: null,
      })
    } else {
      const msg = String(body.error || 'Falha ao gerar/publicar o Reel').slice(0, 500)
      await updateJob(jobId, { status: 'error', last_error: msg })
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
