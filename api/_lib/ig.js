// Publicação no Instagram via Graph API.
//
// O token de acesso e o ID da conta vivem SÓ no servidor (env vars) — o
// navegador nunca os vê. O Instagram não aceita upload de arquivo cru: ele
// publica a partir de uma URL pública. Por isso o JPEG gerado é hospedado no
// bucket do Supabase (mantido como registro), o Instagram baixa dessa URL, e
// cada publicação vira uma linha na tabela `posts` — a base de dados que, com o
// tempo, cruzaremos com o desempenho (likes/alcance) para melhorar a geração.
//
// Variantes da API (host configurável por IG_GRAPH_BASE):
//   - "Instagram API com login do Facebook"  → https://graph.facebook.com/v21.0
//   - "Instagram API com login do Instagram" → https://graph.instagram.com/v21.0
// Os endpoints /media e /media_publish têm o mesmo formato nas duas.

import { uploadMedia, insertPost } from './supabase.js'

const GRAPH_BASE = process.env.IG_GRAPH_BASE || 'https://graph.facebook.com/v21.0'

/** Lê as credenciais do Instagram ou explica exatamente o que falta. */
export function igConfig() {
  const userId = process.env.IG_USER_ID
  const token = process.env.IG_ACCESS_TOKEN
  const missing = []
  if (!userId) missing.push('IG_USER_ID')
  if (!token) missing.push('IG_ACCESS_TOKEN')
  if (missing.length) {
    throw new Error('Configuração ausente no servidor: ' + missing.join(', '))
  }
  return { userId, token }
}

/** Extrai o buffer e o mime de uma data URL (data:image/...;base64,...). */
function decodeDataUrl(dataUrl) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(dataUrl || ''))
  if (!m) throw new Error('Imagem inválida (esperava data URL base64)')
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
}

/** GET/POST no Graph, sempre estourando com a mensagem de erro real da Meta. */
export async function graph(path, params, method = 'POST') {
  const url = new URL(GRAPH_BASE + path)
  const body = new URLSearchParams(params)
  const init = { method }
  if (method === 'GET') {
    for (const [k, v] of body) url.searchParams.set(k, v)
  } else {
    init.body = body
  }
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data?.error
    const code = e ? ` (code ${e.code}${e.error_subcode ? '/' + e.error_subcode : ''})` : ''
    const detail = e?.error_user_msg ? ' — ' + e.error_user_msg : ''
    const msg = e ? `${e.message}${code}${detail}` : `HTTP ${res.status}`
    throw new Error('Instagram: ' + msg)
  }
  return data
}

/**
 * Espera o container de mídia terminar de processar antes de publicar.
 * Para imagem costuma ser instantâneo, mas publicar cedo demais devolve 400.
 */
async function waitContainerReady(containerId, token, { tries = 8, intervalMs = 1500 } = {}) {
  for (let i = 0; i < tries; i++) {
    const s = await graph(
      `/${containerId}`,
      { fields: 'status_code,status', access_token: token },
      'GET',
    )
    if (s.status_code === 'FINISHED') return
    if (s.status_code === 'ERROR') {
      throw new Error('Instagram: o container falhou no processamento — ' + (s.status || ''))
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Instagram: o container não ficou pronto a tempo (timeout)')
}

/**
 * Publica um container, repetindo em falhas transitórias. Mesmo com o container
 * FINISHED, o Instagram às vezes devolve 400 no media_publish por consistência
 * eventual (ex.: "Media ID is not available"), e um retry logo resolve. Erros
 * claramente permanentes (permissão/elegibilidade) estouram na hora.
 */
async function mediaPublish(userId, creationId, token, tries = 4) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      const r = await graph(`/${userId}/media_publish`, {
        creation_id: creationId,
        access_token: token,
      })
      if (r?.id) return r
      lastErr = new Error('Instagram não confirmou a publicação')
    } catch (err) {
      lastErr = err
      const m = String(err?.message || '')
      // permissão/elegibilidade/limite não melhoram com retry — falha logo
      if (/permiss|not eligible|content_publish|limit/i.test(m)) throw err
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, 2500))
  }
  throw lastErr
}

