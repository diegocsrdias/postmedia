/**
 * Design system da INTERFACE da ferramenta (dark premium).
 *
 * Os valores apontam para as CSS variables definidas em `src/index.css`
 * (`var(--…)`), então o tema inteiro é controlado por lá. Aqui ficam os
 * helpers de estilo reutilizados pelos componentes/telas — mantendo as mesmas
 * assinaturas exportadas de antes para não quebrar imports.
 *
 * NÃO confundir com as cores de MARCA em `src/clients/*`, que só valem para a
 * arte gerada/exportada (CreativeCanvas). Aqui vive só a "casca" da ferramenta.
 */
import type { CSSProperties } from 'react'

/** Paleta da interface — cada token é uma CSS variable (ver index.css). */
export const UI = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-2)',
  border: 'var(--border)',

  /** Painel elevado / de destaque (cards de "aprendizado", header). */
  dark: 'var(--surface-3)',
  darkAlt: 'var(--surface-2)',
  darkBorder: 'var(--border-2)',
  darkText: 'var(--text)',
  darkTextMuted: 'var(--text-muted)',
  darkTextMuted2: 'var(--text-muted)',

  /** Texto sobre superfícies (no dark, claro). */
  ink: 'var(--text)',
  inkMuted: 'var(--text-muted)',
  inkMuted2: 'var(--text-dim)',

  /** Destaque de ação. */
  accent: 'var(--accent)',
  accentText: 'var(--accent-text)',
} as const

/** Escala de espaçamento (px). */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
} as const

/** Raios de canto. `pill` = totalmente arredondado. */
export const RADIUS = {
  sm: 8,
  md: 11,
  lg: 14,
  xl: 20,
  pill: 999,
} as const

/** Sombras padronizadas (CSS variables). */
export const SHADOW = {
  card: 'var(--sh-card)',
  raised: 'var(--sh-raised)',
  preview: 'var(--sh-raised)',
  toast: 'var(--sh-pop)',
} as const

/** Famílias de fonte da interface. */
export const FONT = {
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
} as const

/** Rótulo monoespaçado em caixa-alta (metadados, acima de controles). */
export function monoLabel(_tone: 'light' | 'dark' = 'light'): CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: UI.inkMuted2,
  }
}

/** Botão de um seletor segmentado (pílula). `on` = selecionado. */
export function segButton(on: boolean): CSSProperties {
  return {
    border: 'none',
    borderRadius: RADIUS.pill,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    background: on ? UI.accent : 'transparent',
    color: on ? UI.accentText : UI.inkMuted,
  }
}

/** Container de um grupo de botões segmentados. */
export const segGroup: CSSProperties = {
  display: 'flex',
  background: UI.surfaceAlt,
  borderRadius: RADIUS.pill,
  padding: 3,
}

/** Variantes de botão de ação. */
export type ButtonVariant = 'primary' | 'ghost' | 'accent'

/** Estilo de um botão de ação, por variante. */
export function button(variant: ButtonVariant = 'primary'): CSSProperties {
  const base: CSSProperties = {
    border: 'none',
    borderRadius: RADIUS.pill,
    padding: '11px 22px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  }
  if (variant === 'ghost') {
    return { ...base, background: UI.surfaceAlt, color: UI.ink, border: '1px solid ' + UI.border }
  }
  return { ...base, background: UI.accent, color: UI.accentText }
}

/** Pílula pequena de metadado. */
export const pill: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  background: UI.surfaceAlt,
  border: '1px solid ' + UI.border,
  color: UI.inkMuted,
  padding: '3px 9px',
  borderRadius: RADIUS.pill,
}

/** Rótulo pequeno acima de um campo editável. */
export const fieldLabel: CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: UI.inkMuted2,
}

/** Textarea/campo de texto padrão. */
export const textarea: CSSProperties = {
  width: '100%',
  border: '1px solid ' + UI.border,
  borderRadius: RADIUS.md,
  padding: '9px 11px',
  fontSize: 13,
  color: UI.ink,
  background: UI.surfaceAlt,
  lineHeight: 1.4,
  resize: 'vertical',
  fontFamily: 'inherit',
}

/** Cartão de superfície (borda + sombra suave). */
export const card: CSSProperties = {
  background: UI.surface,
  border: '1px solid ' + UI.border,
  borderRadius: RADIUS.lg,
}
