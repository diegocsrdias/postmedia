import { useEffect, useMemo, useState } from 'react'
import { CLIENT_LIST, DEFAULT_CLIENT, getClient } from './clients'
import type { ClientId } from './clients'
import { StudioView } from './views/StudioView'
import { HistoryView } from './views/HistoryView'
import { ScheduleView } from './views/ScheduleView'
import { PerformanceView } from './views/PerformanceView'
import { FONT, UI } from './ui/theme'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** As telas do app. O id vira o hash da URL (#estudio, #historico…). */
const VIEWS = [
  { id: 'estudio', label: 'Estúdio', icon: '🎨', blurb: 'Criar & publicar' },
  { id: 'historico', label: 'Histórico', icon: '🗂️', blurb: 'Postados & baixados' },
  { id: 'agenda', label: 'Agenda', icon: '📅', blurb: 'Piloto automático' },
  { id: 'desempenho', label: 'Desempenho', icon: '📊', blurb: 'O que funciona' },
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

  const active = VIEWS.find((v) => v.id === view)!

  return (
    <div className="app-layout">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 16px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
            }}
          >
            <img src={client.images.logo} alt={client.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em', color: UI.ink }}>Criativos</div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: UI.inkMuted2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {client.name}
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={'nav-item' + (view === v.id ? ' active' : '')}
              onClick={() => setView(v.id)}
            >
              <span className="nav-ico">{v.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span>{v.label}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: UI.inkMuted2 }}>{v.blurb}</span>
              </span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <ClientPicker clientId={clientId} onChange={setClientId} />
      </aside>

      {/* ===== Área principal ===== */}
      <div className="app-main">
        {/* topbar */}
        <header className="app-topbar">
          {/* marca compacta (só aparece no mobile, onde a sidebar some) */}
          <div className="show-mobile" style={{ display: 'none', alignItems: 'center', gap: 9 }}>
            <img src={client.images.logo} alt={client.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.02em', color: UI.ink }}>
              {active.icon} {active.label}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <span
            className="hide-mobile"
            style={{ fontFamily: FONT.mono, fontSize: 12, color: UI.inkMuted2, letterSpacing: '0.06em' }}
          >
            {todayLabel}
          </span>

          {/* seletor de cliente no topo do mobile */}
          <div className="show-mobile" style={{ display: 'none' }}>
            <ClientPicker clientId={clientId} onChange={setClientId} compact />
          </div>
        </header>

        {/* conteúdo */}
        <main>
          {view === 'estudio' && <StudioView client={client} />}
          {view === 'historico' && <HistoryView client={client} />}
          {view === 'agenda' && <ScheduleView client={client} />}
          {view === 'desempenho' && <PerformanceView client={client} />}
        </main>
      </div>

      {/* ===== Bottom nav (mobile) ===== */}
      <nav className="bottom-nav show-mobile">
        {VIEWS.map((v) => {
          const on = view === v.id
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
                padding: '9px 4px 7px',
                cursor: 'pointer',
                color: on ? 'var(--accent-hover)' : UI.inkMuted2,
              }}
            >
              <span style={{ fontSize: 19, opacity: on ? 1 : 0.75 }}>{v.icon}</span>
              <span style={{ fontSize: 10, fontWeight: on ? 800 : 600 }}>{v.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/** Seletor de cliente estilizado (substitui o <select> cru). */
function ClientPicker({
  clientId,
  onChange,
  compact = false,
}: {
  clientId: ClientId
  onChange: (id: ClientId) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const current = getClient(clientId)

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="ui-btn"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: compact ? undefined : '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: compact ? '8px 10px' : '10px 12px',
          cursor: 'pointer',
          color: UI.ink,
        }}
      >
        <img src={current.images.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flex: 'none' }} />
        {!compact && (
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'left', minWidth: 0 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: UI.inkMuted2 }}>
              Cliente
            </span>
            <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {current.name}
            </span>
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: UI.inkMuted2 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: compact ? undefined : 'calc(100% + 6px)',
            top: compact ? 'calc(100% + 6px)' : undefined,
            right: compact ? 0 : undefined,
            left: compact ? undefined : 0,
            width: compact ? 200 : '100%',
            background: 'var(--surface-3)',
            border: '1px solid var(--border-2)',
            borderRadius: 12,
            boxShadow: 'var(--sh-pop)',
            padding: 5,
            zIndex: 50,
          }}
        >
          {CLIENT_LIST.map((item) => {
            const on = item.id === clientId
            return (
              <button
                key={item.id}
                className="nav-item"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(item.id as ClientId)
                  setOpen(false)
                }}
                style={{ background: on ? 'var(--accent-soft)' : undefined, color: UI.ink }}
              >
                <img src={getClient(item.id as ClientId).images.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                {item.name}
                {on && <span style={{ marginLeft: 'auto', color: 'var(--accent-hover)' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
