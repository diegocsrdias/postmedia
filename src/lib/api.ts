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
  caption?: string
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

/** Ranking (média por chave) devolvido pelo resumo de desempenho. */
export interface RankRow {
  key: string
  avg: number
  n: number
}

export interface InsightsSummary {
  count: number
  totalPosts: number
  byHour: RankRow[]
  byAngle: RankRow[]
  byLayout: RankRow[]
  byFormat: RankRow[]
}

/** Resumo de desempenho (melhores horários/ângulos) para orientar a criação. */
export async function fetchInsightsSummary(client: string): Promise<InsightsSummary> {
  return post<InsightsSummary>('insights-summary', { client })
}

/** Onde publicar um vídeo vertical: no Story, nos Reels, ou em ambos. */
export type StoryTarget = 'story' | 'reels'

/**
 * Sobe um vídeo (Blob) direto para o Storage do Supabase, via URL assinada
 * pedida ao backend — evita o limite de corpo da função e mantém as chaves no
 * servidor. Retorna o `path` do arquivo no bucket.
 */
const CONTENT_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

/** Sobe um Blob ao bucket via URL assinada. Devolve o `path` no bucket. */
export async function uploadFile(blob: Blob, client: string, ext: string): Promise<string> {
  const { uploadUrl, path } = await post<{ uploadUrl: string; path: string }>('ig-upload-url', {
    client,
    ext,
  })
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream', 'x-upsert': 'true' },
    body: blob,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error('Falha no upload: ' + res.status + ' ' + t.slice(0, 200))
  }
  return path
}

/** Publica um carrossel (imagens já subidas via uploadFile) no feed. */
export async function publishCarousel(
  paths: string[],
  caption: string,
  meta: PublishMeta,
): Promise<{ id: string; permalink?: string; postId?: string }> {
  return post<{ id: string; permalink?: string; postId?: string }>('ig-publish-carousel', {
    paths,
    caption,
    meta,
  })
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
  opts: { coverBase64?: string; trial?: boolean } = {},
): Promise<{ results: VideoPublishResult[] }> {
  return post<{ results: VideoPublishResult[] }>('ig-publish-video', {
    path,
    targets,
    caption,
    meta,
    coverBase64: opts.coverBase64,
    trial: opts.trial,
  })
}

/* ============================================================
   Histórico de criativos (postados + baixados)
   ============================================================ */

/** Tipo de mídia registrada no histórico. */
export type MediaKind = 'image' | 'video' | 'carousel'

/**
 * Registra um criativo BAIXADO no histórico: a mídia já foi subida ao bucket
 * (via uploadFile → `path`) e aqui gravamos a linha em `posts` com status
 * 'downloaded'. Não publica nada no Instagram.
 */
export async function logCreative(
  path: string,
  meta: PublishMeta,
  kind: MediaKind = 'image',
): Promise<{ id: string | null }> {
  return post<{ id: string | null }>('log-creative', { path, meta, kind })
}

/** Uma linha do histórico devolvida pelo backend. */
export interface HistoryItem {
  id: string
  created_at: string
  published_at: string | null
  client: string
  status: 'published' | 'downloaded' | string
  format: string | null
  media_kind: MediaKind | null
  layout: string | null
  angle: string | null
  headline: string | null
  caption: string | null
  hashtags: string | null
  media_url: string | null
  permalink: string | null
  ig_media_id: string | null
  like_count: number | null
  comments_count: number | null
  reach: number | null
  saved: number | null
  shares: number | null
  metrics_updated_at: string | null
}

/** Filtros opcionais do histórico. */
export interface HistoryFilters {
  status?: string
  format?: string
  limit?: number
}

/** Lista o histórico de criativos (postados e baixados) de um cliente. */
export async function fetchHistory(
  client: string,
  filters: HistoryFilters = {},
): Promise<{ items: HistoryItem[] }> {
  return post<{ items: HistoryItem[] }>('history-list', { client, ...filters })
}

/* ============================================================
   Aprendizado (memória de desempenho por cliente)
   ============================================================ */

export interface Learnings {
  client: string
  updated_at: string
  brief: string | null
  stats: {
    count: number
    byHour: RankRow[]
    byAngle: RankRow[]
    byLayout: RankRow[]
    byFormat: RankRow[]
  } | null
}

/** Lê a memória de aprendizado de um cliente (ou null se ainda não construída). */
export async function fetchLearnings(client: string): Promise<{ learnings: Learnings | null }> {
  return post<{ learnings: Learnings | null }>('learnings-get', { client })
}

/** Resultado da importação do histórico do Instagram. */
export interface ImportResult {
  client: string
  account_media: number
  already_had: number
  imported: number
  with_metrics: boolean
  learning: unknown
}

/**
 * Importa os posts que já existem na conta do Instagram para a base de
 * aprendizado (backfill). Idempotente: só traz o que ainda falta.
 */
export async function importInstagram(client: string, max = 100): Promise<ImportResult> {
  return post<ImportResult>('ig-import', { client, max })
}

/* ============================================================
   Agendador (autopilot)
   ============================================================ */

export type ScheduleFormat = 'feed' | 'carousel'

export interface ScheduleJob {
  id: string
  created_at: string
  client: string
  scheduled_for: string
  format: ScheduleFormat | string
  slides: number
  theme: string | null
  angle: string | null
  layout: string | null
  image_mode: string | null
  status: 'pending' | 'processing' | 'done' | 'error' | 'canceled' | string
  attempts: number
  last_error: string | null
  result_post_id: string | null
  ran_at: string | null
}

export interface ScheduleInput {
  client: string
  scheduledFor: string // ISO
  format: ScheduleFormat
  slides?: number
  theme?: string
  angle?: string
  imageMode?: 'none' | 'editorial' | 'promo'
}

/** Agenda um novo post automático. */
export async function createSchedule(input: ScheduleInput): Promise<{ job: ScheduleJob }> {
  return post<{ job: ScheduleJob }>('schedule-create', input)
}

/** Lista os jobs agendados de um cliente. */
export async function listSchedule(client: string): Promise<{ jobs: ScheduleJob[] }> {
  return post<{ jobs: ScheduleJob[] }>('schedule-list', { client })
}

/** Cancela um job agendado. */
export async function cancelSchedule(id: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>('schedule-cancel', { id })
}

/** Recomendação de cadência/horários com base no desempenho. */
export interface ScheduleRecommendation {
  perDay: number
  hours: number[]
  rationale: string
  basedOn: number
}

export async function fetchScheduleRecommendation(
  client: string,
): Promise<ScheduleRecommendation> {
  return post<ScheduleRecommendation>('schedule-recommend', { client })
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
