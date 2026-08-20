import { fetchMetrics } from './_lib/ig.js'
import { listPublishedPosts, updatePostMetrics } from './_lib/supabase.js'
import { cronGuard } from './_lib/cron.js'

// Atualiza as métricas de desempenho (likes, alcance, salvos…) dos posts
// publicados. Pode ser chamado de duas formas:
//   - manualmente:  GET/POST /api/ig-sync-insights
//   - por cron:     configurado em vercel.json (diário) — a Vercel bate aqui.
//
// Percorre os posts mais recentes e regrava as métricas. Erros por post não
// interrompem os demais.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (cronGuard(req, res)) return
  try {
    const posts = await listPublishedPosts(50)
    let ok = 0
    const errors = []
    for (const p of posts) {
      try {
        const metrics = await fetchMetrics(p.ig_media_id, p.client)
        if (Object.keys(metrics).length) {
          await updatePostMetrics(p.id, metrics)
          ok++
        }
      } catch (err) {
        errors.push({ id: p.id, error: String(err?.message || err) })
      }
    }
    res.status(200).json({ scanned: posts.length, updated: ok, errors })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
