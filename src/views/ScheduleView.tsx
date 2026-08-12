import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { ClientConfig } from '../clients'
import {
  cancelSchedule,
  createSchedule,
  fetchScheduleRecommendation,
  listSchedule,
} from '../lib/api'
import type { ScheduleFormat, ScheduleJob, ScheduleRecommendation } from '../lib/api'
import { RADIUS, UI } from '../ui/theme'
import { Badge, Button, Card, EmptyState, SectionHeader, SegmentedControl, Spinner, Toast, useToast } from '../ui/components'

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

  const applyRecommendation = () => {
    if (!rec || !rec.hours.length) return
    const d = new Date()
    d.setHours(rec.hours[0], 0, 0, 0)
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    flash('Horário recomendado aplicado')
  }

  return (
    <div className="app-container app-pad" style={{ paddingTop: 26, paddingBottom: 96 }}>
      <SectionHeader
        title="Agenda"
        subtitle="Programe posts para o piloto automático: no horário, o servidor gera, renderiza a arte e publica sozinho no Instagram."
      />

      {/* Recomendação */}
      {rec && (
        <Card style={{ marginBottom: 18, background: UI.dark, color: UI.darkText, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Recomendação</span>
            <Badge tone="accent">com base no desempenho</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: UI.darkTextMuted2 }}>{rec.rationale}</p>
          {rec.hours.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Button size="sm" variant="accent" onClick={applyRecommendation}>
                Usar {rec.hours[0]}h no formulário
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Formulário */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Field label="Quando publicar">
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              style={inputStyle}
            />
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
                value={slides}
                onChange={(e) => setSlides(Math.min(10, Math.max(2, Number(e.target.value) || 3)))}
                style={inputStyle}
              />
            </Field>
          )}
          <Field label="Fundo por IA">
            <SegmentedControl value={imageMode} onChange={setImageMode} options={imageModes} />
          </Field>
          <Field label="Tema (opcional)">
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Deixe vazio para a IA escolher"
              style={inputStyle}
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
      {loadingJobs ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: UI.inkMuted }}>
            <Spinner size={18} /> Carregando agendamentos…
          </div>
        </Card>
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
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
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
          <span style={{ fontSize: 12, color: '#B91C1C', flex: 1, minWidth: 160 }}>{job.last_error}</span>
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
          fontFamily: "'JetBrains Mono', monospace",
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

const inputStyle: CSSProperties = {
  border: '1px solid ' + UI.border,
  background: '#fff',
  borderRadius: RADIUS.md,
  padding: '10px 12px',
  fontSize: 14,
  color: UI.ink,
  width: '100%',
  fontFamily: 'inherit',
}
