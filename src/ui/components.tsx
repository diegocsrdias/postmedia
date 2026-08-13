/**
 * Componentes reutilizáveis da INTERFACE (a "casca" da ferramenta, dark).
 *
 * Compõem a partir dos tokens de `./theme` (CSS variables) — cores, raios,
 * sombras, tipografia. Nada aqui tem cara de cliente: as cores de marca vivem
 * em `src/clients/*` e só valem para a arte gerada.
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

type BtnVariant = 'primary' | 'ghost' | 'accent' | 'danger' | 'subtle'
type BtnSize = 'sm' | 'md' | 'lg'

const BTN_PAD: Record<BtnSize, string> = {
  sm: '8px 14px',
  md: '11px 20px',
  lg: '14px 26px',
}
const BTN_FS: Record<BtnSize, number> = { sm: 13, md: 14, lg: 15.5 }

const BTN_PALETTE: Record<BtnVariant, CSSProperties> = {
  primary: { background: UI.accent, color: UI.accentText },
  accent: { background: UI.accent, color: UI.accentText },
  ghost: { background: 'transparent', color: UI.ink, border: '1px solid var(--border-2)' },
  subtle: { background: UI.surfaceAlt, color: UI.ink },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
}

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
  const isOff = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isOff}
      title={title}
      className="ui-btn"
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
        cursor: 'pointer',
        width: full ? '100%' : undefined,
        boxShadow: (variant === 'primary' || variant === 'accent') ? '0 6px 18px -6px var(--accent)' : undefined,
        ...BTN_PALETTE[variant],
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
          'linear-gradient(180deg, var(--surface-3), var(--surface))',
        border: '1px solid var(--border-2)',
        borderRadius: RADIUS.lg,
        padding: pad,
        boxShadow: SHADOW.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, var(--accent), transparent)',
        }}
      />
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
    <div style={{ display: 'inline-flex', background: UI.surfaceAlt, borderRadius: RADIUS.pill, padding: 3, border: '1px solid var(--border)' }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="ui-btn"
            style={{
              border: 'none',
              borderRadius: RADIUS.pill,
              padding: '8px 15px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: on ? UI.accent : 'transparent',
              color: on ? UI.accentText : UI.inkMuted,
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
  neutral: { background: UI.surfaceAlt, color: UI.inkMuted, border: '1px solid var(--border)' },
  dark: { background: 'var(--surface-3)', color: UI.darkText, border: '1px solid var(--border-2)' },
  accent: { background: 'var(--accent-soft)', color: 'var(--accent-hover)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)' },
  warn: { background: 'var(--warn-soft)', color: 'var(--warn)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
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
  icon?: ReactNode
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
        gap: 6,
        boxShadow: SHADOW.card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: UI.inkMuted2 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: UI.ink, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12, color: UI.inkMuted }}>{hint}</div>}
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
      <div
        style={{
          fontSize: 30,
          width: 66,
          height: 66,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          background: UI.surfaceAlt,
          border: '1px solid var(--border)',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: UI.ink }}>{title}</div>
      {hint && <div style={{ fontSize: 14, maxWidth: 440, lineHeight: 1.5 }}>{hint}</div>}
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
      <Spinner size={52} color="var(--accent)" />
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
        {message}
      </div>
      {hint && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{hint}</div>}
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
        background: 'var(--surface-3)',
        color: UI.darkText,
        border: '1px solid var(--border-2)',
        padding: '13px 22px',
        borderRadius: RADIUS.pill,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: SHADOW.toast,
        zIndex: 90,
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}

/** Estado de toast reutilizável: devolve a mensagem e um `flash(msg)`. */
export function useToast(ms = 2400) {
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
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em', color: UI.ink }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '7px 0 0', color: UI.inkMuted, fontSize: 14.5, maxWidth: 640, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}