/** Registra uma publicação em `posts` sem derrubar o fluxo se o DB falhar. */
async function logPost({ published, permalink, mediaUrl, caption, meta, format, mediaKind }) {
  try {
    const row = await insertPost({
      client: String(meta.client || 'post'),
      status: 'published',
      media_kind: mediaKind || null,
      ig_media_id: published.id,
      permalink: permalink || null,
      media_url: mediaUrl || null,
      format,
      layout: meta.layout || null,
      angle: meta.angle || null,
      headline: meta.headline || null,
      caption: caption || null,
      hashtags: meta.hashtags || null,
      fields: meta.fields || null,
      published_at: new Date().toISOString(),
    })
    return row?.id ?? null
  } catch (err) {
    console.error('Falha ao registrar post no Supabase:', err?.message || err)
    return null
  }
}

/**
 * Publica uma imagem única no feed do Instagram e registra em `posts`.
 * `imageDataUrl` é a data URL (JPEG/PNG) capturada do criativo.
 * `meta` traz os dados estruturados do criativo (para o aprendizado depois).
 * Retorna { id, permalink, mediaUrl, postId }.
 */
export async function publishImage({ imageDataUrl, caption, meta = {} }) {
  const { userId, token } = igConfig()
  const { buffer, mime } = decodeDataUrl(imageDataUrl)
  const ext = mime === 'image/png' ? 'png' : 'jpg'
  const client = String(meta.client || 'post')

  // 1) hospeda o arquivo publicamente no bucket (fica como registro do que foi postado)
  const now = new Date()
  const path = `${client}/${now.getFullYear()}/${now.getTime()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`
  const mediaUrl = await uploadMedia(path, buffer, mime)

  // 2) cria o container apontando pra URL pública (a Meta baixa aqui)
  const container = await graph(`/${userId}/media`, {
    image_url: mediaUrl,
    caption: caption || '',
    access_token: token,
  })
  if (!container?.id) throw new Error('Instagram não devolveu id do container')

  // 3) espera o container ficar pronto e então publica (com retry)
  await waitContainerReady(container.id, token)
  const published = await mediaPublish(userId, container.id, token)

  // 4) tenta pegar o link do post (não crítico)
  let permalink = ''
  try {
    const info = await graph(`/${published.id}`, { fields: 'permalink', access_token: token }, 'GET')
    permalink = info?.permalink || ''
  } catch {
    /* segue sem link */
  }

  // 5) registra no banco — a base de dados do aprendizado.
  //    Não deixa um erro de DB derrubar uma publicação que já foi ao ar.
  const postId = await logPost({
    published,
    permalink,
    mediaUrl,
    caption,
    meta,
    format: meta.format || 'feed',
    mediaKind: 'image',
  })

  return { id: published.id, permalink, mediaUrl, postId }
}

/**
 * Publica um vídeo (já hospedado em `videoUrl`) no Story ou nos Reels.
 * `target` é 'story' ou 'reels'. Retorna { id, permalink, postId }.
 */
export async function publishVideo({ videoUrl, caption, target, coverUrl, trial = false, meta = {} }) {
  const { userId, token } = igConfig()
  const mediaType = target === 'reels' ? 'REELS' : 'STORIES'

  // 1) cria o container de vídeo (o Instagram baixa e processa — pode demorar)
  const params = {
    media_type: mediaType,
    video_url: videoUrl,
    access_token: token,
  }
  if (mediaType === 'REELS') {
    // Story não usa legenda; Reels sim.
    if (caption) params.caption = caption
    // capa nítida (thumbnail) a partir de um frame do card
    if (coverUrl) params.cover_url = coverUrl
    if (trial) {
      // Trial Reel: exibido só a NÃO-seguidores por 72h para testar antes.
      // graduation_strategy MANUAL = você decide depois se libera aos seguidores.
      params.trial_params = JSON.stringify({ graduation_strategy: 'MANUAL' })
    } else {
      // o Reel normal também aparece no feed (mais alcance)
      params.share_to_feed = 'true'
    }
  }
  const container = await graph(`/${userId}/media`, params)
  if (!container?.id) throw new Error('Instagram não devolveu id do container')

  // 2) espera o processamento do vídeo (mais longo que imagem)
  await waitContainerReady(container.id, token, { tries: 24, intervalMs: 2000 })

  // 3) publica (com retry para o 400 transitório)
  const published = await mediaPublish(userId, container.id, token)

  // 4) link (não crítico)
  let permalink = ''
  try {
    const info = await graph(`/${published.id}`, { fields: 'permalink', access_token: token }, 'GET')
    permalink = info?.permalink || ''
  } catch {
    /* segue sem link */
  }

  // 5) registra no banco (trial reel marcado à parte para o aprendizado)
  const postId = await logPost({
    published,
    permalink,
    mediaUrl: videoUrl,
    caption: mediaType === 'REELS' ? caption : null,
    meta,
    format: trial ? 'trial_reel' : target,
    mediaKind: 'video',
  })

  return { id: published.id, permalink, postId }
}

