/**
 * Cliente do backend (Vercel Functions em /api).
 * A chave da OpenAI vive SÓ no servidor — o navegador nunca a vê.
 *
 * Base configurável via VITE_API_BASE (padrão: mesma origem, '/api').
 */

import type { Angle, Creative, CreativeFields, Format } from '../types'
import { EDIT_FIELDS } from '../data/shared'
import { deriveVcap } from './creatives'

const BASE = import.meta.env.VITE_API_BASE || '/api'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Erro ${res.status}`)
  }
  return data as T
}

/** Gera `n` conceitos de ANÚNCIO via backend. */
export async function generateAds(
  n: number,
  existingHeadlines: string,
  clientId: string,
): Promise<Creative[]> {
  const { items } = await post<{ items: RawAd[] }>('generate-ads', {
    n,
    existingHeadlines,
    clientId,
  })
  const fresh = (items || [])
    .filter((x) => x && x.f && x.f.headline)
    .slice(0, n)
    .map((x, i) => {
      const f = { ...x.f }
      return {
        layout: 'ad' as const,
        angle: 'anuncio' as const,
        f,
        caption: x.caption || '',
        hashtags: x.hashtags || '',
        vcap: (x.vcap && String(x.vcap).trim()) || deriveVcap('ad', f),
        _key: 'ad-ai-' + Date.now() + '-' + i,
      }
    })
  if (!fresh.length) throw new Error('empty')
  return fresh
}

/** Converte a resposta bruta de criativos temáticos/mix em `Creative[]`. */
function toCreatives(items: RawThemed[] | undefined, angle: Angle, prefix: string): Creative[] {
  const valid = (items || []).filter((x) => x && x.layout && EDIT_FIELDS[x.layout] && x.f)
  if (!valid.length) throw new Error('empty')
  return valid.map((x, i) => {
    const layout = x.layout!
    const f = { ...x.f }
    return {
      layout,
      angle,
      f,
      caption: x.caption || '',
      hashtags: x.hashtags || '',
      vcap: (x.vcap && String(x.vcap).trim()) || deriveVcap(layout, f),
      _key: prefix + '-' + i + '-' + Math.random().toString(36).slice(2, 7),
    }
  })
}

/** Gera `n` criativos amarrando um tema em alta via backend. */
export async function generateByTheme(
  n: number,
  theme: string,
  clientId: string,
): Promise<Creative[]> {
  const { items } = await post<{ items: RawThemed[] }>('generate-theme', { n, theme, clientId })
  return toCreatives(items, 'tema', 'tema').slice(0, n)
}

/**
 * Gera `n` criativos "do dia" com IA, SEM tema fixo (usado pelo botão principal
 * e pelo "Trocar"). `existing` são textos já na tela, pra a IA não repetir.
 */
export async function generateMix(
  n: number,
  existing: string,
  clientId: string,
): Promise<Creative[]> {
  const { items } = await post<{ items: RawThemed[] }>('generate-mix', { n, existing, clientId })
  return toCreatives(items, 'tema', 'mix').slice(0, n)
}

/** Estilo da imagem de fundo: editorial (sóbria) ou promo (propaganda vibrante). */
export type ImageMode = 'editorial' | 'promo'

/**
 * Gera uma imagem de fundo por IA a partir do texto do post.
 * O servidor usa a IA de texto para bolar (de forma aleatória) uma cena que
 * faça sentido com o conteúdo, e então gera a imagem dessa cena.
 * `mode` escolhe entre foto editorial sóbria e imagem de propaganda vibrante.
 * Retorna a data URL (PNG) e a ideia de cena usada.
 */
export async function generateImage(
  postText: string,
  format: Format,
  clientId: string,
  mode: ImageMode = 'editorial',
): Promise<{ image: string; idea: string; mode?: ImageMode }> {
  return post<{ image: string; idea: string; mode?: ImageMode }>('generate-image', {
    postText,
    format,
    clientId,
    mode,
  })
}

/** Dados estruturados do criativo, guardados no banco para o aprendizado. */
export interface PublishMeta {
  client: string
  format?: 'feed' | 'story'
  layout?: string
  angle?: string
  headline?: string
  hashtags?: string
  fields?: CreativeFields
}

/**
 * Publica um criativo (imagem) direto no feed do Instagram, via backend.
 * `imageDataUrl` é o JPEG capturado do card (ver captureJpeg em lib/export).
 * `meta` são os dados do criativo, registrados em `posts` para cruzar com o
 * desempenho depois. Retorna o id do post e, quando disponível, o link.
 */
export async function publishToInstagram(
  imageDataUrl: string,
  caption: string,
  meta: PublishMeta,
): Promise<{ id: string; permalink?: string; postId?: string }> {
  return post<{ id: string; permalink?: string; postId?: string }>('ig-publish', {
    imageDataUrl,
    caption,
    meta,
  })
}

/** Onde publicar um vídeo vertical: no Story, nos Reels, ou em ambos. */
export type StoryTarget = 'story' | 'reels'

/**
 * Sobe um vídeo (Blob) direto para o Storage do Supabase, via URL assinada
 * pedida ao backend — evita o limite de corpo da função e mantém as chaves no
 * servidor. Retorna o `path` do arquivo no bucket.
 */
export async function uploadVideo(blob: Blob, client: string, ext: string): Promise<string> {
  const { uploadUrl, path } = await post<{ uploadUrl: string; path: string }>('ig-upload-url', {
    client,
    ext,
  })
  const contentType = ext === 'webm' ? 'video/webm' : 'video/mp4'
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'x-upsert': 'true' },
    body: blob,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error('Falha no upload do vídeo: ' + res.status + ' ' + t.slice(0, 200))
  }
  return path
}

/**
 * Publica um vídeo já hospedado (path no bucket) no Story e/ou nos Reels.
 * Registra cada publicação em `posts`. Retorna os ids/links por alvo.
 */
export interface VideoPublishResult {
  target: StoryTarget
  id?: string
  permalink?: string
  error?: string
}

export async function publishVideoToInstagram(
  path: string,
  targets: StoryTarget[],
  caption: string,
  meta: PublishMeta,
  coverBase64?: string,
): Promise<{ results: VideoPublishResult[] }> {
  return post<{ results: VideoPublishResult[] }>('ig-publish-video', {
    path,
    targets,
    caption,
    meta,
    coverBase64,
  })
}

interface RawAd {
  f?: Record<string, string>
  caption?: string
  hashtags?: string
  vcap?: string
}

interface RawThemed {
  layout?: keyof typeof EDIT_FIELDS
  f?: Record<string, string>
  caption?: string
  hashtags?: string
  vcap?: string
}
