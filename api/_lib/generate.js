// Geração de criativos SERVER-SIDE, reutilizável pelo agendador (run-scheduler)
// sem passar por HTTP. Espelha a lógica dos endpoints generate-mix/generate-theme,
// já com o viés de aprendizado (learnings), e devolve objetos no formato que o
// CreativeCanvas espera renderizar (mesma forma de src/types Creative).

import { chat, extractJsonArray } from './openai.js'
import { mixPrompt, themePrompt } from './prompts.js'
import { safeLearnings } from './supabase.js'
import { sampleDirections } from './directions.js'

const LAYOUTS = new Set(['ad', 'statement', 'list', 'question', 'feature', 'quote', 'myth'])

/** Deriva a frase curta do vídeo (vcap) — espelha src/lib/creatives.ts. */
function deriveVcap(layout, f = {}) {
  if (layout === 'ad') return `${f.headline ?? ''} ${f.highlight ?? ''}`.trim()
  if (layout === 'statement') return `${f.line1 ?? ''} ${f.line2 ?? ''}`.trim()
  if (layout === 'list') return f.title ?? ''
  if (layout === 'question') return f.question ?? ''
  if (layout === 'feature') return f.headline ?? ''
  if (layout === 'quote') return f.quote ?? ''
  if (layout === 'myth') return 'A verdade: ' + (f.truth ?? '')
  return ''
}

/** Normaliza um item cru da IA num "Creative" pronto para render. */
function toCreative(x, i) {
  const f = { ...(x.f || {}) }
  return {
    layout: x.layout,
    angle: 'tema',
    f,
    caption: x.caption || '',
    hashtags: x.hashtags || '',
    vcap: (x.vcap && String(x.vcap).trim()) || deriveVcap(x.layout, f),
    _key: 'gen-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 6),
  }
}

/**
 * Gera `n` criativos coesos para o cliente. Se `theme` vier, faz newsjacking;
 * senão, geração livre ("do dia"). Devolve array de Creative (>= 1) ou estoura.
 */
export async function generateCreatives(client, { n = 1, theme = '' } = {}) {
  const count = Math.min(Math.max(Number(n) || 1, 1), 10)
  const learnings = await safeLearnings(client.id)

  let system
  let user
  const t = String(theme || '').trim()
  if (t) {
    ;({ system, user } = themePrompt(count, t, client, learnings))
  } else {
    const pool = client.directions || []
    const directions = sampleDirections(Math.min(count + 1, pool.length || count + 1), client)
    ;({ system, user } = mixPrompt(count, client, directions, '', learnings))
  }

  const raw = await chat({
    system,
    user,
    maxTokens: count > 1 ? 3200 : 1600,
    temperature: 1.1,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
  })
  const arr = extractJsonArray(raw)
  const valid = (Array.isArray(arr) ? arr : [])
    .filter((x) => x && x.layout && LAYOUTS.has(x.layout) && x.f)
    .map((x, i) => toCreative(x, i))
    .slice(0, count)
  if (!valid.length) throw new Error('IA não devolveu criativos válidos')
  return valid
}
