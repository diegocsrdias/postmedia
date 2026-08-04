import { preflight, readJson } from './_lib/openai.js'
import { createUploadUrl } from './_lib/supabase.js'

// Devolve uma URL assinada para o navegador subir o vídeo direto ao bucket.
// Entrada: { client, ext }. Saída: { uploadUrl, path }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { client = 'post', ext = 'mp4' } = await readJson(req)
    const safeExt = /^(mp4|webm|jpg|jpeg|png)$/.test(String(ext)) ? ext : 'mp4'
    const now = new Date()
    const path = `${String(client)}/${now.getFullYear()}/${now.getTime()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${safeExt}`
    const out = await createUploadUrl(path)
    res.status(200).json(out)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
