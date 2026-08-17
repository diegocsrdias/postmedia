import { preflight, readJson } from './_lib/openai.js'
import { insertRule } from './_lib/supabase.js'
import { materializeRule } from './_lib/schedule.js'

// Cria uma regra de recorrência e já materializa as próximas ocorrências.
// Entrada:
//   { client, format, slides?, theme?, angle?, imageMode?, weekdays:[0-6], times:['HH:MM'] }
//   weekdays vazio = todo dia. times é obrigatório (ao menos um horário).
// Saída: { rule, materialized }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const body = await readJson(req)
    const client = String(body.client || '').trim()
    if (!client) throw new Error('client ausente')

    const times = Array.isArray(body.times)
      ? body.times.map((t) => normalizeTime(t)).filter(Boolean)
      : []
    if (!times.length) throw new Error('informe ao menos um horário (times)')

    const weekdays = Array.isArray(body.weekdays)
      ? [...new Set(body.weekdays.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort()
      : []

    const format = body.format === 'carousel' ? 'carousel' : 'feed'
    const slides = format === 'carousel' ? Math.min(10, Math.max(2, Number(body.slides) || 3)) : 1
    const imageMode = /^(none|editorial|promo)$/.test(String(body.imageMode)) ? body.imageMode : 'none'

    const rule = await insertRule({
      client,
      active: true,
      format,
      slides,
      theme: body.theme ? String(body.theme).slice(0, 200) : null,
      angle: body.angle ? String(body.angle) : null,
      layout: body.layout ? String(body.layout) : null,
      image_mode: imageMode,
      weekdays,
      times,
    })

    // já enfileira as próximas ocorrências pra fila aparecer preenchida
    let materialized = 0
    try {
      materialized = await materializeRule(rule)
    } catch {
      /* materialização é best-effort; o cron completa depois */
    }

    res.status(200).json({ rule, materialized })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}

/** Normaliza 'H:MM'/'HH:MM' para 'HH:MM', ou '' se inválido. */
function normalizeTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim())
  if (!m) return ''
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return ''
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0')
}
