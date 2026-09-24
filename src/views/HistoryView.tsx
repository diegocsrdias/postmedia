import { useEffect, useState } from 'react'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS } from '../data/shared'
import { fetchHistory } from '../lib/api'
import type { HistoryItem } from '../lib/api'
import { saveBlob } from '../lib/export'
import type { Angle } from '../types'
import { FONT, RADIUS, UI } from '../ui/theme'
import { Badge, Button, Card, EmptyState, Field, SectionHeader, SegmentedControl, Skeleton, Toast, useToast } from '../ui/components'
import { Icon, type IconName } from '../ui/icons'

const STATUS_FILTERS: { value: 'all' | 'published' | 'downloaded'; label: string; icon?: IconName }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'published', label: 'Postados', icon: 'send' },
  { value: 'downloaded', label: 'Baixados', icon: 'download' },
]

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
    ' · ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function HistoryView({ client }: { client: ClientConfig }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const { toast, flash } = useToast()

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
    <div className="app-container app-pad" style={{ paddingTop: 28, paddingBottom: 96 }}>
      <SectionHeader
        title="Histórico"
        subtitle="Tudo que você já postou ou baixou. Os posts publicados mostram as métricas assim que a sincronização diária roda."
        right={
          <SegmentedControl<StatusFilter>
            value={status}
            onChange={setStatus}
            ariaLabel="Filtrar por status"
            options={STATUS_FILTERS}
          />
        }
      />

      {!loading && !err && items.length > 0 && (
        <div style={{ display: 'flex', gap: 18, marginBottom: 18, color: UI.inkMuted2, fontSize: 13, flexWrap: 'wrap' }}>
          <span>
            <strong style={{ color: UI.ink }}>{items.length}</strong> criativos
          </span>
          {status === 'all' && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="send" size={13} /> <strong style={{ color: UI.ink }}>{published}</strong> postados
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="download" size={13} /> <strong style={{ color: UI.ink }}>{downloaded}</strong> baixados
              </span>
            </>
          )}
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
          <EmptyState icon="x" title="Não consegui carregar o histórico" hint={err} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="history"
            title="Nada por aqui ainda"
            hint={`Gere um criativo de ${client.name} no Estúdio e baixe ou publique. Ele aparece aqui com a imagem, os dados e, se foi postado, as métricas.`}
          />
        </Card>
      ) : (
        <div className="history-grid">
          {items.map((it) => (
            <HistoryCard key={it.id} it={it} onOpen={() => setSelected(it)} />
          ))}
        </div>
      )}

      {selected && <DetailModal it={selected} onClose={() => setSelected(null)} flash={flash} />}
      <Toast message={toast} />
    </div>
  )
}

function HistoryCard({ it, onOpen }: { it: HistoryItem; onOpen: () => void }) {
  const published = it.status === 'published'
  const isVideo = it.media_kind === 'video'
  return (
    <button
      className="pressable"
      onClick={onOpen}
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: 0,
        color: 'inherit',
      }}
    >
      <div style={{ position: 'relative', background: UI.surfaceAlt, aspectRatio: '1 / 1', width: '100%' }}>
        {it.media_url ? (
          isVideo ? (
            <video src={it.media_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <img
              src={it.media_url}
              alt={it.headline || 'criativo'}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: UI.inkMuted2 }}>
            <Icon name="image" size={28} />
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
          <Badge tone="dark" icon={published ? 'send' : 'download'} style={published ? { color: 'var(--success)' } : undefined}>
            {published ? 'Postado' : 'Baixado'}
          </Badge>
        </div>
        {(it.format || isVideo) && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <Badge tone="dark" icon={isVideo ? 'video' : undefined}>
              {FORMAT_LABELS[it.format ?? ''] ?? it.format ?? 'Vídeo'}
            </Badge>
          </div>
        )}
      </div>

      <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, width: '100%' }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: UI.ink,
            lineHeight: 1.35,
            minHeight: 36,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {it.headline || it.caption?.slice(0, 80) || '—'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {it.angle && <Badge tone="accent">{ANGLE_LABELS[it.angle as Angle] ?? it.angle}</Badge>}
          <span style={{ fontSize: 11.5, color: UI.inkMuted2 }}>{fmtDate(it.published_at || it.created_at)}</span>
        </div>

        {published && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 2, fontSize: 12, color: UI.inkMuted }}>
            <Metric icon="eye" value={it.reach} />
            <Metric icon="heart" value={it.like_count} />
            <Metric icon="bookmark" value={it.saved} />
            <Metric icon="share" value={it.shares} />
          </div>
        )}
      </div>
    </button>
  )
}

