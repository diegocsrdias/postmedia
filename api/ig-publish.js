import { preflight, readJson } from './_lib/openai.js'
import { publishImage } from './_lib/ig.js'

// Posta um criativo (imagem) direto no feed do Instagram e registra em `posts`.
// Entrada: { imageDataUrl, caption, meta }. Saída: { id, permalink, postId }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { imageDataUrl, caption = '', meta = {} } = await readJson(req)
    if (!imageDataUrl) throw new Error('imageDataUrl ausente')
    const result = await publishImage({
      imageDataUrl,
      caption: String(caption),
      meta: meta && typeof meta === 'object' ? meta : {},
    })
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
