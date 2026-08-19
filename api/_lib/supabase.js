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

/** Insere várias linhas em `posts` de uma vez. Devolve os ids/ig_media_id criados. */
export async function insertPosts(rows) {
  if (!rows || !rows.length) return []
  const sb = supabase()
  const { data, error } = await sb.from('posts').insert(rows).select('id, ig_media_id')
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/**
 * Conjunto dos ig_media_id já registrados de um cliente — usado pela importação
 * do Instagram para não gravar o mesmo post duas vezes ao reimportar.
 */
export async function listClientMediaIds(client) {
  const sb = supabase()
  const { data, error } = await sb
    .from('posts')
    .select('ig_media_id')
    .eq('client', client)
    .not('ig_media_id', 'is', null)
    .limit(2000)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return new Set((data || []).map((r) => r.ig_media_id))
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
    .select('published_at, client, angle, layout, format, headline, like_count, comments_count, reach, saved, shares')
    .not('ig_media_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/**
 * Histórico de criativos: tudo que foi POSTADO ou só BAIXADO (o `status`
 * distingue). Ao contrário de listPostsForAnalysis, NÃO filtra por ig_media_id,
 * então downloads entram. Ordena pelo que aconteceu por último.
 */
export async function listHistory(client, { status, format, limit = 60 } = {}) {
  const sb = supabase()
  let q = sb
    .from('posts')
    .select(
      'id, created_at, published_at, client, status, format, media_kind, layout, angle, headline, caption, hashtags, media_url, permalink, ig_media_id, like_count, comments_count, reach, saved, shares, metrics_updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 60, 1), 200))
  if (client) q = q.eq('client', client)
  if (status) q = q.eq('status', status)
  if (format) q = q.eq('format', format)
  const { data, error } = await q
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Lê a memória de aprendizado de um cliente (ou null se ainda não existe). */
export async function getLearnings(client) {
  const sb = supabase()
  const { data, error } = await sb
    .from('learnings')
    .select('client, updated_at, brief, stats')
    .eq('client', client)
    .maybeSingle()
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || null
}

/**
 * Igual a getLearnings, mas nunca lança: devolve null em qualquer erro (tabela
 * ausente, sem config, etc.). Usado nos geradores, onde a falta de aprendizado
 * não pode derrubar a geração.
 */
export async function safeLearnings(client) {
  try {
    return await getLearnings(client)
  } catch {
    return null
  }
}

/** Grava/atualiza a memória de aprendizado de um cliente. */
export async function upsertLearnings(client, brief, stats) {
  const sb = supabase()
  const { error } = await sb
    .from('learnings')
    .upsert(
      { client, brief: brief || null, stats: stats || null, updated_at: new Date().toISOString() },
      { onConflict: 'client' },
    )
  if (error) throw new Error('Supabase DB: ' + error.message)
}

// ---- Fila do agendador (autopilot) ----

/** Jobs vencidos e ainda pendentes (mais antigos primeiro). */
export async function listDueJobs(nowIso, limit = 5) {
  const sb = supabase()
  const { data, error } = await sb
    .from('schedule')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(limit)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Insere um job na fila e devolve o registro criado. */
export async function insertJob(row) {
  const sb = supabase()
  const { data, error } = await sb.from('schedule').insert(row).select().single()
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data
}

/** Aplica um patch parcial a um job. */
export async function updateJob(id, patch) {
  const sb = supabase()
  const { error } = await sb.from('schedule').update(patch).eq('id', id)
  if (error) throw new Error('Supabase DB: ' + error.message)
}

/**
 * Recupera jobs presos em `processing` (a função morreu por timeout/crash antes
 * de finalizar, deixando o job em "Publicando…" para sempre). Rodado no início
 * do runner: quem passou do limite e ainda tem tentativas volta pra fila
 * (`pending`); quem já esgotou as tentativas vira `error` (visível na UI).
 * `thresholdIso` = corte de `ran_at` (jobs mais antigos que isso são reclamados).
 * Devolve { retried, failed }.
 */
export async function reclaimStuckJobs(thresholdIso, maxAttempts = 3) {
  const sb = supabase()
  // esgotou as tentativas → desiste e mostra o erro
  const giveUp = await sb
    .from('schedule')
    .update({ status: 'error', last_error: 'Publicação interrompida (timeout do servidor)' })
    .eq('status', 'processing')
    .neq('format', 'reels') // reels rodam no Actions e são fechados pelo callback
    .lt('ran_at', thresholdIso)
    .gte('attempts', maxAttempts)
    .select('id')
  if (giveUp.error) throw new Error('Supabase DB: ' + giveUp.error.message)

  // ainda tem tentativa → recoloca na fila para o próximo ciclo do cron
  const retry = await sb
    .from('schedule')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .neq('format', 'reels')
    .lt('ran_at', thresholdIso)
    .lt('attempts', maxAttempts)
    .select('id')
  if (retry.error) throw new Error('Supabase DB: ' + retry.error.message)

  return { retried: (retry.data || []).length, failed: (giveUp.data || []).length }
}

/**
 * Reels ficam em `processing` enquanto o GitHub Actions gera o vídeo (minutos) e
 * são fechados pelo callback /api/schedule-complete. Se o callback nunca chega
 * (Action falhou/cancelado) o job passa do prazo — aqui marcamos como erro para
 * não ficar "Publicando…" eterno. NÃO reenfileira (evita gerar/postar o vídeo
 * duas vezes). `thresholdIso` = corte de `ran_at` (bem folgado, ~45min).
 */
export async function reclaimStuckReels(thresholdIso) {
  const sb = supabase()
  const { data, error } = await sb
    .from('schedule')
    .update({ status: 'error', last_error: 'Geração do Reel não retornou a tempo (Actions)' })
    .eq('status', 'processing')
    .eq('format', 'reels')
    .lt('ran_at', thresholdIso)
    .select('id')
  if (error) throw new Error('Supabase DB: ' + error.message)
  return { failed: (data || []).length }
}

/** Lista os jobs de um cliente (mais recentes/futuros primeiro) para a UI. */
export async function listJobs(client, limit = 50) {
  const sb = supabase()
  let q = sb
    .from('schedule')
    .select('*')
    .order('scheduled_for', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 200))
  if (client) q = q.eq('client', client)
  const { data, error } = await q
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

// ---- Regras de recorrência ----

/** Cria uma regra recorrente e devolve o registro. */
export async function insertRule(row) {
  const sb = supabase()
  const { data, error } = await sb.from('schedule_rules').insert(row).select().single()
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data
}

/** Lista as regras de um cliente (mais recentes primeiro). */
export async function listRules(client, limit = 100) {
  const sb = supabase()
  let q = sb.from('schedule_rules').select('*').order('created_at', { ascending: false }).limit(limit)
  if (client) q = q.eq('client', client)
  const { data, error } = await q
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Todas as regras ativas (usadas pelo materializador do runner). */
export async function listActiveRules() {
  const sb = supabase()
  const { data, error } = await sb.from('schedule_rules').select('*').eq('active', true)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data || []
}

/** Apaga uma regra. Devolve o cliente dono (ou null) para revalidação. */
export async function deleteRule(id) {
  const sb = supabase()
  const { data, error } = await sb.from('schedule_rules').delete().eq('id', id).select('client').maybeSingle()
  if (error) throw new Error('Supabase DB: ' + error.message)
  return data?.client ?? null
}

/** scheduled_for já materializados de uma regra numa janela (para dedupe). */
export async function listRuleSlots(ruleId, fromIso, toIso) {
  const sb = supabase()
  const { data, error } = await sb
    .from('schedule')
    .select('scheduled_for')
    .eq('rule_id', ruleId)
    .gte('scheduled_for', fromIso)
    .lte('scheduled_for', toIso)
  if (error) throw new Error('Supabase DB: ' + error.message)
  return new Set((data || []).map((r) => r.scheduled_for))
}

/** Cancela os jobs FUTUROS ainda pendentes de uma regra (ao pausar/apagar). */
export async function cancelFutureRuleJobs(ruleId) {
  const sb = supabase()
  const { error } = await sb
    .from('schedule')
    .update({ status: 'canceled' })
    .eq('rule_id', ruleId)
    .eq('status', 'pending')
    .gt('scheduled_for', new Date().toISOString())
  if (error) throw new Error('Supabase DB: ' + error.message)
}
