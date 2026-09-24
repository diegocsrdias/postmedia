import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { UI } from '../ui/theme'
import { Badge, BlockTitle, Button, Card, EmptyState, Field, HighlightCard, SectionHeader, SegmentedControl, Skeleton, Toast, useToast } from '../ui/components'
import { Icon, type IconName } from '../ui/icons'

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

/** Ícone do formato. */
const formatIcon = (format: string): IconName => (format === 'reels' ? 'video' : format === 'carousel' ? 'layers' : 'square')

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
        flash(materialized > 0 ? `Recorrência criada — ${materialized} já na fila` : 'Recorrência criada')
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
        flash(isReels ? 'Reel agendado' : 'Post agendado')
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
    <div className="app-container app-pad" style={{ paddingTop: 28, paddingBottom: 96 }}>
      <SectionHeader
        title="Agenda"
        subtitle="Programe posts para o piloto automático, uma vez ou de forma recorrente (ex.: todo dia às 9h, 12h e 18h). No horário, o servidor gera, renderiza e publica sozinho."
      />

      {/* Recomendação (quantidade + horários) */}
      {rec && (
        <HighlightCard style={{ marginBottom: 18 }}>
          <BlockTitle
            icon="bulb"
            title="Recomendação"
            right={<Badge tone="accent">{rec.basedOn > 0 ? `com base em ${rec.basedOn} posts` : 'padrão inicial'}</Badge>}
          />
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 16 }}>
            <Field label="Posts por dia">
              <div style={{ fontSize: 26, fontWeight: 700, color: UI.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{rec.perDay}×</div>
            </Field>
            {rec.hours.length > 0 && (
              <Field label="Melhores horários · toque para usar">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {rec.hours.map((h) => (
                    <button key={h} className="chip on" onClick={() => applyHour(h)}>
                      <Icon name="clock" size={13} />
                      {h}h
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13.5, lineHeight: 1.6, color: UI.inkMuted, maxWidth: 760 }}>{rec.rationale}</p>
        </HighlightCard>
      )}

      {/* Formulário */}
      <Card style={{ marginBottom: 26 }}>
        <BlockTitle icon="plus" title="Novo agendamento" />

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '20px 0 18px', alignItems: 'flex-start' }}>
          {/* Frequência: uma vez ou recorrente */}
          <Field label="Frequência">
            <SegmentedControl<'once' | 'recurring'>
              value={mode}
              onChange={setMode}
              ariaLabel="Frequência"
              options={[
                { value: 'once', label: 'Uma vez', icon: 'calendar' },
                { value: 'recurring', label: 'Recorrente', icon: 'repeat' },
              ]}
            />
          </Field>

          {/* Quando publicar — muda conforme a frequência */}
          {mode === 'once' && (
            <Field label="Quando publicar" style={{ width: 240 }}>
              <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} style={{ padding: '8px 12px' }} />
            </Field>
          )}
        </div>

        {mode === 'recurring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 18 }}>
            <Field label="Dias da semana" hint="Nenhum marcado = todo dia">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {WEEKDAYS.map((label, d) => (
                  <button
                    key={d}
                    className={'chip' + (weekdays.includes(d) ? ' on' : '')}
                    aria-pressed={weekdays.includes(d)}
                    onClick={() => toggleWeekday(d)}
                    type="button"
                    style={{ minWidth: 50, justifyContent: 'center' }}
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
                      style={{ width: 118, padding: '8px 12px' }}
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => removeTime(i)}
                        title="Remover horário"
                        aria-label="Remover horário"
                        style={{ border: 'none', background: 'transparent' }}
                      >
                        <Icon name="x" size={15} />
                      </button>
                    )}
                  </span>
                ))}
                <button className="chip" type="button" onClick={addTime}>
                  <Icon name="plus" size={13} />
                  horário
                </button>
              </div>
            </Field>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 18px' }} />

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <Field label="Formato">
            <SegmentedControl<ScheduleFormat>
              value={format}
              onChange={setFormat}
              ariaLabel="Formato"
              options={[
                { value: 'feed', label: 'Feed', icon: 'square' },
                { value: 'carousel', label: 'Carrossel', icon: 'layers' },
                { value: 'reels', label: 'Reels', icon: 'video' },
              ]}
            />
          </Field>

          {/* REELS: vídeo de demonstração do app real (gerado no servidor) */}
          {format === 'reels' ? (
            <>
              <Field label="Roteiro do vídeo">
                <select className="select" value={flow} onChange={(e) => setFlow(e.target.value as ReelFlow)} style={{ padding: '8px 34px 8px 12px' }}>
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
                      aria-pressed={reelTargets.includes(value)}
                      className={'chip' + (reelTargets.includes(value) ? ' on' : '')}
                      onClick={() => toggleTarget(value)}
                    >
                      {reelTargets.includes(value) && <Icon name="check" size={13} />}
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
                    style={{ padding: '8px 12px', maxWidth: 120 }}
                  />
                </Field>
              )}
              <Field label="Foto de fundo (OpenAI)">
                <SegmentedControl value={imageMode} onChange={setImageMode} options={imageModes} ariaLabel="Foto de fundo" />
              </Field>
              <Field label="Tema (opcional)">
                <input
                  className="input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Vazio = a IA escolhe"
                  style={{ padding: '8px 12px' }}
                />
              </Field>
            </>
          )}
        </div>
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            loading={saving}
            icon={mode === 'recurring' ? 'repeat' : format === 'reels' ? 'video' : 'calendar'}
            onClick={() => void submit()}
          >
            {mode === 'recurring' ? 'Criar recorrência' : format === 'reels' ? 'Agendar Reel' : 'Agendar publicação'}
          </Button>
        </div>
      </Card>

      {/* Recorrências ativas */}
      {rules.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <ListHeading icon="repeat" title="Recorrências" count={rules.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((r) => (
              <RuleRow key={r.id} rule={r} onDelete={() => void doDeleteRule(r.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Fila */}
      <section>
        <ListHeading icon="clock" title="Fila" count={pending > 0 ? pending : undefined} countLabel={pending > 1 ? 'pendentes' : 'pendente'} />
        {loadingJobs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={64} radius={14} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState icon="calendar" title="Nenhum agendamento" hint="Programe seu primeiro post automático no formulário acima." />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.map((j) => (
              <JobRow key={j.id} job={j} onCancel={() => void doCancel(j.id)} />
            ))}
          </div>
        )}
      </section>
      <Toast message={toast} />
    </div>
  )
}

function ListHeading({ icon, title, count, countLabel }: { icon: IconName; title: string; count?: number; countLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon name={icon} size={16} style={{ color: UI.inkMuted2 }} />
      <span style={{ fontWeight: 700, fontSize: 15, color: UI.ink }}>{title}</span>
      {count != null && (
        <Badge tone="accent">
          {count}
          {countLabel ? ' ' + countLabel : ''}
        </Badge>
      )}
    </div>
  )
}

/** Quadradinho de ícone à esquerda das linhas da fila/recorrências. */
function RowIcon({ name }: { name: IconName }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        background: UI.surfaceAlt,
        border: '1px solid ' + UI.border,
        display: 'grid',
        placeItems: 'center',
        color: UI.inkMuted,
        flex: 'none',
      }}
    >
      <Icon name={name} size={18} />
    </div>
  )
}

