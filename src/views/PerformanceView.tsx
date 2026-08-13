import { useEffect, useState } from 'react'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS } from '../data/shared'
import { fetchInsightsSummary, fetchLearnings } from '../lib/api'
import type { InsightsSummary, Learnings } from '../lib/api'
import type { Angle } from '../types'
import { UI, fieldLabel } from '../ui/theme'
import { Badge, Card, EmptyState, HighlightCard, SectionHeader, Skeleton, Stat, Toast, useToast } from '../ui/components'

// rótulos amigáveis dos formatos e layouts no painel de desempenho
const FORMAT_LABELS: Record<string, string> = {
  feed: 'Feed',
  reels: 'Reels',
  story: 'Story',
  carousel: 'Carrossel',
  trial_reel: 'Trial Reel',
}
const LAYOUT_LABELS: Record<string, string> = {
  ad: 'Anúncio',
  statement: 'Frase de impacto',
  list: 'Lista/dicas',
  question: 'Pergunta',
  feature: 'Recurso',
  quote: 'Citação',
  myth: 'Mito vs verdade',
}

export function PerformanceView({ client }: { client: ClientConfig }) {
  const [insights, setInsights] = useState<InsightsSummary | null>(null)
  const [learnings, setLearnings] = useState<Learnings | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast, flash } = useToast()

  useEffect(() => {
    let alive = true
    setLoading(true)
    setInsights(null)
    setLearnings(null)
    ;(async () => {
      try {
        const [ins, lrn] = await Promise.allSettled([
          fetchInsightsSummary(client.id),
          fetchLearnings(client.id),
        ])
        if (!alive) return
        if (ins.status === 'fulfilled') setInsights(ins.value)
        else flash('Não consegui carregar o desempenho')
        if (lrn.status === 'fulfilled') setLearnings(lrn.value.learnings)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id])

  const bestHour = insights?.byHour?.[0]
  const bestAngle = insights?.byAngle?.[0]
  const avgScore =
    insights && insights.count
      ? Math.round(insights.byFormat.reduce((s, r) => s + r.avg * r.n, 0) / Math.max(1, insights.byFormat.reduce((s, r) => s + r.n, 0)))
      : 0

  return (
    <div className="app-container app-pad" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <SectionHeader
        title="Desempenho"
        subtitle="O que vem funcionando melhor nesta conta. Estes aprendizados realimentam a IA que gera os criativos."
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={92} radius={14} />
            ))}
          </div>
          <Skeleton height={220} radius={14} />
        </div>
      ) : !insights || insights.count === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="Ainda sem métricas"
            hint={`Publique alguns criativos de ${client.name} e volte em ~1 dia. As métricas (alcance, salvos…) são sincronizadas automaticamente todo dia, e a IA passa a usá-las.`}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* KPIs */}
          <div className="kpi-grid">
            <Stat icon="🗂️" label="Posts com métrica" value={insights.count} hint={`de ${insights.totalPosts} no total`} />
            <Stat icon="📈" label="Score médio" value={avgScore.toLocaleString('pt-BR')} hint="alcance ou engajamento" />
            <Stat icon="⏰" label="Melhor horário" value={bestHour ? bestHour.key + 'h' : '—'} hint={bestHour ? `${bestHour.n}× medido` : undefined} />
            <Stat
              icon="🎯"
              label="Melhor ângulo"
              value={bestAngle ? ANGLE_LABELS[bestAngle.key as Angle] ?? bestAngle.key : '—'}
              hint={bestAngle ? `${bestAngle.n}× medido` : undefined}
            />
          </div>

          {/* Resumo qualitativo (learnings) */}
          {learnings?.brief && (
            <HighlightCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: UI.ink }}>O que a IA aprendeu</span>
                <Badge tone="accent">alimenta a geração</Badge>
              </div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: UI.inkMuted, whiteSpace: 'pre-wrap' }}>
                {learnings.brief}
              </p>
              {learnings.updated_at && (
                <p style={{ margin: '12px 0 0', fontSize: 11, color: UI.inkMuted2 }}>
                  Atualizado em {new Date(learnings.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </HighlightCard>
          )}

          <Card>
            <div style={{ fontSize: 12, color: UI.inkMuted2, marginBottom: 16 }}>
              Baseado em <strong style={{ color: UI.ink }}>{insights.count}</strong> post{insights.count > 1 ? 's' : ''} com
              métricas · score = alcance (ou engajamento quando não há alcance)
            </div>
            <div style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <InsightBlock
                title="⏰ Melhores horários"
                rows={insights.byHour.slice(0, 5).map((r) => ({ label: r.key + 'h', avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                title="🎯 Melhores ângulos"
                rows={insights.byAngle.slice(0, 5).map((r) => ({ label: ANGLE_LABELS[r.key as Angle] ?? r.key, avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                title="🧩 Melhores layouts"
                rows={(insights.byLayout ?? []).slice(0, 5).map((r) => ({ label: LAYOUT_LABELS[r.key] ?? r.key, avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                title="🖼️ Melhores formatos"
                rows={insights.byFormat.slice(0, 5).map((r) => ({ label: FORMAT_LABELS[r.key] ?? r.key, avg: r.avg, n: r.n }))}
              />
            </div>
          </Card>
        </div>
      )}
      <Toast message={toast} />
    </div>
  )
}

/** Uma seção do painel: título + linhas ranqueadas por média. */
function InsightBlock({ title, rows }: { title: string; rows: { label: string; avg: number; n: number }[] }) {
  if (!rows.length) return null
  const max = Math.max(...rows.map((r) => r.avg), 1)
  return (
    <div>
      <div style={{ ...fieldLabel, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 100, fontSize: 13, fontWeight: 600, color: UI.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.label}
            </span>
            <div style={{ flex: 1, height: 8, background: UI.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: Math.max(4, Math.round((r.avg / max) * 100)) + '%',
                  height: '100%',
                  background: i === 0 ? 'var(--accent)' : 'var(--accent-soft)',
                  borderRadius: 999,
                  transition: 'width .4s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: UI.inkMuted, width: 88, textAlign: 'right' }}>
              {r.avg.toLocaleString('pt-BR')} · {r.n}×
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
