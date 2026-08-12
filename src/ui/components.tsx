/**
 * Componentes reutilizáveis da INTERFACE (a "casca" da ferramenta).
 *
 * Compõem a partir dos tokens de `./theme` — cores neutras, raios, sombras,
 * tipografia — para que as telas parem de repetir inline-styles gigantes.
 * Nada aqui tem cara de cliente: as cores de marca vivem em `src/clients/*`.
 */
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { FONT, RADIUS, SHADOW, SPACE, UI } from './theme'

/* ============================================================
   Botão de ação
   ============================================================ */

type BtnVariant = 'primary' | 'ghost' | 'accent' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg'

const BTN_PAD: Record<BtnSize, string> = {
  sm: '8px 14px',
  md: '11px 20px',
  lg: '15px 28px',
}
const BTN_FS: Record<BtnSize, number> = { sm: 13, md: 14, lg: 16 }

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  title,
  style,
  type = 'button',
  full = false,
}: {
  children: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
  style?: CSSProperties
  type?: 'button' | 'submit'
  full?: boolean
}) {
  const palette: Record<BtnVariant, CSSProperties> = {
    primary: { background: UI.dark, color: UI.darkText },
    accent: { background: UI.accent, color: UI.accentText },
    ghost: { background: 'transparent', color: UI.ink, border: '1px solid ' + UI.border },
    danger: { background: 'transparent', color: '#B91C1C', border: '1px solid #FCA5A5' },
  }
  const isOff = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isOff}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
        border: 'none',
        borderRadius: RADIUS.pill,
        padding: BTN_PAD[size],
        fontSize: BTN_FS[size],
        fontWeight: 800,
        letterSpacing: '-0.01em',
        cursor: isOff ? 'default' : 'pointer',
        opacity: isOff ? 0.6 : 1,
        transition: 'opacity .15s, transform .05s',
        width: full ? '100%' : undefined,
        boxShadow: variant === 'primary' && size === 'lg' ? SHADOW.raised : undefined,
        ...palette[variant],
        ...style,
      }}
    >
      {loading && <Spinner size={size === 'lg' ? 18 : 15} />}
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
}: {
  children: ReactNode
  style?: CSSProperties
  pad?: number | string
  className?: string
}) {
  return (
    <div
      className={className}
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

/* ============================================================
   Seletor segmentado (pílula)
   ============================================================ */

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'inline-flex', background: UI.surfaceAlt, borderRadius: RADIUS.pill, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              border: 'none',
              borderRadius: RADIUS.pill,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: on ? UI.dark : 'transparent',
              color: on ? UI.darkText : UI.inkMuted,
              transition: 'background .15s, color .15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ============================================================
   Badge (rótulo pequeno)
   ============================================================ */

type BadgeTone = 'neutral' | 'dark' | 'accent' | 'success' | 'warn' | 'danger'

const BADGE_TONE: Record<BadgeTone, CSSProperties> = {
  neutral: { background: UI.surfaceAlt, color: UI.inkMuted },
  dark: { background: UI.dark, color: UI.darkText },
  accent: { background: 'rgba(124,92,252,0.12)', color: UI.accent },
  success: { background: 'rgba(21,128,61,0.12)', color: '#15803D' },
  warn: { background: 'rgba(180,120,0,0.14)', color: '#B45309' },
  danger: { background: 'rgba(185,28,28,0.12)', color: '#B91C1C' },
}

export function Badge({
  children,
  tone = 'neutral',
  mono = false,
  style,
}: {
  children: ReactNode
  tone?: BadgeTone
  mono?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: mono ? 9 : 11,
        fontWeight: 700,
        letterSpacing: mono ? '0.12em' : undefined,
        textTransform: mono ? 'uppercase' : undefined,
        fontFamily: mono ? FONT.mono : undefined,
        padding: '4px 9px',
        borderRadius: RADIUS.pill,
        whiteSpace: 'nowrap',
        ...BADGE_TONE[tone],
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/* ============================================================
   Estado vazio
   ============================================================ */

export function EmptyState({
  icon = '📭',
  title,
  hint,
  action,
}: {
  icon?: string
  title: string
  hint?: string
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
        padding: '56px 24px',
        color: UI.inkMuted,
      }}
    >
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: UI.ink }}>{title}</div>
      {hint && <div style={{ fontSize: 14, maxWidth: 420, lineHeight: 1.5 }}>{hint}</div>}
      {action}
    </div>
  )
}

/* ============================================================
   Overlay de carregamento (tela cheia)
   ============================================================ */

export function LoadingOverlay({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <Spinner size={52} color="#fff" />
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
        {message}
      </div>
      {hint && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{hint}</div>}
    </div>
  )
}

/* ============================================================
   Toast (mensagem efêmera) + hook
   ============================================================ */

export function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        background: UI.dark,
        color: UI.darkText,
        padding: '13px 24px',
        borderRadius: RADIUS.pill,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: SHADOW.toast,
        zIndex: 60,
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}

/** Estado de toast reutilizável: devolve a mensagem e um `flash(msg)`. */
export function useToast(ms = 2000) {
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const flash = useCallback(
    (msg: string) => {
      setToast(msg)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setToast(''), ms)
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
  subtitle?: string
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
      <div style={{ minWidth: 240 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: UI.ink }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '6px 0 0', color: UI.inkMuted, fontSize: 15, maxWidth: 620, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}
