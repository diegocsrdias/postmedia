import { preflight, readJson } from './_lib/openai.js'
import { insertJob } from './_lib/supabase.js'

// Agenda um post automático. Entrada:
//   { client, scheduledFor (ISO), format, slides?, theme?, angle?, imageMode? }
// Saída: { job }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const body = await readJson(req)
    const client = String(body.client || '').trim()
    if (!client) throw new Error('client ausente')
    const when = new Date(body.scheduledFor)
    if (isNaN(when.getTime())) throw new Error('scheduledFor inválido')

    const format = body.format === 'carousel' ? 'carousel' : 'feed'
    const slides = format === 'carousel' ? Math.min(10, Math.max(2, Number(body.slides) || 3)) : 1
    const imageMode = /^(none|editorial|promo)$/.test(String(body.imageMode)) ? body.imageMode : 'none'

    const job = await insertJob({
      client,
      scheduled_for: when.toISOString(),
      format,
      slides,
      theme: body.theme ? String(body.theme).slice(0, 200) : null,
      angle: body.angle ? String(body.angle) : null,
      layout: body.layout ? String(body.layout) : null,
      image_mode: imageMode,
      status: 'pending',
    })
    res.status(200).json({ job })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
