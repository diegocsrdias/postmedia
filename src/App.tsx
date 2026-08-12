import { useEffect, useMemo, useState } from 'react'
import { CLIENT_LIST, DEFAULT_CLIENT, getClient } from './clients'
import type { ClientId } from './clients'
import { StudioView } from './views/StudioView'
import { HistoryView } from './views/HistoryView'
import { ScheduleView } from './views/ScheduleView'
import { PerformanceView } from './views/PerformanceView'
import { FONT, RADIUS, UI } from './ui/theme'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** As telas do app. O id vira o hash da URL (#estudio, #historico…). */
const VIEWS = [
  { id: 'estudio', label: 'Estúdio', icon: '🎨' },
  { id: 'historico', label: 'Histórico', icon: '🗂️' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'desempenho', label: 'Desempenho', icon: '📊' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

function getInitialClientId(): ClientId {
  if (typeof window === 'undefined') return DEFAULT_CLIENT
  const stored = localStorage.getItem('creativeClientId')
  return CLIENT_LIST.some((item) => item.id === stored) ? (stored as ClientId) : DEFAULT_CLIENT
}

function getInitialView(): ViewId {
  if (typeof window === 'undefined') return 'estudio'
  const h = window.location.hash.replace('#', '')
  return VIEWS.some((v) => v.id === h) ? (h as ViewId) : 'estudio'
}

export default function App() {
  const [clientId, setClientId] = useState<ClientId>(getInitialClientId)
  const client = useMemo(() => getClient(clientId), [clientId])
  const [view, setView] = useState<ViewId>(getInitialView)

  useEffect(() => {
    localStorage.setItem('creativeClientId', clientId)
  }, [clientId])

  // mantém o hash da URL em sincronia com a tela ativa (e vice-versa)
  useEffect(() => {
    if (window.location.hash.replace('#', '') !== view) {
      window.history.replaceState(null, '', '#' + view)
    }
  }, [view])
  useEffect(() => {
    const onHash = () => setView(getInitialView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const todayLabel = useMemo(() => {
    const d = new Date()
    return d.getDate() + ' de ' + MONTHS[d.getMonth()] + '. ' + d.getFullYear()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: UI.bg }}>
      {/* ===== Top bar ===== */}
      <header
        className="app-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: UI.dark,
          color: UI.darkText,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <img
            src={client.images.logo}
            alt={client.name}
            style={{ width: 40, height: 40, objectFit: 'contain', flex: 'none' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
              Gerador de Criativos
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: UI.darkTextMuted2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {client.name}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value as ClientId)}
          aria-label="Cliente"
          style={{
            border: '1px solid rgba(255,255,255,0.14)',
            background: UI.darkAlt,
            color: UI.darkText,
            borderRadius: RADIUS.pill,
            padding: '9px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {CLIENT_LIST.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <span
          className="hide-mobile"
          style={{ fontFamily: FONT.mono, fontSize: 12, color: UI.darkTextMuted, letterSpacing: '0.08em' }}
        >
          {todayLabel}
        </span>
      </header>

      {/* ===== Nav (tabs no desktop) ===== */}
      <nav
        className="app-nav hide-mobile"
        style={{
          position: 'sticky',
          top: 72,
          zIndex: 20,
          background: UI.surface,
          borderBottom: '1px solid ' + UI.border,
        }}
      >
        <div className="app-container app-pad" style={{ display: 'flex', gap: 4 }}>
          {VIEWS.map((v) => (
            <NavTab key={v.id} active={view === v.id} onClick={() => setView(v.id)} icon={v.icon} label={v.label} />
          ))}
        </div>
      </nav>

      {/* ===== Conteúdo ===== */}
      <main>
        {view === 'estudio' && <StudioView client={client} />}
        {view === 'historico' && <HistoryView client={client} />}
        {view === 'agenda' && <ScheduleView client={client} />}
        {view === 'desempenho' && <PerformanceView client={client} />}
      </main>

      {/* ===== Bottom nav (mobile) ===== */}
      <nav className="bottom-nav show-mobile">
        {VIEWS.map((v) => {
          const active = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                cursor: 'pointer',
                color: active ? UI.ink : UI.inkMuted2,
              }}
            >
              <span style={{ fontSize: 20, opacity: active ? 1 : 0.7 }}>{v.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{v.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function NavTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'none',
        border: 'none',
        borderBottom: '2px solid ' + (active ? UI.ink : 'transparent'),
        padding: '14px 16px',
        fontSize: 14,
        fontWeight: active ? 800 : 600,
        color: active ? UI.ink : UI.inkMuted,
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}
