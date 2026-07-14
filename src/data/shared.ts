import type { Layout, CreativeFields, Strategy, Angle } from '../types'

/** Um chip de tema em alta (newsjacking), sugerido no input de tema. */
export interface ThemeChip {
  label: string
  theme: string
}

/** Rótulos de ângulo — genéricos, compartilhados entre clientes. */
export const ANGLE_LABELS: Record<Angle, string> = {
  dica: 'Dica rápida',
  recurso: 'Recurso',
  pergunta: 'Pergunta',
  frase: 'Frase',
  mito: 'Mito vs verdade',
  tema: 'Tema do momento',
  antibet: '🚫 Anti-bet',
  anuncio: '📣 Anúncio',
}

/** Ordem de exibição preferida dos ângulos no filtro (só mostra os presentes no banco do cliente). */
export const ANGLE_ORDER: Angle[] = [
  'dica',
  'recurso',
  'pergunta',
  'frase',
  'mito',
  'antibet',
  'anuncio',
]

/** Estratégia de vídeo por layout — genérica, não depende da marca. */
export const STRAT: Record<Layout, Strategy> = {
  ad: {
    mood: 'Épico / comercial',
    bpm: '110–125 BPM',
    hook: 'O celular girando na tela',
    goal: 'Visitas ao perfil / cliques',
    plat: 'Reels + FB (impulsionar)',
  },
  statement: {
    mood: 'Punchy / impacto',
    bpm: '120–130 BPM',
    hook: '"Para de rolar 🛑"',
    goal: 'Compartilhamento',
    plat: 'Reels + TikTok',
  },
  list: {
    mood: 'Motivacional / upbeat',
    bpm: '100–120 BPM',
    hook: '"Salva esse post 👇"',
    goal: 'Salvamentos',
    plat: 'Reels + TikTok',
  },
  question: {
    mood: 'Leve / curioso',
    bpm: '90–110 BPM',
    hook: 'A pergunta na tela',
    goal: 'Comentários',
    plat: 'Reels + TikTok',
  },
  feature: {
    mood: 'Tech / energia',
    bpm: '120–130 BPM',
    hook: '"Isso muda sua rotina"',
    goal: 'Visitas ao perfil',
    plat: 'Reels + TikTok',
  },
  quote: {
    mood: 'Calmo / cinematográfico',
    bpm: '80–95 BPM',
    hook: '"Uma verdade sobre…"',
    goal: 'Retenção / salvar',
    plat: 'Reels',
  },
  myth: {
    mood: 'Tensão → alívio',
    bpm: '100–120 BPM',
    hook: '"Mito ou verdade? 🤔"',
    goal: 'Comentários / debate',
    plat: 'Reels + TikTok',
  },
}

/** Campos editáveis por layout: [chave, rótulo] — genérico, compartilhado. */
export const EDIT_FIELDS: Record<Layout, [keyof CreativeFields, string][]> = {
  ad: [
    ['headline', 'Título'],
    ['highlight', 'Destaque (cor)'],
    ['sub', 'Descrição'],
    ['cta', 'Botão CTA'],
    ['badge', 'Selo'],
  ],
  statement: [
    ['line1', 'Linha 1'],
    ['line2', 'Linha 2 (destaque)'],
  ],
  list: [
    ['title', 'Título'],
    ['item1', 'Item 1'],
    ['item2', 'Item 2'],
    ['item3', 'Item 3'],
  ],
  question: [['question', 'Pergunta']],
  feature: [
    ['headline', 'Título'],
    ['sub', 'Descrição'],
  ],
  quote: [['quote', 'Frase']],
  myth: [
    ['myth', 'Mito'],
    ['truth', 'Verdade'],
  ],
}
