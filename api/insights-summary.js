import { preflight, readJson } from './_lib/openai.js'
import { listPostsForAnalysis } from './_lib/supabase.js'

// Resumo de desempenho para realimentar a criação: melhores horários e melhores
// ângulos por alcance/engajamento. Entrada opcional: { client }. Só considera
// posts que já têm métricas (a sync diária preenche).
//
// "score" de um post = alcance, com fallback para engajamento (likes + comentários
// + salvos + compartilhamentos) quando o alcance não veio.
function scoreOf(p) {
  if (typeof p.reach === 'number' && p.reach > 0) return p.reach
  const eng =
    (p.like_count || 0) + (p.comments_count || 0) + (p.saved || 0) + (p.shares || 0)
  return eng > 0 ? eng : null
}

// agrega uma lista {key -> {sum, n}} em ranking por média, com no mínimo 1 amostra
function rank(map) {
  return Object.entries(map)
    .map(([key, v]) => ({ key, avg: Math.round(v.sum / v.n), n: v.n }))
    .sort((a, b) => b.avg - a.avg)
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '' } = await readJson(req)
    let posts = await listPostsForAnalysis(500)
    if (client) posts = posts.filter((p) => p.client === client)

    const withScore = posts
      .map((p) => ({ ...p, score: scoreOf(p) }))
      .filter((p) => p.score != null && p.published_at)

    const byHour = {}
    const byAngle = {}
    const byFormat = {}
    for (const p of withScore) {
      const hour = new Date(p.published_at).getHours()
      const add = (map, key) => {
        if (key == null || key === '') return
        map[key] = map[key] || { sum: 0, n: 0 }
        map[key].sum += p.score
        map[key].n += 1
      }
      add(byHour, hour)
      add(byAngle, p.angle)
      add(byFormat, p.format)
    }

    res.status(200).json({
      count: withScore.length,
      totalPosts: posts.length,
      byHour: rank(byHour),
      byAngle: rank(byAngle),
      byFormat: rank(byFormat),
    })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
