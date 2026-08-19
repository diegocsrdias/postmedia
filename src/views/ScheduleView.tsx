import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientConfig } from '../clients'
import {
  cancelSchedule,
  createRecurrence,
  createSchedule,
  deleteRecurrence,
  fetchScheduleRecommendation,
  listRecurrences,
  listSchedule,
  REEL_FLOWS,
} from '../lib/api'
import type { ReelFlow, ScheduleFormat, ScheduleJob, ScheduleRecommendation, ScheduleRule, StoryTarget } from '../lib/api'
import { FONT, UI } from '../ui/theme'
import { Badge, Button, Card, EmptyState, HighlightCard, SectionHeader, SegmentedControl, Skeleton, Toast, useToast } from '../ui/components'

/** Valor default do input datetime-local: daqui a 1h, no fuso local. */
function defaultWhen(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Rótulos curtos dos dias da semana (índice 0=dom … 6=sáb). */
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Descreve uma regra em linguagem natural ("Toda segunda e quinta às 09:00, 18:00"). */
function describeRule(rule: ScheduleRule): string {
  const days =
    !rule.weekdays || rule.weekdays.length === 0
      ? 'Todo dia'
      : rule.weekdays.length === 7
        ? 'Todo dia'
        : 'Toda ' + rule.weekdays.slice().sort().map((d) => WEEKDAYS[d]).join(', ')
  const times = (rule.times || []).join(', ')
  return `${days} às ${times}`
}

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warn' | 'danger' | 'accent'> = {
  pending: 'accent',
  processing: 'warn',
  done: 'success',
  error: 'danger',
  canceled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Agendado',
  processing: 'Publicando…',
  done: 'Publicado',
  error: 'Falhou',
  canceled: 'Cancelado',
}

const FLOW_LABEL: Record<string, string> = { auto: 'Sortear', 'scan-nota': 'Escanear nota', meta: 'Meta' }
const TARGET_LABEL: Record<string, string> = { reels: 'Reels', story: 'Story' }

/** Descreve o conteúdo de um Reel agendado ("Reel · Reels + Story · Escanear nota"). */
function describeReels(item: { flow?: string | null; targets?: string[] | null }): string {
  const targets = (item.targets && item.targets.length ? item.targets : ['reels']).map((t) => TARGET_LABEL[t] || t).join(' + ')
  const roteiro = item.flow && item.flow !== 'auto' ? ` · ${FLOW_LABEL[item.flow] || item.flow}` : ' · sorteia o roteiro'
  return `Reel · ${targets}${roteiro}`
}

/** Rótulo curto do conteúdo de um job/regra, conforme o formato. */
function describeContent(item: { format: string; slides?: number; flow?: string | null; targets?: string[] | null }): string {
  if (item.format === 'reels') return describeReels(item)
  if (item.format === 'carousel') return `Carrossel · ${item.slides} telas`
  return 'Feed'
}

/** Emoji do formato. */
const formatIcon = (format: string) => (format === 'reels' ? '🎬' : format === 'carousel' ? '📚' : '🖼️')

