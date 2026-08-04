import { preflight, readJson } from './_lib/openai.js'
import { publishVideo } from './_lib/ig.js'
import { publicUrl } from './_lib/supabase.js'

// Publica um vídeo (já no bucket) no Story e/ou nos Reels.
// Entrada: { path, targets: ['story','reels'], caption, meta }.
// Saída: { results: [{ target, id, permalink }] }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { path, targets = [], caption = '', meta = {} } = await readJson(req)
    if (!path) throw new Error('path do vídeo ausente')
    const list = (Array.isArray(targets) ? targets : []).filter((t) => t === 'story' || t === 'reels')
    if (!list.length) throw new Error('nenhum alvo válido (story/reels)')

    const videoUrl = publicUrl(String(path))
    const cleanMeta = meta && typeof meta === 'object' ? meta : {}

    // Publica os alvos em paralelo (Story e Reels são containers independentes),
    // para o "Ambos" caber no tempo da função. Reporta sucesso/erro por alvo.
    const settled = await Promise.allSettled(
      list.map((target) =>
        publishVideo({ videoUrl, caption: String(caption), target, meta: cleanMeta }),
      ),
    )
    const results = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? { target: list[i], id: s.value.id, permalink: s.value.permalink }
        : { target: list[i], error: String(s.reason?.message || s.reason) },
    )
    // Se todos falharam, devolve 502 com o erro para o app mostrar.
    if (results.every((r) => r.error)) {
      throw new Error(results.map((r) => `${r.target}: ${r.error}`).join(' | '))
    }
    res.status(200).json({ results })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
