// Análise de desempenho compartilhada entre o resumo (insights-summary) e a
// construção da memória de aprendizado (build-learnings).
//
// "score" de um post = alcance, com fallback para engajamento (likes +
// comentários + salvos + compartilhamentos) quando o alcance não veio.

export function scoreOf(p) {
  if (typeof p.reach === 'number' && p.reach > 0) return p.reach
  const eng = (p.like_count || 0) + (p.comments_count || 0) + (p.saved || 0) + (p.shares || 0)
  return eng > 0 ? eng : null
}

/** Agrega {key -> {sum, n}} em ranking por média (maior primeiro). */
export function rank(map) {
  return Object.entries(map)
    .map(([key, v]) => ({ key, avg: Math.round(v.sum / v.n), n: v.n }))
    .sort((a, b) => b.avg - a.avg)
}

/**
 * Resume uma lista de posts (já filtrada por cliente) em rankings por hora,
 * ângulo, layout e formato, além dos melhores/piores posts individuais.
 * Só considera posts com score e data.
 */
export function summarize(posts) {
  const withScore = posts
    .map((p) => ({ ...p, score: scoreOf(p) }))
    .filter((p) => p.score != null && p.published_at)

  const byHour = {}
  const byAngle = {}
  const byLayout = {}
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
    add(byLayout, p.layout)
    add(byFormat, p.format)
  }

  const sorted = withScore.slice().sort((a, b) => b.score - a.score)
  const slim = (p) => ({
    score: p.score,
    angle: p.angle,
    layout: p.layout,
    format: p.format,
    headline: p.headline,
  })

  return {
    count: withScore.length,
    totalPosts: posts.length,
    byHour: rank(byHour),
    byAngle: rank(byAngle),
    byLayout: rank(byLayout),
    byFormat: rank(byFormat),
    top: sorted.slice(0, 5).map(slim),
    bottom: sorted.slice(-5).reverse().map(slim),
  }
}
