import { preflight, readJson } from './_lib/openai.js'
import { publishCarousel } from './_lib/ig.js'
import { publicUrl } from './_lib/supabase.js'

// Publica um carrossel (imagens já no bucket) no feed.
// Entrada: { paths: [...], caption, meta }. Saída: { id, permalink, postId }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { paths = [], caption = '', meta = {} } = await readJson(req)
    const list = (Array.isArray(paths) ? paths : []).filter(Boolean)
    if (list.length < 2) throw new Error('Carrossel precisa de ao menos 2 imagens')
    const imageUrls = list.map((p) => publicUrl(String(p)))
    const result = await publishCarousel({
      imageUrls,
      caption: String(caption),
      meta: meta && typeof meta === 'object' ? meta : {},
    })
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