export function ScheduleView({ client }: { client: ClientConfig }) {
  const { toast, flash } = useToast()
  const [jobs, setJobs] = useState<ScheduleJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [rec, setRec] = useState<ScheduleRecommendation | null>(null)

  // form
  const [mode, setMode] = useState<'once' | 'recurring'>('once')
  const [when, setWhen] = useState(defaultWhen)
  const [weekdays, setWeekdays] = useState<number[]>([]) // vazio = todo dia
  const [times, setTimes] = useState<string[]>(['09:00'])
  const [format, setFormat] = useState<ScheduleFormat>('feed')
  const [slides, setSlides] = useState(3)
  const [theme, setTheme] = useState('')
  const [imageMode, setImageMode] = useState<'none' | 'editorial' | 'promo'>('none')
  const [flow, setFlow] = useState<ReelFlow>('auto') // reels: qual roteiro de demo
  const [reelTargets, setReelTargets] = useState<StoryTarget[]>(['reels']) // reels: onde publicar
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<ScheduleRule[]>([])

  const load = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const [jobsRes, rulesRes] = await Promise.allSettled([
        listSchedule(client.id),
        listRecurrences(client.id),
      ])
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs)
      if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.rules)
    } catch {
      /* silencioso: sem backend ainda, a lista fica vazia */
    } finally {
      setLoadingJobs(false)
    }
  }, [client.id])

  // helpers do editor de recorrência
  const toggleWeekday = (d: number) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  const setTimeAt = (i: number, v: string) =>
    setTimes((prev) => prev.map((t, idx) => (idx === i ? v : t)))
  const addTime = () => setTimes((prev) => [...prev, '12:00'])
  const removeTime = (i: number) => setTimes((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))
  // alvos do Reel: ao menos um sempre marcado
  const toggleTarget = (t: StoryTarget) =>
    setReelTargets((prev) => (prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]))

  useEffect(() => {
    void load()
    fetchScheduleRecommendation(client.id).then(setRec).catch(() => setRec(null))
  }, [client.id, load])

  const editorial = client.voice === 'editorial'
  const imageModes = useMemo(
    () =>
      editorial
        ? [
            { value: 'none' as const, label: 'Sem foto' },
            { value: 'editorial' as const, label: 'Foto editorial' },
          ]
        : [
            { value: 'none' as const, label: 'Sem foto' },
            { value: 'editorial' as const, label: 'Foto editorial' },
            { value: 'promo' as const, label: 'Foto propaganda' },
          ],
    [editorial],
  )

  async function submit() {
    if (saving) return
    setSaving(true)
    try {
      const isReels = format === 'reels'
      if (isReels && !reelTargets.length) {
        flash('Escolha ao menos um alvo (Reels ou Story)')
        return
      }
      // campos específicos de reels vs. imagem (o backend ignora os que não usa)
      const contentFields = isReels
        ? { flow, targets: reelTargets }
        : { slides: format === 'carousel' ? slides : 1, theme: theme.trim() || undefined, imageMode }

      if (mode === 'recurring') {
        const clean = times.filter((t) => /^\d{1,2}:\d{2}$/.test(t))
        if (!clean.length) {
          flash('Adicione ao menos um horário')
          return
        }
        const { materialized } = await createRecurrence({
          client: client.id,
          format,
          ...contentFields,
          weekdays,
          times: clean,
        })
        flash(materialized > 0 ? `Recorrência criada — ${materialized} já na fila! 🔁` : 'Recorrência criada! 🔁')
      } else {
        const scheduledFor = new Date(when)
        if (isNaN(scheduledFor.getTime())) {
          flash('Data/hora inválida')
          return
        }
        await createSchedule({
          client: client.id,
          scheduledFor: scheduledFor.toISOString(),
          format,
          ...contentFields,
        })
        flash(isReels ? 'Reel agendado! 🎬' : 'Post agendado! 📅')
      }
      setTheme('')
      void load()
    } catch (e) {
      flash('Falhou: ' + String((e as Error)?.message || e))
    } finally {
      setSaving(false)
    }
  }

  async function doCancel(id: string) {
    try {
      await cancelSchedule(id)
      flash('Agendamento cancelado')
      void load()
    } catch (e) {
      flash('Falhou: ' + String((e as Error)?.message || e))
    }
  }

  async function doDeleteRule(id: string) {
    try {
      await deleteRecurrence(id)
      flash('Recorrência removida')
      void load()
    } catch (e) {
      flash('Falhou: ' + String((e as Error)?.message || e))
    }
  }

  /** Aplica um horário recomendado: adiciona à recorrência ou vira o próximo agendamento. */
  const applyHour = (hour: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    if (mode === 'recurring') {
      const hh = pad(hour) + ':00'
      setTimes((prev) => (prev.includes(hh) ? prev : [...prev, hh].sort()))
      flash(`Horário ${hour}h adicionado`)
      return
    }
    const d = new Date()
    d.setHours(hour, 0, 0, 0)
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    flash(`Horário ${hour}h aplicado`)
  }

  const pending = jobs.filter((j) => j.status === 'pending').length

  return (
    <div className="app-container app-pad" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <SectionHeader
        title="Agenda"
        subtitle="Programe posts para o piloto automático — uma vez ou recorrente (ex.: todo dia às 9h, 12h e 18h; toda segunda). No horário, o servidor gera, renderiza e publica sozinho."
      />

      {/* Recomendação (quantidade + horários) */}
      {rec && (
        <HighlightCard style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: UI.ink }}>Recomendação</span>
            <Badge tone="accent">{rec.basedOn > 0 ? `com base em ${rec.basedOn} posts` : 'padrão inicial'}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: UI.inkMuted2 }}>
                Posts por dia
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: UI.ink, letterSpacing: '-0.02em' }}>{rec.perDay}×</div>
            </div>
            {rec.hours.length > 0 && (
              <div>
                <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: UI.inkMuted2, marginBottom: 6 }}>
                  Melhores horários — toque para usar
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {rec.hours.map((h) => (
                    <button key={h} className="chip on" onClick={() => applyHour(h)}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.55, color: UI.inkMuted }}>{rec.rationale}</p>
        </HighlightCard>
      )}

      {/* Formulário */}
      <Card style={{ marginBottom: 18 }}>
        {/* Frequência: uma vez ou recorrente */}
        <div style={{ marginBottom: 16 }}>
          <Field label="Frequência">
            <SegmentedControl<'once' | 'recurring'>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'once', label: '📅 Uma vez' },
                { value: 'recurring', label: '🔁 Recorrente' },
              ]}
            />
          </Field>
        </div>

        {/* Quando publicar — muda conforme a frequência */}
        {mode === 'once' ? (
          <div style={{ marginBottom: 16, maxWidth: 320 }}>
            <Field label="Quando publicar">
              <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
            </Field>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <Field label="Dias da semana (nenhum = todo dia)">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {WEEKDAYS.map((label, d) => (
                  <button
                    key={d}
                    className={'chip' + (weekdays.includes(d) ? ' on' : '')}
                    onClick={() => toggleWeekday(d)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Horários">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {times.map((t, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="time"
                      className="input"
                      value={t}
                      onChange={(e) => setTimeAt(i, e.target.value)}
                      style={{ width: 120 }}
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(i)}
                        title="Remover horário"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: UI.inkMuted2, fontSize: 16 }}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                <button className="chip" type="button" onClick={addTime}>
                  + horário
                </button>
              </div>
            </Field>
          </div>
        )}

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Field label="Formato">
            <SegmentedControl<ScheduleFormat>
              value={format}
              onChange={setFormat}
              options={[
                { value: 'feed', label: 'Feed (1 imagem)' },
                { value: 'carousel', label: 'Carrossel' },
                { value: 'reels', label: '🎬 Reels' },
              ]}
            />
          </Field>

          {/* REELS: vídeo de demonstração do app real (gerado no servidor) */}
          {format === 'reels' ? (
            <>
              <Field label="Roteiro do vídeo">
                <select className="input" value={flow} onChange={(e) => setFlow(e.target.value as ReelFlow)}>
                  {REEL_FLOWS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Onde publicar">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([['reels', 'Reels'], ['story', 'Story']] as [StoryTarget, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={'chip' + (reelTargets.includes(value) ? ' on' : '')}
                      onClick={() => toggleTarget(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          ) : (
            <>
              {format === 'carousel' && (
                <Field label="Nº de telas">
                  <input
                    type="number"
                    min={2}
                    max={10}
                    className="input"
                    value={slides}
                    onChange={(e) => setSlides(Math.min(10, Math.max(2, Number(e.target.value) || 3)))}
                  />
                </Field>
              )}
              <Field label="Fundo por IA">
                <SegmentedControl value={imageMode} onChange={setImageMode} options={imageModes} />
              </Field>
              <Field label="Tema (opcional)">
                <input
                  className="input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Deixe vazio para a IA escolher"
                />
              </Field>
            </>
          )}
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <Button loading={saving} onClick={() => void submit()}>
            {mode === 'recurring'
              ? '🔁 Criar recorrência'
              : format === 'reels'
                ? '🎬 Agendar Reel'
                : '📅 Agendar publicação'}
          </Button>
        </div>
      </Card>

      {/* Recorrências ativas */}
      {rules.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: UI.ink }}>🔁 Recorrências</span>
            <Badge tone="accent">{rules.length}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((r) => (
              <RuleRow key={r.id} rule={r} onDelete={() => void doDeleteRule(r.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Fila */}
      {!loadingJobs && jobs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: UI.ink }}>Fila</span>
          {pending > 0 && <Badge tone="accent">{pending} pendente{pending > 1 ? 's' : ''}</Badge>}
        </div>
      )}
      {loadingJobs ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} radius={14} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <EmptyState icon="📅" title="Nenhum agendamento" hint="Programe seu primeiro post automático no formulário acima." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} onCancel={() => void doCancel(j.id)} />
          ))}
        </div>
      )}
      <Toast message={toast} />
    </div>
  )
}