/**
 * Publica um CARROSSEL (2-10 imagens) no feed e registra em `posts`.
 * `imageUrls` são URLs públicas (já hospedadas no bucket).
 */
export async function publishCarousel({ imageUrls, caption, meta = {} }) {
  const { userId, token } = igConfig()
  const urls = (imageUrls || []).filter(Boolean).slice(0, 10)
  if (urls.length < 2) throw new Error('Carrossel precisa de ao menos 2 imagens')

  // 1) um container-filho por imagem (em paralelo)
  const children = await Promise.all(
    urls.map(async (image_url) => {
      const c = await graph(`/${userId}/media`, {
        image_url,
        is_carousel_item: 'true',
        access_token: token,
      })
      if (!c?.id) throw new Error('Instagram não devolveu id de um item do carrossel')
      return c.id
    }),
  )

  // 2) container do carrossel
  const container = await graph(`/${userId}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: caption || '',
    access_token: token,
  })
  if (!container?.id) throw new Error('Instagram não devolveu id do carrossel')

  // 3) espera pronto e publica (com retry)
  await waitContainerReady(container.id, token, { tries: 12, intervalMs: 2000 })
  const published = await mediaPublish(userId, container.id, token)

  // 4) link
  let permalink = ''
  try {
    const info = await graph(`/${published.id}`, { fields: 'permalink', access_token: token }, 'GET')
    permalink = info?.permalink || ''
  } catch {
    /* segue sem link */
  }

  // 5) registra
  const postId = await logPost({
    published,
    permalink,
    mediaUrl: urls[0],
    caption,
    meta,
    format: 'carousel',
    mediaKind: 'carousel',
  })

  return { id: published.id, permalink, postId }
}

/**
 * Lista a mídia JÁ publicada na conta (feed, carrossel e Reels), da mais recente
 * para a mais antiga, paginando até `max`. É a base do backfill: importar o que
 * já existe no perfil para o aprendizado não começar do zero.
 *
 * Observação: Stories não aparecem neste edge (são efêmeros e ficam em /stories);
 * aqui pegamos o conteúdo permanente do feed, que é o que interessa à análise.
 * Retorna os objetos crus da Graph API (id, caption, media_type, timestamp…).
 */
export async function listAccountMedia({ limit = 50, max = 100 } = {}) {
  const { userId, token } = igConfig()
  const fields =
    'id,caption,media_type,media_product_type,permalink,timestamp,media_url,thumbnail_url'
  const out = []
  let after = ''
  while (out.length < max) {
    const params = {
      fields,
      limit: String(Math.min(limit, max - out.length)),
      access_token: token,
    }
    if (after) params.after = after
    const page = await graph(`/${userId}/media`, params, 'GET')
    const items = page?.data || []
    out.push(...items)
    after = page?.paging?.cursors?.after || ''
    if (!after || !items.length) break
  }
  return out.slice(0, max)
}

/**
 * Lê as métricas de desempenho de um post publicado.
 * Tolerante: o que a API não devolver fica indefinido (não estoura).
 * Retorna { like_count, comments_count, reach, impressions, saved, shares }.
 */
export async function fetchMetrics(mediaId) {
  const { token } = igConfig()
  const out = {}

  // contadores diretos no objeto de mídia
  try {
    const m = await graph(
      `/${mediaId}`,
      { fields: 'like_count,comments_count', access_token: token },
      'GET',
    )
    if (typeof m.like_count === 'number') out.like_count = m.like_count
    if (typeof m.comments_count === 'number') out.comments_count = m.comments_count
  } catch {
    /* segue sem contadores */
  }

  // insights (alcance, salvos, compartilhamentos). Nem toda métrica existe para
  // todo tipo de mídia — pedimos um conjunto e aproveitamos o que vier.
  try {
    const ins = await graph(
      `/${mediaId}/insights`,
      { metric: 'reach,saved,shares,total_interactions', access_token: token },
      'GET',
    )
    for (const item of ins?.data || []) {
      const v = item?.values?.[0]?.value
      if (typeof v !== 'number') continue
      if (item.name === 'reach') out.reach = v
      else if (item.name === 'saved') out.saved = v
      else if (item.name === 'shares') out.shares = v
    }
  } catch {
    /* segue sem insights */
  }

  return out
}
