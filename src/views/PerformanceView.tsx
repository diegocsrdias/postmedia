import { useCallback, useEffect, useState } from 'react'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS } from '../data/shared'
import { fetchInsightsSummary, fetchLearnings, importInstagram } from '../lib/api'
import type { InsightsSummary, Learnings } from '../lib/api'
import type { Angle } from '../types'
import { UI } from '../ui/theme'
import { Badge, BlockTitle, Button, Card, EmptyState, HighlightCard, SectionHeader, Skeleton, Stat, Toast, useToast } from '../ui/components'
import { Icon, type IconName } from '../ui/icons'

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
  const [importing, setImporting] = useState(false)
  const { toast, flash } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ins, lrn] = await Promise.allSettled([
        fetchInsightsSummary(client.id),
        fetchLearnings(client.id),
      ])
      if (ins.status === 'fulfilled') setInsights(ins.value)
      else flash('Não consegui carregar o desempenho')
      if (lrn.status === 'fulfilled') setLearnings(lrn.value.learnings)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id])

  useEffect(() => {
    setInsights(null)
    setLearnings(null)
    void load()
  }, [load])

  // Importa o que já foi postado na conta conectada (hoje o DinDin), pra o
  // aprendizado não começar zerado. Idempotente: rerodar só traz o que falta.
  const runImport = async () => {
    if (importing) return
    setImporting(true)
    flash('Importando posts do Instagram…')
    try {
      const r = await importInstagram(client.id)
      flash(
        r.imported > 0
          ? `Importados ${r.imported} posts do Instagram`
          : r.account_media === 0
            ? 'Nenhum post encontrado na conta conectada'
            : 'Tudo já estava importado — nada novo',
      )
      await load()
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
    } finally {
      setImporting(false)
    }
  }

  const bestHour = insights?.byHour?.[0]
  const bestAngle = insights?.byAngle?.[0]
  const avgScore =
    insights && insights.count
      ? Math.round(insights.byFormat.reduce((s, r) => s + r.avg * r.n, 0) / Math.max(1, insights.byFormat.reduce((s, r) => s + r.n, 0)))
      : 0

  return (
    <div className="app-container app-pad" style={{ paddingTop: 28, paddingBottom: 96 }}>
      <SectionHeader
        title="Desempenho"
        subtitle="O que vem funcionando melhor nesta conta. Estes aprendizados realimentam a IA que gera os criativos."
        right={
          <Button
            variant="ghost"
            icon="download"
            loading={importing}
            onClick={() => void runImport()}
            title="Puxa os posts que já existem na conta do Instagram para a base de aprendizado"
          >
            {importing ? 'Importando…' : 'Importar do Instagram'}
          </Button>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={100} radius={14} />
            ))}
          </div>
          <Skeleton height={220} radius={14} />
        </div>
      ) : !insights || insights.count === 0 ? (
        <Card>
          <EmptyState
            icon="chart"
            title="Ainda sem métricas"
            hint={`Importe os posts que já existem no Instagram de ${client.name} para começar com dados reais. Ou publique pelo app: as métricas entram sozinhas, sincronizadas todo dia.`}
            action={
              <Button icon="download" loading={importing} onClick={() => void runImport()}>
                {importing ? 'Importando…' : 'Importar do Instagram'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* KPIs */}
          <div className="kpi-grid">
            <Stat icon="history" label="Posts com métrica" value={insights.count} hint={`de ${insights.totalPosts} no total`} />
            <Stat icon="chart" label="Score médio" value={avgScore.toLocaleString('pt-BR')} hint="alcance ou engajamento" />
            <Stat icon="clock" label="Melhor horário" value={bestHour ? bestHour.key + 'h' : '—'} hint={bestHour ? `${bestHour.n}× medido` : undefined} />
            <Stat
              icon="target"
              label="Melhor ângulo"
              value={bestAngle ? ANGLE_LABELS[bestAngle.key as Angle] ?? bestAngle.key : '—'}
              hint={bestAngle ? `${bestAngle.n}× medido` : undefined}
            />
          </div>

          {/* Resumo qualitativo (learnings) */}
          {learnings?.brief && (
            <HighlightCard>
              <BlockTitle icon="brain" title="O que a IA aprendeu" right={<Badge tone="accent">alimenta a geração</Badge>} />
              <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.65, color: UI.inkMuted, whiteSpace: 'pre-wrap', maxWidth: 820 }}>
                {learnings.brief}
              </p>
              {learnings.updated_at && (
                <p style={{ margin: '12px 0 0', fontSize: 11.5, color: UI.inkMuted2 }}>
                  Atualizado em {new Date(learnings.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </HighlightCard>
          )}

          <Card>
            <div style={{ fontSize: 12.5, color: UI.inkMuted2, marginBottom: 20 }}>
              Baseado em <strong style={{ color: UI.ink }}>{insights.count}</strong> post{insights.count > 1 ? 's' : ''} com
              métricas · score = alcance (ou engajamento quando não há alcance)
            </div>
            <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <InsightBlock
                icon="clock"
                title="Melhores horários"
                rows={insights.byHour.slice(0, 5).map((r) => ({ label: r.key + 'h', avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                icon="target"
                title="Melhores ângulos"
                rows={insights.byAngle.slice(0, 5).map((r) => ({ label: ANGLE_LABELS[r.key as Angle] ?? r.key, avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                icon="history"
                title="Melhores layouts"
                rows={(insights.byLayout ?? []).slice(0, 5).map((r) => ({ label: LAYOUT_LABELS[r.key] ?? r.key, avg: r.avg, n: r.n }))}
              />
              <InsightBlock
                icon="image"
                title="Melhores formatos"
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
function InsightBlock({ icon, title, rows }: { icon: IconName; title: string; rows: { label: string; avg: number; n: number }[] }) {
  if (!rows.length) return null
  const max = Math.max(...rows.map((r) => r.avg), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, fontSize: 13, fontWeight: 600, color: UI.inkMuted }}>
        <Icon name={icon} size={15} style={{ color: 'var(--accent-hover)' }} />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 104,
                fontSize: 13,
                fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? UI.ink : UI.inkMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={r.label}
            >
              {r.label}
            </span>
            <div style={{ flex: 1, height: 8, background: UI.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: Math.max(4, Math.round((r.avg / max) * 100)) + '%',
                  height: '100%',
                  background: i === 0 ? 'var(--accent)' : 'rgba(139,108,255,.38)',
                  borderRadius: 999,
                  transition: 'width .4s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: UI.inkMuted2, width: 88, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {r.avg.toLocaleString('pt-BR')} · {r.n}×
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