function JobRow({ job, onCancel }: { job: ScheduleJob; onCancel: () => void }) {
  const when = new Date(job.scheduled_for)
  const tone = STATUS_TONE[job.status] ?? 'neutral'
  return (
    <Card pad="14px 18px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: UI.surfaceAlt,
            border: '1px solid ' + UI.border,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            flex: 'none',
          }}
        >
          {formatIcon(job.format)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: UI.ink }}>
            {when.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}{' '}
            {when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontSize: 12, color: UI.inkMuted2 }}>
            {describeContent(job)}
            {job.theme ? ` · "${job.theme}"` : ''}
          </span>
        </div>
        <Badge tone={tone}>{STATUS_LABEL[job.status] ?? job.status}</Badge>
        {job.status === 'error' && job.last_error && (
          <span style={{ fontSize: 12, color: 'var(--danger)', flex: 1, minWidth: 160 }}>{job.last_error}</span>
        )}
        <div style={{ flex: 1 }} />
        {(job.status === 'pending' || job.status === 'error') && (
          <Button size="sm" variant="danger" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  )
}

function RuleRow({ rule, onDelete }: { rule: ScheduleRule; onDelete: () => void }) {
  return (
    <Card pad="14px 18px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: UI.surfaceAlt,
            border: '1px solid ' + UI.border,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            flex: 'none',
          }}
        >
          🔁
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: UI.ink }}>{describeRule(rule)}</span>
          <span style={{ fontSize: 12, color: UI.inkMuted2 }}>
            {describeContent(rule)}
            {rule.theme ? ` · "${rule.theme}"` : ''}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <Button size="sm" variant="danger" onClick={onDelete}>
          Remover
        </Button>
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: UI.inkMuted2,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
