/**
 * Componentes reutilizáveis da INTERFACE (a "casca" da ferramenta, dark).
 *
 * Compõem a partir dos tokens de `./theme` (CSS variables) — cores, raios,
 * sombras, tipografia. Nada aqui tem cara de cliente: as cores de marca vivem
 * em `src/clients/*` e só valem para a arte gerada.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Icon, type IconName } from './icons'
import { FONT, RADIUS, SHADOW, SPACE, UI } from './theme'

/* ============================================================
   Botão de ação
   ============================================================ */

type BtnVariant = 'primary' | 'ghost' | 'accent' | 'danger' | 'subtle' | 'ig'
type BtnSize = 'sm' | 'md' | 'lg'

const BTN_PAD: Record<BtnSize, string> = {
  sm: '7px 12px',
  md: '10px 16px',
  lg: '12px 20px',
}
const BTN_FS: Record<BtnSize, number> = { sm: 13, md: 14, lg: 15 }
const BTN_ICON: Record<BtnSize, number> = { sm: 15, md: 16, lg: 18 }

const BTN_PALETTE: Record<BtnVariant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(180deg, #9a7eff, var(--accent))',
    color: UI.accentText,
    boxShadow: '0 0 0 1px rgba(139,108,255,.6), 0 8px 20px -8px rgba(139,108,255,.7), inset 0 1px 0 rgba(255,255,255,.18)',
  },
  accent: { background: UI.accent, color: UI.accentText },
  ghost: { background: 'var(--surface-2)', color: UI.ink, border: '1px solid var(--border-2)' },
  subtle: { background: 'transparent', color: UI.inkMuted },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  ig: {
    background: 'var(--ig)',
    color: '#fff',
    boxShadow: '0 8px 20px -8px rgba(225,48,108,.65), inset 0 1px 0 rgba(255,255,255,.18)',
  },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  onClick,
  title,
  style,
  type = 'button',
  full = false,
}: {
  children?: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
  style?: CSSProperties
  type?: 'button' | 'submit'
  full?: boolean
}) {
  const isOff = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isOff}
      title={title}
      aria-busy={loading || undefined}
      className="ui-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
        border: 'none',
        borderRadius: RADIUS.md,
        padding: BTN_PAD[size],
        fontSize: BTN_FS[size],
        fontWeight: 700,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        ...BTN_PALETTE[variant],
        ...style,
      }}
    >
      {loading ? <Spinner size={BTN_ICON[size] - 1} /> : icon ? <Icon name={icon} size={BTN_ICON[size]} /> : null}
      {children}
    </button>
  )
}

/* ============================================================
   Spinner
   ============================================================ */

export function Spinner({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 8), color }}
    />
  )
}

/* ============================================================
   Cartão de superfície
   ============================================================ */

export function Card({
  children,
  style,
  pad = SPACE.xl,
  className,
  onClick,
}: {
  children: ReactNode
  style?: CSSProperties
  pad?: number | string
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.lg,
        padding: pad,
        boxShadow: SHADOW.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Cartão de destaque (fundo elevado + faixa de acento) para blocos "IA". */
export function HighlightCard({
  children,
  style,
  pad = SPACE.xl,
}: {
  children: ReactNode
  style?: CSSProperties
  pad?: number | string
}) {
  return (
    <div
      style={{
        position: 'relative',
        background:
          'radial-gradient(600px 200px at 0% 0%, rgba(139,108,255,.10), transparent 70%), var(--surface)',
        border: '1px solid var(--border-2)',
        borderRadius: RADIUS.lg,
        padding: pad,
        boxShadow: SHADOW.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Título de bloco com ícone num quadradinho (usado dentro de cards). */
export function BlockTitle({
  icon,
  title,
  right,
}: {
  icon: IconName
  title: ReactNode
  right?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--accent-soft)',
          color: 'var(--accent-hover)',
          flex: 'none',
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <span style={{ fontWeight: 700, fontSize: 15, color: UI.ink, letterSpacing: '-0.01em' }}>{title}</span>
      {right}
    </div>
  )
}

/* ============================================================
   Seletor segmentado
   ============================================================ */

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: ReactNode; icon?: IconName; title?: string }[]
  onChange: (v: T) => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={'seg-btn' + (on ? ' on' : '')}
          >
            {o.icon && <Icon name={o.icon} size={15} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ============================================================
   Campo rotulado
   ============================================================ */

export function Field({
  label,
  hint,
  children,
  style,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, ...style }}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

/* ============================================================
   Menu suspenso (dropdown)
   ============================================================ */

/**
 * Botão que abre um menu. Fecha ao clicar fora, com Esc ou ao escolher um
 * item. `align` escolhe o lado em que o menu cola; `up` abre para cima
 * (útil quando o gatilho está no rodapé de um card).
 */
export function Dropdown({
  trigger,
  children,
  align = 'right',
  up = false,
  width,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  up?: boolean
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLButtonElement>('.menu-item:not(:disabled)') ?? [],
        )
        if (!items.length) return
        e.preventDefault()
        const i = items.indexOf(document.activeElement as HTMLButtonElement)
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
        items[next].focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="dropdown" style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className="menu"
          role="menu"
          style={{
            [align]: 0,
            ...(up ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
            width,
          }}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

/** Item de menu com ícone, título e descrição curta. */
export function MenuItem({
  icon,
  title,
  sub,
  onClick,
  disabled,
  accent,
}: {
  icon: IconName
  title: ReactNode
  sub?: ReactNode
  onClick: () => void
  disabled?: boolean
  accent?: boolean
}) {
  return (
    <button type="button" role="menuitem" className="menu-item" onClick={onClick} disabled={disabled}>
      <span className={'mi-ico' + (accent ? ' accent' : '')}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ minWidth: 0, paddingTop: 1 }}>
        {title}
        {sub && <span className="mi-sub">{sub}</span>}
      </span>
    </button>
  )
}

/* ============================================================
   Badge (rótulo pequeno)
   ============================================================ */

type BadgeTone = 'neutral' | 'dark' | 'accent' | 'success' | 'warn' | 'danger'

const BADGE_TONE: Record<BadgeTone, CSSProperties> = {
  neutral: { background: UI.surfaceAlt, color: UI.inkMuted, border: '1px solid var(--border)' },
  dark: { background: 'rgba(10,11,15,.72)', color: UI.darkText, border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(6px)' },
  accent: { background: 'var(--accent-soft)', color: 'var(--accent-hover)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)' },
  warn: { background: 'var(--warn-soft)', color: 'var(--warn)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
}

export function Badge({
  children,
  tone = 'neutral',
  mono = false,
  icon,
  style,
}: {
  children: ReactNode
  tone?: BadgeTone
  mono?: boolean
  icon?: IconName
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: mono ? 9.5 : 11.5,
        fontWeight: 600,
        letterSpacing: mono ? '0.12em' : undefined,
        textTransform: mono ? 'uppercase' : undefined,
        fontFamily: mono ? FONT.mono : undefined,
        padding: '3px 9px',
        borderRadius: RADIUS.pill,
        whiteSpace: 'nowrap',
        ...BADGE_TONE[tone],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={12} stroke={2} />}
      {children}
    </span>
  )
}

/* ============================================================
   Stat (KPI): rótulo + valor grande + hint/delta
   ============================================================ */

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: IconName
}) {
  return (
    <div
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.lg,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: SHADOW.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: UI.inkMuted }}>
        {icon && <Icon name={icon} size={15} style={{ color: 'var(--accent-hover)' }} />}
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: UI.ink, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12, color: UI.inkMuted2 }}>{hint}</div>}
    </div>
  )
}