function JobRow({ job, onCancel }: { job: ScheduleJob; onCancel: () => void }) {
  const when = new Date(job.scheduled_for)
  const tone = STATUS_TONE[job.status] ?? 'neutral'
  return (
    <Card pad="12px 14px 12px 16px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <RowIcon name={formatIcon(job.format)} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150, flex: '1 1 200px' }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: UI.ink }}>
            {when.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} ·{' '}
            {when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontSize: 12.5, color: UI.inkMuted2 }}>
            {describeContent(job)}
            {job.theme ? ` · "${job.theme}"` : ''}
          </span>
          {job.status === 'error' && job.last_error && (
            <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{job.last_error}</span>
          )}
        </div>
        <Badge tone={tone}>{STATUS_LABEL[job.status] ?? job.status}</Badge>
        {(job.status === 'pending' || job.status === 'error') && (
          <button className="icon-btn danger" onClick={onCancel} title="Cancelar este agendamento">
            <Icon name="x" size={15} />
            Cancelar
          </button>
        )}
      </div>
    </Card>
  )
}

function RuleRow({ rule, onDelete }: { rule: ScheduleRule; onDelete: () => void }) {
  return (
    <Card pad="12px 14px 12px 16px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <RowIcon name="repeat" />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180, flex: '1 1 220px' }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: UI.ink }}>{describeRule(rule)}</span>
          <span style={{ fontSize: 12.5, color: UI.inkMuted2 }}>
            {describeContent(rule)}
            {rule.theme ? ` · "${rule.theme}"` : ''}
          </span>
        </div>
        <button className="icon-btn danger" onClick={onDelete} title="Remover esta recorrência">
          <Icon name="trash" size={15} />
          Remover
        </button>
      </div>
    </Card>
  )
}

