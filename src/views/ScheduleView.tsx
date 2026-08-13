import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientConfig } from '../clients'
import {
  cancelSchedule,
  createSchedule,
  fetchScheduleRecommendation,
  listSchedule,
} from '../lib/api'
import type { ScheduleFormat, ScheduleJob, ScheduleRecommendation } from '../lib/api'
import { FONT, UI } from '../ui/theme'
import { Badge, Button, Card, EmptyState, HighlightCard, SectionHeader, SegmentedControl, Skeleton, Toast, useToast } from '../ui/components'

/** Valor default do input datetime-local: daqui a 1h, no fuso local. */
function defaultWhen(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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

export function ScheduleView({ client }: { client: ClientConfig }) {
  const { toast, flash } = useToast()
  const [jobs, setJobs] = useState<ScheduleJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [rec, setRec] = useState<ScheduleRecommendation | null>(null)

  // form
  const [when, setWhen] = useState(defaultWhen)
  const [format, setFormat] = useState<ScheduleFormat>('feed')
  const [slides, setSlides] = useState(3)
  const [theme, setTheme] = useState('')
  const [imageMode, setImageMode] = useState<'none' | 'editorial' | 'promo'>('none')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const { jobs } = await listSchedule(client.id)
      setJobs(jobs)
    } catch {
      /* silencioso: sem backend ainda, a lista fica vazia */
    } finally {
      setLoadingJobs(false)
    }
  }, [client.id])

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
    const scheduledFor = new Date(when)
    if (isNaN(scheduledFor.getTime())) {
      flash('Data/hora inválida')
      return
    }
    setSaving(true)
    try {
      await createSchedule({
        client: client.id,
        scheduledFor: scheduledFor.toISOString(),
        format,
        slides: format === 'carousel' ? slides : 1,
        theme: theme.trim() || undefined,
        imageMode,
      })
      flash('Post agendado! 📅')
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

  /** Aplica um horário recomendado ao formulário (próxima ocorrência dessa hora). */
  const applyHour = (hour: number) => {
    const d = new Date()
    d.setHours(hour, 0, 0, 0)
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    flash(`Horário ${hour}h aplicado`)
  }

  const pending = jobs.filter((j) => j.status === 'pending').length

  return (
    <div className="app-container app-pad" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <SectionHeader
        title="Agenda"
        subtitle="Programe posts para o piloto automático: no horário, o servidor gera, renderiza a arte e publica sozinho no Instagram."
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
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Field label="Quando publicar">
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
          <Field label="Formato">
            <SegmentedControl<ScheduleFormat>
              value={format}
              onChange={setFormat}
              options={[
                { value: 'feed', label: 'Feed (1 imagem)' },
                { value: 'carousel', label: 'Carrossel' },
              ]}
            />
          </Field>
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
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <Button loading={saving} onClick={() => void submit()}>
            📅 Agendar publicação automática
          </Button>
        </div>
      </Card>

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
          {job.format === 'carousel' ? '📚' : '🖼️'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: UI.ink }}>
            {when.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}{' '}
            {when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontSize: 12, color: UI.inkMuted2 }}>
            {job.format === 'carousel' ? `Carrossel · ${job.slides} telas` : 'Feed'}
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
