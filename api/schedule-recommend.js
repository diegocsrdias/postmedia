import { preflight, readJson } from './_lib/openai.js'
import { listPostsForAnalysis } from './_lib/supabase.js'
import { summarize } from './_lib/analysis.js'

// Recomendação de cadência/horários para o agendador, a partir do desempenho.
// Entrada: { client }. Saída: { perDay, hours, rationale, basedOn }.
//
// Sem dados suficientes, devolve uma sugestão padrão (12h e 19h, 1 post/dia) —
// horários de pico genéricos no Brasil.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = '' } = await readJson(req)
    let posts = await listPostsForAnalysis(500)
    if (client) posts = posts.filter((p) => p.client === client)
    const s = summarize(posts)

    if (s.count < 3 || !s.byHour.length) {
      res.status(200).json({
        perDay: 1,
        hours: [12, 19],
        basedOn: s.count,
        rationale:
          'Ainda sem histórico suficiente para personalizar. Comece com 1 post por dia nos horários de pico (12h e 19h) e, conforme os posts acumulam métricas, esta recomendação passa a usar os seus melhores horários reais.',
      })
      return
    }

    const hours = s.byHour.slice(0, 2).map((r) => Number(r.key))
    // cadência: 1/dia por padrão; 2/dia quando já há bastante material publicado
    const perDay = s.count >= 20 ? 2 : 1
    const topHoursTxt = hours.map((h) => h + 'h').join(' e ')
    const topAngle = s.byAngle[0] ? s.byAngle[0].key : ''
    const rationale =
      `Com base em ${s.count} posts com métricas, os seus melhores horários são ${topHoursTxt}. ` +
      `Recomendo ${perDay} post${perDay > 1 ? 's' : ''} por dia nesses horários` +
      (topAngle ? `, priorizando o ângulo que mais performa ("${topAngle}").` : '.')

    res.status(200).json({ perDay, hours, basedOn: s.count, rationale })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
