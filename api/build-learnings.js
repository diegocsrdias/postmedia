import { chat, preflight, readJson } from './_lib/openai.js'
import { cronGuard } from './_lib/cron.js'
import { listPostsForAnalysis, upsertLearnings } from './_lib/supabase.js'
import { summarize } from './_lib/analysis.js'
import { CLIENTS, getClient } from './_lib/clients.js'
import { ANGLE_LABELS, LAYOUT_LABELS } from './_lib/labels.js'

// Reconstrói a memória de aprendizado por cliente a partir dos posts com
// métricas. Para cada cliente com dados suficientes, calcula os rankings e pede
// à IA um resumo curto (PT-BR) do que vem funcionando — que depois é injetado
// nos prompts de geração (ver api/_lib/prompts.js).
//
// Aceita GET (cron) e POST. Body opcional { client } limita a um cliente.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (cronGuard(req, res)) return

  try {
    const body = req.method === 'POST' ? await readJson(req) : {}
    const only = body && body.client ? String(body.client) : ''
    const clientIds = only ? [only] : Object.keys(CLIENTS)

    const allPosts = await listPostsForAnalysis(500)
    const out = []
    for (const id of clientIds) {
      const posts = allPosts.filter((p) => p.client === id)
      const stats = summarize(posts)
      // precisa de um mínimo de amostra para valer a pena resumir
      if (stats.count < 3) {
        out.push({ client: id, skipped: true, count: stats.count })
        continue
      }
      const brief = await writeBrief(getClient(id), stats)
      await upsertLearnings(id, brief, {
        count: stats.count,
        byHour: stats.byHour,
        byAngle: stats.byAngle,
        byLayout: stats.byLayout,
        byFormat: stats.byFormat,
      })
      out.push({ client: id, updated: true, count: stats.count })
    }
    res.status(200).json({ results: out })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}

/** Traduz os rankings num texto legível e pede à IA um brief curto e acionável. */
async function writeBrief(client, stats) {
  const fmtRank = (rows, labels) =>
    rows
      .slice(0, 4)
      .map((r) => `${labels ? labels[r.key] || r.key : r.key} (média ${r.avg}, ${r.n}x)`)
      .join('; ')

  const data =
    `Conta: ${client.name} (${client.business}).\n` +
    `Posts analisados com métricas: ${stats.count}.\n` +
    `Melhores ângulos: ${fmtRank(stats.byAngle, ANGLE_LABELS) || '—'}.\n` +
    `Melhores layouts: ${fmtRank(stats.byLayout, LAYOUT_LABELS) || '—'}.\n` +
    `Melhores formatos: ${fmtRank(stats.byFormat) || '—'}.\n` +
    `Melhores horários (hora do dia): ${stats.byHour.slice(0, 4).map((r) => r.key + 'h (' + r.avg + ')').join('; ') || '—'}.\n` +
    `Exemplos de melhor desempenho: ${stats.top.map((p) => '"' + (p.headline || '') + '"').filter((s) => s !== '""').join(' | ') || '—'}.\n` +
    `Exemplos de pior desempenho: ${stats.bottom.map((p) => '"' + (p.headline || '') + '"').filter((s) => s !== '""').join(' | ') || '—'}.`

  const system =
    'Você é um analista de social media. A partir dos dados de desempenho de uma conta, ' +
    'escreva um resumo CURTO (3 a 5 frases, PT-BR) e ACIONÁVEL do que vem funcionando melhor e pior, ' +
    'para orientar a criação dos próximos posts. Fale de ângulos, layouts, formatos e horários concretos. ' +
    'Nada de floreio nem de repetir números crus — traduza em recomendações claras. Não invente o que os dados não mostram.'
  const user = data + '\n\nEscreva o resumo agora.'
  try {
    const txt = await chat({ system, user, maxTokens: 350, temperature: 0.5 })
    return String(txt || '').trim()
  } catch {
    // sem IA/chave: guarda um resumo mínimo derivado dos rankings
    return (
      'Melhores ângulos: ' + fmtRank(stats.byAngle, ANGLE_LABELS) + '. ' +
      'Melhores horários: ' + stats.byHour.slice(0, 3).map((r) => r.key + 'h').join(', ') + '.'
    )
  }
}
