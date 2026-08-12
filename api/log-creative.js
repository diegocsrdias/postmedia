import { preflight, readJson } from './_lib/openai.js'
import { insertPost, publicUrl } from './_lib/supabase.js'

// Registra um criativo BAIXADO no histórico (não publica no Instagram).
// A mídia já foi subida ao bucket pelo navegador (via ig-upload-url → `path`);
// aqui só gravamos a linha em `posts` com status 'downloaded' e o "DNA" do
// criativo, para o histórico. Não entra na análise de desempenho (sem ig_media_id).
//
// Entrada: { path, meta, kind }. Saída: { id }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { path, meta = {}, kind = 'image' } = await readJson(req)
    if (!path) throw new Error('path ausente')
    const m = meta && typeof meta === 'object' ? meta : {}
    const mediaUrl = publicUrl(String(path))
    const row = await insertPost({
      client: String(m.client || 'post'),
      status: 'downloaded',
      media_kind: /^(image|video|carousel)$/.test(String(kind)) ? kind : 'image',
      media_url: mediaUrl,
      format: m.format || null,
      layout: m.layout || null,
      angle: m.angle || null,
      headline: m.headline || null,
      caption: m.caption || null,
      hashtags: m.hashtags || null,
      fields: m.fields || null,
      // sem ig_media_id/permalink: não foi ao ar.
      created_at: new Date().toISOString(),
    })
    res.status(200).json({ id: row?.id ?? null })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
