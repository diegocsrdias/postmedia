import type { Concept } from '../types'
import type { ThemeChip } from '../data/shared'

/** Como o "visual principal" do layout `ad` é montado, por cliente. */
export type HeroFrame = 'phone' | 'portrait'

/** Paleta de cores da marca — tokens genéricos usados pelo CreativeCanvas. */
export interface ClientColors {
  /** Fundo escuro dos layouts de impacto (ad/statement/feature). */
  dark: string
  /** Texto claro sobre o fundo escuro. */
  darkText: string
  /** Texto secundário/mudo sobre o fundo escuro. */
  darkTextMuted: string
  /** Cor de destaque/CTA (botões, links, realces). */
  accent: string
  /** Texto sobre a cor de destaque. */
  accentText: string
  /** Variante mais escura do destaque, p/ texto pequeno sobre fundo claro. */
  accentSoft: string
  /** Fundo claro principal (list/myth). */
  cream: string
  /** Fundo claro alternativo, levemente mais escuro (quote). */
  surfaceAlt: string
  /** Texto escuro principal sobre fundo claro. */
  ink: string
  /** Texto secundário sobre fundo claro. */
  inkMuted: string
  /** Cor de bordas/divisórias. */
  line: string
}

/** Fontes da marca. */
export interface ClientFonts {
  body: string
  serif: string
  mono: string
}

/** Imagens/ícones da marca usados no canvas. */
export interface ClientImages {
  /** Logomarca (redonda ou não), usada nos rodapés dos criativos. */
  logo: string
  /** Como montar o visual principal do layout `ad`. */
  heroFrame: HeroFrame
  /** Imagem principal do hero: screenshot do app OU foto de perfil. */
  heroMedia: string
  /** Imagem extra flutuante sobre o hero (mascote), opcional. */
  heroAccentImage?: string
  /** Ícone/selo usado no canto do layout `question`; cai para `logo` se ausente. */
  badgeIcon?: string
}

/**
 * Voz da marca. `publicitario` é o padrão (marca de consumo); `editorial` é
 * para serviço profissional regulado (saúde, direito), onde retórica de venda
 * é inadequada — some com o botão de imagem de propaganda e muda o enquadramento
 * dos prompts no servidor (ver api/_lib/clients.js).
 */
export type ClientVoice = 'publicitario' | 'editorial'

/** Configuração completa de um cliente da plataforma. */
export interface ClientConfig {
  id: string
  /** Nome de exibição no menu de clientes. */
  name: string
  /** Voz da marca; ausente equivale a `publicitario`. */
  voice?: ClientVoice
  /** [primeira palavra, segunda palavra em destaque] usado nos rodapés da marca. */
  brandParts: [string, string]
  /** Texto pequeno (mono) perto da logo — domínio, CRP, etc. */
  smallPrint: string
  /** Texto do selo de oferta mais longo (layout statement). */
  ctaBadgeLong: string
  /** Texto do selo de oferta mais curto (layout feature). */
  ctaBadgeShort: string
  /** Linha de oferta ao lado do CTA principal (layout ad). */
  offerLine: string
  colors: ClientColors
  fonts: ClientFonts
  images: ClientImages
  bank: Concept[]
  themes: ThemeChip[]
}