/* ============================================================
   Skeleton (placeholder de carregamento)
   ============================================================ */

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
}

/* ============================================================
   Estado vazio
   ============================================================ */

export function EmptyState({
  icon = 'inbox',
  title,
  hint,
  action,
}: {
  icon?: IconName
  title: string
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: SPACE.md,
        padding: '52px 24px',
        color: UI.inkMuted,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 16,
          background: 'var(--accent-soft)',
          color: 'var(--accent-hover)',
          border: '1px solid var(--accent-line)',
          marginBottom: 4,
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: UI.ink, letterSpacing: '-0.01em' }}>{title}</div>
      {hint && <div style={{ fontSize: 14, maxWidth: 440, lineHeight: 1.55 }}>{hint}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  )
}

/* ============================================================
   Overlay de carregamento (tela cheia)
   ============================================================ */

export function LoadingOverlay({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <Spinner size={46} color="var(--accent)" />
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
        {message}
      </div>
      {hint && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{hint}</div>}
    </div>
  )
}

/* ============================================================
   Toast (mensagem efêmera) + hook
   ============================================================ */

/** Mensagens de erro ganham ícone/cor de erro automaticamente. */
const isErrorMsg = (m: string) =>
  /^(falhou|erro)|n[aã]o consegui|trope[cç]ou|sem chave|precisa|digite|escolha|adicione|inv[aá]lid/i.test(m)
const isBusyMsg = (m: string) => /…$/.test(m)

export function Toast({ message }: { message: string }) {
  if (!message) return null
  const err = isErrorMsg(message)
  const busy = !err && isBusyMsg(message)
  return (
    <div className="toast" role="status" aria-live="polite" key={message}>
      {busy ? (
        <Spinner size={15} color="var(--accent-hover)" />
      ) : (
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            flex: 'none',
            background: err ? 'var(--danger-soft)' : 'var(--success-soft)',
            color: err ? 'var(--danger)' : 'var(--success)',
          }}
        >
          <Icon name={err ? 'x' : 'check'} size={12} stroke={2.5} />
        </span>
      )}
      <span>{message}</span>
    </div>
  )
}

/** Estado de toast reutilizável: devolve a mensagem e um `flash(msg)`. */
export function useToast(ms = 2800) {
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const flash = useCallback(
    (msg: string) => {
      setToast(msg)
      window.clearTimeout(timer.current)
      // mensagens de erro ficam mais tempo na tela
      timer.current = window.setTimeout(() => setToast(''), isErrorMsg(msg) ? ms * 2 : ms)
    },
    [ms],
  )
  return { toast, flash }
}

/* ============================================================
   Cabeçalho de seção (título + subtítulo + ação à direita)
   ============================================================ */

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: ReactNode
  right?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: SPACE.lg,
        marginBottom: SPACE.xl,
      }}
    >
      <div style={{ minWidth: 240, flex: '1 1 380px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: UI.ink }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '6px 0 0', color: UI.inkMuted, fontSize: 14, maxWidth: 620, lineHeight: 1.55 }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}
