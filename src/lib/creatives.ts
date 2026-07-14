import type { Concept, Creative, CreativeFields, Filter, Layout } from '../types'
import { BANK } from '../data/bank'

/** Deriva a frase curta do vídeo (vcap) a partir do layout e campos. */
export function deriveVcap(layout: Layout, f: CreativeFields): string {
  if (layout === 'ad') return `${f.headline ?? ''} ${f.highlight ?? ''}`.trim()
  if (layout === 'statement') return `${f.line1 ?? ''} ${f.line2 ?? ''}`.trim()
  if (layout === 'list') return f.title ?? ''
  if (layout === 'question') return f.question ?? ''
  if (layout === 'feature') return f.headline ?? ''
  if (layout === 'quote') return f.quote ?? ''
  if (layout === 'myth') return 'A verdade: ' + (f.truth ?? '')
  return ''
}

export function shuffle<T>(a: T[]): T[] {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export function pool(filter: Filter): Concept[] {
  return filter === 'all' ? BANK : BANK.filter((x) => x.angle === filter)
}

export function keyOf(c: Concept): string {
  return (
    c.layout +
    '|' +
    (c.f.line1 || c.f.title || c.f.question || c.f.headline || c.f.quote || c.f.myth || '')
  )
}

export function instantiate(concept: Concept): Creative {
  return {
    layout: concept.layout,
    angle: concept.angle,
    f: { ...concept.f },
    caption: concept.caption,
    hashtags: concept.hashtags,
    vcap: deriveVcap(concept.layout, concept.f),
    _key: keyOf(concept),
  }
}

/**
 * Seleciona `n` criativos frescos do pool filtrado, evitando as chaves em
 * `excludeKeys` e deduplicando por conteúdo.
 */
export function pickFresh(n: number, filter: Filter, excludeKeys: string[] = []): Creative[] {
  const used = excludeKeys
  let cand = shuffle(pool(filter)).filter((x) => !used.includes(keyOf(x)))
  if (!cand.length) cand = shuffle(pool(filter))
  const seen: string[] = []
  const out: Concept[] = []
  for (const x of cand) {
    const k = keyOf(x)
    if (seen.includes(k)) continue
    seen.push(k)
    out.push(x)
    if (out.length === n) break
  }
  return out.map((x) => instantiate(x))
}
