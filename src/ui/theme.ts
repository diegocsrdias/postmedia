/**
 * Design system da INTERFACE da ferramenta.
 *
 * Não confundir com as cores de MARCA em `src/clients/*`, que só valem para a
 * arte gerada/exportada. Aqui vive só a "casca" da ferramenta: cinza + preto/
 * branco, sem cara de nenhum cliente.
 *
 * Além das cores (UI), este módulo centraliza os TOKENS de espaçamento, raio,
 * sombra, fonte e tipografia, e expõe helpers de estilo reutilizáveis
 * (botões, pílulas, campos, rótulos). A ideia é que os componentes componham
 * a partir daqui em vez de repetir inline-styles soltos por toda parte.
 */
import type { CSSProperties } from 'react'

/** Paleta neutra da interface. */
export const UI = {
  bg: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F1F3',
  border: '#E4E4E7',

  dark: '#1F2024',
  darkAlt: '#2B2C31',
  darkBorder: '#3A3B40',
  darkText: '#FAFAFA',
  darkTextMuted: '#A1A1AA',
  darkTextMuted2: '#D4D4D8',

  ink: '#18181B',
  inkMuted: '#52525B',
  inkMuted2: '#71717A',

  /** Destaque de ação (modo Propaganda, realces). */
  accent: '#7C5CFC',
  accentText: '#FFFFFF',
} as const

/** Escala de espaçamento (px). Use múltiplos daqui em vez de números soltos. */
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
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const

/** Sombras padronizadas. */
export const SHADOW = {
  card: '0 4px 12px rgba(0,0,0,.06)',
  raised: '0 8px 20px rgba(0,0,0,.18)',
  preview: '0 8px 24px rgba(0,0,0,.18)',
  toast: '0 12px 32px rgba(0,0,0,.3)',
} as const

/** Famílias de fonte da interface. */
export const FONT = {
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

/**
 * Rótulo monoespaçado em caixa-alta (usado acima de controles e em metadados).
 * `tone`: 'light' para superfícies claras, 'dark' para o header/painéis escuros.
 */
export function monoLabel(tone: 'light' | 'dark' = 'light'): CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: tone === 'dark' ? UI.darkTextMuted : UI.inkMuted2,
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
    background: on ? UI.dark : 'transparent',
    color: on ? UI.darkText : UI.inkMuted,
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
    borderRadius: RADIUS.md,
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
    return { ...base, background: UI.surface, color: UI.ink, border: '1px solid ' + UI.ink }
  }
  if (variant === 'accent') {
    return { ...base, background: UI.accent, color: UI.accentText }
  }
  return { ...base, background: UI.dark, color: UI.darkText }
}

/** Pílula pequena de metadado (estratégia, plataformas). */
export const pill: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  background: UI.surface,
  border: '1px solid ' + UI.border,
  color: UI.ink,
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
  borderRadius: RADIUS.sm,
  padding: '8px 10px',
  fontSize: 13,
  color: UI.ink,
  background: UI.surface,
  lineHeight: 1.35,
  resize: 'vertical',
  fontFamily: 'inherit',
}

/** Cartão de superfície clara (borda + sombra suave). */
export const card: CSSProperties = {
  background: UI.surface,
  border: '1px solid ' + UI.border,
  borderRadius: RADIUS.lg,
}
