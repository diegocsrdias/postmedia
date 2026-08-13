import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS } from '../data/shared'
import { fetchHistory } from '../lib/api'
import type { HistoryItem } from '../lib/api'
import type { Angle } from '../types'
import { FONT, RADIUS, UI } from '../ui/theme'
import { Badge, Card, EmptyState, SectionHeader, SegmentedControl, Skeleton } from '../ui/components'

const STATUS_FILTERS = [
  { value: 'all', label: 'Tudo' },
  { value: 'published', label: '📤 Postados' },
  { value: 'downloaded', label: '⬇️ Baixados' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

const FORMAT_LABELS: Record<string, string> = {
  feed: 'Feed',
  story: 'Story',
  reels: 'Reels',
  carousel: 'Carrossel',
  trial_reel: 'Trial Reel',
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function HistoryView({ client }: { client: ClientConfig }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<HistoryItem | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr('')
    ;(async () => {
      try {
        const { items } = await fetchHistory(client.id, {
          status: status === 'all' ? undefined : status,
          limit: 120,
        })
        if (alive) setItems(items)
      } catch (e) {
        if (alive) setErr(String((e as Error)?.message || e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [client.id, status])

  const published = items.filter((i) => i.status === 'published').length
  const downloaded = items.length - published

  return (
    <div className="app-container app-pad" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <SectionHeader
        title="Histórico"
        subtitle="Tudo que você já postou ou baixou. Os posts publicados mostram as métricas assim que a sincronização diária roda."
        right={
          <SegmentedControl<StatusFilter>
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
          />
        }
      />

      {!loading && !err && items.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, color: UI.inkMuted2, fontSize: 13 }}>
          <span>
            <strong style={{ color: UI.ink }}>{items.length}</strong> criativos
          </span>
          <span>📤 <strong style={{ color: UI.ink }}>{published}</strong> postados</span>
          <span>⬇️ <strong style={{ color: UI.ink }}>{downloaded}</strong> baixados</span>
        </div>
      )}

      {loading ? (
        <div className="history-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton height={0} style={{ aspectRatio: '1 / 1', height: 'auto', paddingBottom: '100%' }} radius={14} />
              <Skeleton height={13} width="80%" />
              <Skeleton height={11} width="50%" />
            </div>
          ))}
        </div>
      ) : err ? (
        <Card>
          <EmptyState icon="🗂️" title="Não consegui carregar o histórico" hint={err} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗂️"
            title="Nada por aqui ainda"
            hint={`Gere um criativo de ${client.name} no Estúdio e baixe ou publique — ele aparece aqui com foto, dados e (se postado) as métricas.`}
          />
        </Card>
      ) : (
        <div className="history-grid">
          {items.map((it) => (
            <HistoryCard key={it.id} it={it} onOpen={() => setSelected(it)} />
          ))}
        </div>
      )}

      {selected && <DetailModal it={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function HistoryCard({ it, onOpen }: { it: HistoryItem; onOpen: () => void }) {
  const published = it.status === 'published'
  const isVideo = it.media_kind === 'video'
  return (
    <div
      className="pressable"
      onClick={onOpen}
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', background: UI.surfaceAlt, aspectRatio: '1 / 1' }}>
        {it.media_url ? (
          isVideo ? (
            <video src={it.media_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={it.media_url} alt={it.headline || 'criativo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            🖼️
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <Badge tone={published ? 'success' : 'neutral'}>{published ? '📤 Postado' : '⬇️ Baixado'}</Badge>
        </div>
        {it.format && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <Badge tone="dark">{FORMAT_LABELS[it.format] ?? it.format}</Badge>
          </div>
        )}
      </div>

      <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: UI.ink, lineHeight: 1.3, minHeight: 35 }}>
          {it.headline || it.caption?.slice(0, 60) || '—'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {it.angle && <Badge tone="accent">{ANGLE_LABELS[it.angle as Angle] ?? it.angle}</Badge>}
          <span style={{ fontSize: 11, color: UI.inkMuted2 }}>{fmtDate(it.published_at || it.created_at)}</span>
        </div>

        {published && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2, fontSize: 12, color: UI.inkMuted }}>
            <Metric icon="👁️" value={it.reach} />
            <Metric icon="❤️" value={it.like_count} />
            <Metric icon="🔖" value={it.saved} />
            <Metric icon="↗️" value={it.shares} />
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ icon, value }: { icon: string; value: number | null }) {
  if (value == null) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} <strong style={{ color: UI.ink }}>{value.toLocaleString('pt-BR')}</strong>
    </span>
  )
}

/* ============================================================
   Modal de detalhe
   ============================================================ */

function DetailModal({ it, onClose }: { it: HistoryItem; onClose: () => void }) {
  const published = it.status === 'published'
  const isVideo = it.media_kind === 'video'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* mídia */}
          <div
            style={{
              flex: '1 1 300px',
              background: UI.surfaceAlt,
              minHeight: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            {it.media_url ? (
              isVideo ? (
                <video src={it.media_url} controls style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }} />
              ) : (
                <img src={it.media_url} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }} />
              )
            ) : (
              <div style={{ fontSize: 40 }}>🖼️</div>
            )}
          </div>

          {/* dados */}
          <div style={{ flex: '1 1 320px', minWidth: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone={published ? 'success' : 'neutral'}>{published ? '📤 Postado' : '⬇️ Baixado'}</Badge>
              {it.format && <Badge tone="dark">{FORMAT_LABELS[it.format] ?? it.format}</Badge>}
              {it.angle && <Badge tone="accent">{ANGLE_LABELS[it.angle as Angle] ?? it.angle}</Badge>}
              <div style={{ flex: 1 }} />
              <button
                className="ui-btn"
                onClick={onClose}
                style={{ background: UI.surfaceAlt, border: '1px solid ' + UI.border, borderRadius: 999, width: 32, height: 32, cursor: 'pointer', color: UI.inkMuted, fontSize: 15 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 19, fontWeight: 800, color: UI.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {it.headline || '—'}
            </div>
            <div style={{ fontSize: 12, color: UI.inkMuted2, fontFamily: FONT.mono }}>
              {fmtDate(it.published_at || it.created_at)}
            </div>

            {published && (
              <div className="kpi-grid" style={{ gap: 10 }}>
                <MiniMetric icon="👁️" label="Alcance" value={it.reach} />
                <MiniMetric icon="❤️" label="Curtidas" value={it.like_count} />
                <MiniMetric icon="🔖" label="Salvos" value={it.saved} />
                <MiniMetric icon="↗️" label="Compart." value={it.shares} />
                <MiniMetric icon="💬" label="Coment." value={it.comments_count} />
              </div>
            )}

            {it.caption && (
              <Field label="Legenda">
                <div style={{ fontSize: 13.5, color: UI.inkMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{it.caption}</div>
              </Field>
            )}
            {it.hashtags && (
              <Field label="Hashtags">
                <div style={{ fontSize: 13, color: 'var(--accent-hover)', lineHeight: 1.5 }}>{it.hashtags}</div>
              </Field>
            )}

            <div style={{ flex: 1 }} />
            {published && it.permalink && (
              <a
                href={it.permalink}
                target="_blank"
                rel="noreferrer"
                className="ui-btn"
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--ig)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 13.5,
                  padding: '10px 18px',
                  borderRadius: 999,
                  textDecoration: 'none',
                }}
              >
                Ver no Instagram ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ icon, label, value }: { icon: string; label: string; value: number | null }) {
  return (
    <div style={{ background: UI.surfaceAlt, border: '1px solid ' + UI.border, borderRadius: RADIUS.md, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: UI.inkMuted2 }}>{icon} {label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: value == null ? UI.inkMuted2 : UI.ink }}>
        {value == null ? '—' : value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: UI.inkMuted2 }}>
        {label}
      </span>
      {children}
    </div>
  )
}
