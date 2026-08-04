// Cliente Supabase para as Vercel Functions (lado servidor).
//
// Usa a SERVICE ROLE KEY — que ignora RLS e NUNCA pode ir ao navegador.
// Fica só nas env vars do servidor. O navegador nunca toca no Supabase direto;
// tudo passa por /api.

import { createClient } from '@supabase/supabase-js'

export const BUCKET = process.env.SUPABASE_BUCKET || 'creatives'

let _client = null

/** Devolve o client singleton ou explica o que falta configurar. */
export function supabase() {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const missing = []
  if (!url) missing.push('SUPABASE_URL')
  if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length) {
    throw new Error('Configuração ausente no servidor: ' + missing.join(', '))
  }
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

/**
 * Sobe um arquivo no bucket e devolve a URL pública.
 * `path` é o caminho dentro do bucket (ex.: dindin/2026/post-123.jpg).
 */
export async function uploadMedia(path, buffer, contentType) {
  const sb = supabase()
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error('Supabase Storage: ' + error.message)
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Cria uma URL assinada para o navegador subir um arquivo direto ao bucket
 * (sem passar pelo corpo da função — bom para vídeos grandes).
 * Devolve { path, uploadUrl }.
 */
export async function createUploadUrl(path) {
  const sb = supabase()
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) throw new Error('Supabase Storage: ' + error.message)
  const url = process.env.SUPABASE_URL
  // `signedUrl` vem como caminho relativo; monta a URL absoluta do endpoint de upload.
  const uploadUrl = data.signedUrl.startsWith('http') ? data.signedUrl : url + '/storage/v1' + data.signedUrl
  return { path: data.path || path, uploadUrl }
}

/** URL pública de um arquivo já no bucket. */
export function publicUrl(path) {
  const sb = supabase()
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Insere uma linha em `posts` e devolve o registro criado. */
export async function insertPost(row) {
  const sb = supabase()
  const { data, error } = await sb.from('posts').insert(row).select().single()
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data
}

/** Posts já publicados (com id de mídia), mais recentes primeiro. */
export async function listPublishedPosts(limit = 50) {
  const sb = supabase()
  const { data, error } = await sb
    .from('posts')
    .select('id, ig_media_id')
    .not('ig_media_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Posts com dados para análise de desempenho (mais recentes primeiro). */
export async function listPostsForAnalysis(limit = 500) {
  const sb = supabase()
  const { data, error } = await sb
    .from('posts')
    .select('published_at, client, angle, layout, format, like_count, comments_count, reach, saved, shares')
    .not('ig_media_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Atualiza as métricas de um post. */
export async function updatePostMetrics(id, metrics) {
  const sb = supabase()
  const { error } = await sb
    .from('posts')
    .update({ ...metrics, metrics_updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error('Supabase DB: ' + error.message)
}
