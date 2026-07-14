export type Layout =
  | 'ad'
  | 'statement'
  | 'list'
  | 'question'
  | 'feature'
  | 'quote'
  | 'myth'

export type Angle =
  | 'dica'
  | 'recurso'
  | 'pergunta'
  | 'frase'
  | 'mito'
  | 'tema'
  | 'antibet'
  | 'anuncio'

/** Filtros disponíveis no seletor de tema. */
export type Filter = Angle | 'all'

export type Format = 'square' | 'story'

/** Campos de texto de um criativo — variam por layout, todos opcionais. */
export interface CreativeFields {
  badge?: string
  headline?: string
  highlight?: string
  sub?: string
  cta?: string
  eyebrow?: string
  line1?: string
  line2?: string
  title?: string
  item1?: string
  item2?: string
  item3?: string
  question?: string
  quote?: string
  myth?: string
  truth?: string
}

/** Um conceito no BANK (modelo base, antes de instanciar). */
export interface Concept {
  layout: Layout
  angle: Angle
  f: CreativeFields
  caption: string
  hashtags: string
}

/** Um criativo instanciado, pronto para render/edição. */
export interface Creative extends Concept {
  /** Frase curta que aparece na tela do vídeo (Reels). */
  vcap: string
  /** Fundo gerado por IA (data URL). Opcional; sobrepõe o fundo do layout. */
  bgImage?: string
  /** Prompt/ideia usado para gerar o fundo (editável pelo usuário). */
  bgPrompt?: string
  /** Chave de deduplicação/identificação. */
  _key: string
}

export interface Strategy {
  mood: string
  bpm: string
  hook: string
  goal: string
  plat: string
}
