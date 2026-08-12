import { useEffect, useState } from 'react'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS } from '../data/shared'
import { fetchHistory } from '../lib/api'
import type { HistoryItem } from '../lib/api'
import type { Angle } from '../types'
import { RADIUS, UI } from '../ui/theme'
import { Badge, Card, EmptyState, SectionHeader, SegmentedControl, Spinner } from '../ui/components'

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
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function HistoryView({ client }: { client: ClientConfig }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

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

  return (
    <div className="app-container app-pad" style={{ paddingTop: 26, paddingBottom: 96 }}>
      <SectionHeader
        title="Histórico"
        subtitle="Tudo que você já postou ou baixou. Os posts publicados mostram as métricas assim que a sincronização diária roda."
        right={
          <SegmentedControl<StatusFilter> value={status} onChange={setStatus} options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))} />
        }
      />

      {loading ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: UI.inkMuted }}>
            <Spinner size={18} /> Carregando histórico…
          </div>
        </Card>
      ) : err ? (
        <Card>
          <EmptyState
            icon="🗂️"
            title="Não consegui carregar o histórico"
            hint={err}
          />
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
            <HistoryCard key={it.id} it={it} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ it }: { it: HistoryItem }) {
  const published = it.status === 'published'
  const isVideo = it.media_kind === 'video'
  return (
    <div
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* thumbnail */}
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
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
          <Badge tone={published ? 'success' : 'neutral'}>{published ? '📤 Postado' : '⬇️ Baixado'}</Badge>
        </div>
        {it.format && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <Badge tone="dark">{FORMAT_LABELS[it.format] ?? it.format}</Badge>
          </div>
        )}
      </div>

      {/* corpo */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: UI.ink, lineHeight: 1.3, minHeight: 36 }}>
          {it.headline || it.caption?.slice(0, 60) || '—'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {it.angle && <Badge tone="accent">{ANGLE_LABELS[it.angle as Angle] ?? it.angle}</Badge>}
          <span style={{ fontSize: 11, color: UI.inkMuted2, alignSelf: 'center' }}>
            {fmtDate(it.published_at || it.created_at)}
          </span>
        </div>

        {published && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 2, fontSize: 12, color: UI.inkMuted }}>
            <Metric icon="👁️" label="Alcance" value={it.reach} />
            <Metric icon="❤️" label="Curtidas" value={it.like_count} />
            <Metric icon="🔖" label="Salvos" value={it.saved} />
            <Metric icon="↗️" label="Compart." value={it.shares} />
          </div>
        )}

        <div style={{ flex: 1 }} />
        {published && it.permalink && (
          <a
            href={it.permalink}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 700, color: UI.accent, textDecoration: 'none' }}
          >
            Ver no Instagram ↗
          </a>
        )}
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number | null }) {
  if (value == null) return null
  return (
    <span title={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} <strong style={{ color: UI.ink }}>{value.toLocaleString('pt-BR')}</strong>
    </span>
  )
}
