import { image, preflight, readJson } from './_lib/openai.js'
import { imagePrompt } from './_lib/prompts.js'

const SIZES = {
  square: '1024x1024',
  story: '1024x1536',
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { idea = '', format = 'square' } = await readJson(req)
    const text = String(idea || '').trim()
    if (!text) {
      res.status(400).json({ error: 'Ideia vazia' })
      return
    }
    const size = SIZES[format] || SIZES.square
    const dataUrl = await image({ prompt: imagePrompt(text), size })
    res.status(200).json({ image: dataUrl })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
