import { preflight, readJson } from './_lib/openai.js'
import { listPostsForAnalysis } from './_lib/supabase.js'
import { summarize } from './_lib/analysis.js'

// Resumo de desempenho para realimentar a criação: melhores horários, ângulos,
// layouts e formatos por alcance/engajamento. Entrada opcional: { client }.
// Só considera posts que já têm métricas (a sync diária preenche).
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '' } = await readJson(req)
    let posts = await listPostsForAnalysis(500)
    if (client) posts = posts.filter((p) => p.client === client)

    const s = summarize(posts)
    res.status(200).json({
      count: s.count,
      totalPosts: s.totalPosts,
      byHour: s.byHour,
      byAngle: s.byAngle,
      byLayout: s.byLayout,
      byFormat: s.byFormat,
    })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