function Metric({ icon, value }: { icon: IconName; value: number | null }) {
  if (value == null) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={13} /> <strong style={{ color: UI.ink }}>{value.toLocaleString('pt-BR')}</strong>
    </span>
  )
}

/* ============================================================
   Modal de detalhe
   ============================================================ */

function DetailModal({ it, onClose, flash }: { it: HistoryItem; onClose: () => void; flash: (m: string) => void }) {
  const published = it.status === 'published'
  const isVideo = it.media_kind === 'video'
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Baixa o arquivo salvo (o atributo `download` não vale para outra origem, então vai por blob). */
  const download = async () => {
    if (!it.media_url || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(it.media_url)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const blob = await res.blob()
      const ext = (blob.type.split('/')[1] || (isVideo ? 'mp4' : 'jpg')).replace('jpeg', 'jpg').split(';')[0]
      saveBlob(blob, 'criativo-' + String(it.id).slice(0, 8) + '.' + ext)
      flash('Arquivo baixado')
    } catch (e) {
      flash('Falhou: ' + String((e as Error)?.message || e))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Detalhe do criativo" onClick={(e) => e.stopPropagation()}>
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
              <Icon name="image" size={40} style={{ color: UI.inkMuted2 }} />
            )}
          </div>

          {/* dados */}
          <div style={{ flex: '1 1 320px', minWidth: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone={published ? 'success' : 'neutral'} icon={published ? 'send' : 'download'}>
                {published ? 'Postado' : 'Baixado'}
              </Badge>
              {it.format && <Badge tone="neutral">{FORMAT_LABELS[it.format] ?? it.format}</Badge>}
              {it.angle && <Badge tone="accent">{ANGLE_LABELS[it.angle as Angle] ?? it.angle}</Badge>}
              <div style={{ flex: 1 }} />
              <button className="icon-btn" onClick={onClose} aria-label="Fechar" title="Fechar (Esc)">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: UI.ink, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {it.headline || '—'}
              </div>
              <div style={{ fontSize: 12, color: UI.inkMuted2, fontFamily: FONT.mono, marginTop: 6 }}>
                {fmtDate(it.published_at || it.created_at)}
              </div>
            </div>

            {published && (
              <div className="kpi-grid" style={{ gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))' }}>
                <MiniMetric icon="eye" label="Alcance" value={it.reach} />
                <MiniMetric icon="heart" label="Curtidas" value={it.like_count} />
                <MiniMetric icon="bookmark" label="Salvos" value={it.saved} />
                <MiniMetric icon="share" label="Compart." value={it.shares} />
                <MiniMetric icon="message" label="Coment." value={it.comments_count} />
              </div>
            )}

            {it.caption && (
              <Field label="Legenda">
                <div style={{ fontSize: 13.5, color: UI.inkMuted, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{it.caption}</div>
              </Field>
            )}
            {it.hashtags && (
              <Field label="Hashtags">
                <div style={{ fontSize: 13, color: 'var(--accent-hover)', lineHeight: 1.5 }}>{it.hashtags}</div>
              </Field>
            )}

            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {it.media_url && (
                <Button variant="ghost" icon="download" loading={downloading} onClick={() => void download()}>
                  {downloading ? 'Baixando…' : 'Baixar'}
                </Button>
              )}
              {published && it.permalink && (
                <a
                  href={it.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--ig)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '10px 16px',
                    borderRadius: RADIUS.md,
                    textDecoration: 'none',
                  }}
                >
                  Ver no Instagram
                  <Icon name="external" size={15} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ icon, label, value }: { icon: IconName; label: string; value: number | null }) {
  return (
    <div style={{ background: UI.surfaceAlt, border: '1px solid ' + UI.border, borderRadius: RADIUS.md, padding: '10px 12px' }}>
      <div style={{ fontSize: 11.5, color: UI.inkMuted2, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon name={icon} size={12} /> {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: value == null ? UI.inkMuted2 : UI.ink, marginTop: 2 }}>
        {value == null ? '—' : value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}
