import { listAccountMedia, fetchMetrics } from './_lib/ig.js'
import { listClientMediaIds, insertPosts } from './_lib/supabase.js'
import { rebuildLearnings } from './build-learnings.js'
import { readJson } from './_lib/openai.js'

// Backfill do histórico do Instagram: importa os posts que JÁ existem na conta
// conectada para a base de aprendizado, em vez de começar zerado. Fluxo:
//   1) lista a mídia da conta (feed/carrossel/Reels) via Graph API;
//   2) descarta o que já foi importado antes (dedupe por ig_media_id);
//   3) lê as métricas de cada post novo (alcance, salvos, likes…);
//   4) grava tudo em `posts` e reconstrói o brief de aprendizado do cliente.
//
// Idempotente: rerodar só traz o que ainda falta. Aceita GET (manual) e POST.
// Body/query: { client = 'dindin', max = 100, metrics = true }.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  try {
    const body = req.method === 'POST' ? await readJson(req) : {}
    const q = req.query || {}
    const client = String((body && body.client) || q.client || 'dindin')
    const max = Math.min(Math.max(Number((body && body.max) || q.max || 100), 1), 200)
    const withMetrics = (body && body.metrics) !== false && q.metrics !== 'false'

    // 1) o que a conta já publicou
    const media = await listAccountMedia({ max })

    // 2) tira o que já está no banco (dedupe)
    const existing = await listClientMediaIds(client)
    const fresh = media.filter((m) => m && m.id && !existing.has(m.id))

    // 3) monta as linhas, buscando métricas em paralelo (com limite de concorrência)
    const rows = await mapLimit(fresh, 5, async (m) => {
      const row = mapMedia(m, client)
      if (withMetrics) {
        try {
          const metrics = await fetchMetrics(m.id)
          if (Object.keys(metrics).length) {
            Object.assign(row, metrics)
            row.metrics_updated_at = new Date().toISOString()
          }
        } catch {
          /* métrica é best-effort; segue sem ela */
        }
      }
      return row
    })

    // 4) grava e reconstrói o aprendizado
    const inserted = await insertPosts(rows)
    let learning = null
    try {
      learning = await rebuildLearnings(client)
    } catch (err) {
      learning = { error: String(err?.message || err) }
    }

    res.status(200).json({
      client,
      account_media: media.length,
      already_had: media.length - fresh.length,
      imported: inserted.length,
      with_metrics: withMetrics,
      learning,
    })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}

/** Converte um objeto de mídia da Graph API numa linha de `posts`. */
function mapMedia(m, client) {
  const type = m.media_type // IMAGE | VIDEO | CAROUSEL_ALBUM
  const product = m.media_product_type // FEED | REELS | STORY | AD
  const mediaKind = type === 'VIDEO' ? 'video' : type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'
  const format =
    product === 'STORY'
      ? 'story'
      : product === 'REELS'
        ? 'reels'
        : type === 'CAROUSEL_ALBUM'
          ? 'carousel'
          : 'feed'
  const caption = m.caption || ''
  return {
    client,
    status: 'published',
    ig_media_id: m.id,
    permalink: m.permalink || null,
    media_url: m.media_url || m.thumbnail_url || null,
    media_kind: mediaKind,
    format,
    // posts orgânicos não têm ângulo/layout estruturado; a análise ignora nulos
    layout: null,
    angle: null,
    headline: firstLine(caption),
    caption: caption || null,
    hashtags: extractHashtags(caption),
    fields: { imported: true, media_type: type || null, media_product_type: product || null },
    published_at: m.timestamp || null,
  }
}

/** Primeira frase/linha útil da legenda (até ~80 chars) — vira o "headline" de referência. */
function firstLine(caption) {
  const clean = String(caption || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/^#/.test(l))
  if (!clean) return null
  const sentence = clean.split(/(?<=[.!?])\s/)[0] || clean
  return sentence.slice(0, 80).trim() || null
}

/** Junta as hashtags da legenda numa string (mesmo formato dos posts do app). */
function extractHashtags(caption) {
  const tags = String(caption || '').match(/#[\p{L}\p{N}_]+/gu)
  return tags && tags.length ? tags.join(' ') : null
}

/** Executa `fn` sobre `items` com no máximo `limit` chamadas simultâneas. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return out
}
