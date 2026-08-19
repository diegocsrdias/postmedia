// Recorrência: transforma uma REGRA ("toda segunda às 9h e 18h") nas próximas
// ocorrências concretas da tabela `schedule`. Roda no runner (materializeAll) e
// também na criação da regra, pra fila já aparecer preenchida.
//
// Fuso: o Brasil não tem horário de verão desde 2019, então usamos o offset fixo
// -03:00 (America/Sao_Paulo). Os horários da regra são interpretados nesse fuso e
// convertidos para UTC ao gravar.

import { insertJob, listRuleSlots, listActiveRules } from './supabase.js'

const BR_OFFSET = '-03:00'
const pad = (n) => String(n).padStart(2, '0')

/** Partes da data de HOJE no fuso do Brasil ({ y, m, d }). */
function todayBR() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

/**
 * Ocorrências (ISO UTC) de uma regra dentro de [agora, agora + horizonHours].
 * `weekdays` vazio = todo dia; senão 0=dom … 6=sáb. `times` = ['09:00', ...].
 */
export function occurrencesFor(rule, { nowMs = Date.now(), horizonHours = 48 } = {}) {
  const times = (rule.times || []).filter((t) => /^\d{1,2}:\d{2}$/.test(t))
  if (!times.length) return []
  const weekdays = Array.isArray(rule.weekdays) ? rule.weekdays : []
  const horizonMs = horizonHours * 3600 * 1000
  const out = []

  const today = todayBR()
  // percorre os dias do horizonte (com folga de +1) a partir de hoje no fuso BR
  const days = Math.ceil(horizonHours / 24) + 1
  for (let off = 0; off <= days; off++) {
    const base = new Date(Date.UTC(today.y, today.m - 1, today.d))
    base.setUTCDate(base.getUTCDate() + off)
    const y = base.getUTCFullYear()
    const m = base.getUTCMonth() + 1
    const d = base.getUTCDate()
    const weekday = base.getUTCDay() // dia da semana daquela data de calendário
    if (weekdays.length && !weekdays.includes(weekday)) continue

    for (const t of times) {
      const [hh, mm] = t.split(':')
      const iso = `${y}-${pad(m)}-${pad(d)}T${pad(Number(hh))}:${pad(Number(mm))}:00${BR_OFFSET}`
      const when = new Date(iso)
      const ms = when.getTime()
      if (ms > nowMs && ms <= nowMs + horizonMs) out.push(when.toISOString())
    }
  }
  return out
}

/**
 * Normaliza os campos de um Reel vindos do corpo da requisição.
 * `flow` vira um slug (default 'auto' = worker sorteia). `targets` fica só com
 * 'reels'/'story' (default ['reels']).
 */
export function reelsFields(body = {}) {
  const flow = String(body.flow || 'auto').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'auto'
  const raw = Array.isArray(body.targets) ? body.targets : []
  const targets = [...new Set(raw.map((t) => String(t)).filter((t) => t === 'reels' || t === 'story'))]
  return { flow, targets: targets.length ? targets : ['reels'] }
}

/** Monta a linha de job a partir de uma regra e um horário. */
function jobFromRule(rule, scheduledForIso) {
  const format = ['carousel', 'reels'].includes(rule.format) ? rule.format : 'feed'
  const base = {
    client: rule.client,
    rule_id: rule.id,
    scheduled_for: scheduledForIso,
    format,
    slides: format === 'carousel' ? Math.min(10, Math.max(2, rule.slides || 3)) : 1,
    theme: rule.theme || null,
    angle: rule.angle || null,
    layout: rule.layout || null,
    image_mode: rule.image_mode || 'none',
    status: 'pending',
  }
  if (format === 'reels') {
    // Reels: o worker gera o vídeo do fluxo escolhido e publica nos alvos.
    base.flow = rule.flow || 'auto'
    base.targets = Array.isArray(rule.targets) && rule.targets.length ? rule.targets : ['reels']
  }
  return base
}

/**
 * Materializa uma regra: cria os jobs das ocorrências ainda não enfileiradas.
 * Idempotente — só insere o que falta (dedupe por rule_id + scheduled_for).
 */
export async function materializeRule(rule, horizonHours = 48) {
  if (!rule || rule.active === false) return 0
  const nowMs = Date.now()
  const slots = occurrencesFor(rule, { nowMs, horizonHours })
  if (!slots.length) return 0

  const fromIso = new Date(nowMs).toISOString()
  const toIso = new Date(nowMs + horizonHours * 3600 * 1000 + 60000).toISOString()
  const existing = await listRuleSlots(rule.id, fromIso, toIso)

  let created = 0
  for (const iso of slots) {
    if (existing.has(iso)) continue
    try {
      await insertJob(jobFromRule(rule, iso))
      created++
    } catch (err) {
      // corrida com outra execução do cron cai no índice único — ignora
      if (!/duplicate|unique/i.test(String(err?.message || ''))) throw err
    }
  }
  return created
}

/** Materializa TODAS as regras ativas (chamado pelo runner a cada hora). */
export async function materializeAll(horizonHours = 48) {
  const rules = await listActiveRules()
  let created = 0
  for (const rule of rules) {
    try {
      created += await materializeRule(rule, horizonHours)
    } catch {
      /* uma regra ruim não pode travar as outras */
    }
  }
  return created
}
