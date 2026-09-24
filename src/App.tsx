import { useEffect, useMemo, useState } from 'react'
import { CLIENT_LIST, DEFAULT_CLIENT, getClient } from './clients'
import type { ClientId } from './clients'
import { StudioView } from './views/StudioView'
import { HistoryView } from './views/HistoryView'
import { ScheduleView } from './views/ScheduleView'
import { PerformanceView } from './views/PerformanceView'
import { Dropdown } from './ui/components'
import { Icon, type IconName } from './ui/icons'
import { FONT, UI } from './ui/theme'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** As telas do app. O id vira o hash da URL (#estudio, #historico…). */
const VIEWS: { id: string; label: string; icon: IconName; blurb: string }[] = [
  { id: 'estudio', label: 'Estúdio', icon: 'studio', blurb: 'Criar e publicar' },
  { id: 'historico', label: 'Histórico', icon: 'history', blurb: 'Postados e baixados' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', blurb: 'Piloto automático' },
  { id: 'desempenho', label: 'Desempenho', icon: 'chart', blurb: 'O que funciona' },
]

type ViewId = 'estudio' | 'historico' | 'agenda' | 'desempenho'

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

  // título da aba acompanha a tela e o cliente
  const active = VIEWS.find((v) => v.id === view)!
  useEffect(() => {
    document.title = active.label + ' · ' + client.name + ' · Criativos'
  }, [active.label, client.name])

  const todayLabel = useMemo(() => {
    const d = new Date()
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
  }, [])

  return (
    <div className="app-layout">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px 14px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #a48bff, #6d4dff)',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
              color: '#fff',
              boxShadow: '0 6px 16px -6px rgba(139,108,255,.8)',
            }}
          >
            <Icon name="sparkles" size={17} stroke={2} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: UI.ink }}>Criativos</div>
        </div>

        <ClientPicker clientId={clientId} onChange={setClientId} />

        <div className="sidebar-section">Menu</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Principal">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={'nav-item' + (view === v.id ? ' active' : '')}
              aria-current={view === v.id ? 'page' : undefined}
              onClick={() => setView(v.id as ViewId)}
            >
              <Icon name={v.icon} size={18} className="nav-ico" />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span>{v.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: UI.inkMuted2 }}>{v.blurb}</span>
              </span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10.5,
            color: UI.inkMuted2,
            letterSpacing: '0.06em',
            padding: '0 12px',
          }}
        >
          {todayLabel}
        </div>
      </aside>

      {/* ===== Área principal ===== */}
      <div className="app-main">
        {/* topbar — no desktop mostra a trilha; no mobile vira a barra da marca */}
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontSize: 13.5 }}>
            <span className="hide-mobile" style={{ color: UI.inkMuted2, fontWeight: 500 }}>
              {client.name}
            </span>
            <span className="hide-mobile" style={{ color: 'var(--border-strong)' }}>
              /
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: UI.ink }}>
              <Icon name={active.icon} size={16} style={{ color: 'var(--accent-hover)' }} />
              {active.label}
            </span>
          </div>

          <div style={{ flex: 1 }} />

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
      <nav className="bottom-nav show-mobile" aria-label="Principal">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={view === v.id ? 'on' : ''}
            aria-current={view === v.id ? 'page' : undefined}
            onClick={() => setView(v.id as ViewId)}
          >
            <Icon name={v.icon} size={21} />
            {v.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

/** Seletor de cliente (workspace) — menu com as marcas disponíveis. */
function ClientPicker({
  clientId,
  onChange,
  compact = false,
}: {
  clientId: ClientId
  onChange: (id: ClientId) => void
  compact?: boolean
}) {
  const current = getClient(clientId)

  return (
    <Dropdown
      align={compact ? 'right' : 'left'}
      width={compact ? 230 : 208}
      trigger={({ open, toggle }) => (
        <button
          className="ui-btn"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Trocar de cliente"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: compact ? undefined : 208,
            background: open ? 'var(--surface-3)' : 'var(--surface-2)',
            border: '1px solid ' + (open ? 'var(--border-2)' : 'var(--border)'),
            borderRadius: 11,
            padding: compact ? '6px 9px' : '8px 10px',
            cursor: 'pointer',
            color: UI.ink,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
            }}
          >
            <img src={current.images.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left', minWidth: 0 }}>
            {!compact && <span style={{ fontSize: 11, color: UI.inkMuted2, fontWeight: 500 }}>Cliente</span>}
            <span
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: compact ? 120 : undefined,
              }}
            >
              {current.name}
            </span>
          </span>
          <Icon name="chevronDown" size={15} style={{ marginLeft: 'auto', color: UI.inkMuted2 }} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="menu-label">Trocar de cliente</div>
          {CLIENT_LIST.map((item) => {
            const on = item.id === clientId
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                className="menu-item"
                style={{ alignItems: 'center' }}
                onClick={() => {
                  onChange(item.id as ClientId)
                  close()
                }}
              >
                <span className="mi-ico" style={{ background: '#fff' }}>
                  <img src={getClient(item.id as ClientId).images.logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {on && <Icon name="check" size={16} style={{ color: 'var(--accent-hover)' }} />}
              </button>
            )
          })}
        </>
      )}
    </Dropdown>
  )
}
