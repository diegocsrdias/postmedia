import { cronGuard } from './_lib/cron.js'
import { listDueJobs, updateJob, uploadMedia } from './_lib/supabase.js'
import { materializeAll } from './_lib/schedule.js'
import { getClient } from './_lib/clients.js'
import { generateCreatives } from './_lib/generate.js'
import { generateBackground } from './_lib/image.js'
import { renderCreatives, closeBrowser } from './_lib/render.js'
import { publishImage, publishCarousel } from './_lib/ig.js'

// RUNNER do agendador (piloto automático). Acionado por cron (ou manualmente).
// Para cada job vencido: GERA o conteúdo (com aprendizado) → RENDERIZA a arte no
// Chromium headless → PUBLICA no Instagram (o publish já registra em `posts`,
// alimentando o histórico e o aprendizado). Erros por job não derrubam os demais.
//
// Processa um lote pequeno por chamada para respeitar o tempo máximo da função.
const MAX_PER_RUN = 3

// Este runner gera + renderiza (Chromium) + publica: precisa de mais fôlego que
// os demais endpoints. Config em nível de função (tem precedência sobre o
// vercel.json), evitando padrões de `functions` sobrepostos.
export const config = { maxDuration: 300 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (cronGuard(req, res)) return

  const results = []
  try {
    // materializa as regras recorrentes nas próximas ocorrências (idempotente)
    let materialized = 0
    try {
      materialized = await materializeAll()
    } catch {
      /* não deixa a materialização travar a publicação dos jobs já prontos */
    }

    const due = await listDueJobs(new Date().toISOString(), MAX_PER_RUN)
    for (const job of due) {
      results.push(await runJob(job))
    }
    await closeBrowser()
    res.status(200).json({ processed: results.length, materialized, results })
    return
  } catch (err) {
    await closeBrowser()
    res.status(502).json({ error: String(err?.message || err), results })
  }
}

async function runJob(job) {
  // marca em processamento (evita reprocessar se o cron reentrar)
  await updateJob(job.id, {
    status: 'processing',
    attempts: (job.attempts || 0) + 1,
    ran_at: new Date().toISOString(),
  })
  try {
    const client = getClient(job.client)
    const n = job.format === 'carousel' ? Math.max(2, job.slides || 3) : 1
    const creatives = await generateCreatives(client, { n, theme: job.theme || '' })

    // fundo por IA (opcional, best-effort — não derruba o post se falhar)
    if (job.image_mode && job.image_mode !== 'none') {
      for (const c of creatives) {
        try {
          const { image } = await generateBackground(client, {
            postText: postTextOf(c),
            format: 'square',
            mode: job.image_mode,
          })
          c.bgImage = image
        } catch {
          /* segue sem fundo */
        }
      }
    }

    // renderiza a arte (mesma do Estúdio) no servidor
    const payloads = creatives.map((c) => ({ clientId: client.id, square: true, creative: c }))
    const images = await renderCreatives(payloads)
    if (!images.length) throw new Error('render não produziu imagem')

    const first = creatives[0]
    const caption = (first.caption + (first.hashtags ? '\n\n' + first.hashtags : '')).trim()
    const meta = {
      client: client.id,
      format: 'feed',
      layout: first.layout,
      angle: first.angle,
      headline: first.f.headline || first.f.title || first.f.line1 || '',
      caption: first.caption,
      hashtags: first.hashtags,
      fields: first.f,
    }

    let published
    if (job.format === 'carousel') {
      const urls = []
      const now = new Date()
      for (let i = 0; i < images.length; i++) {
        const { buffer, mime } = decodeDataUrl(images[i])
        const path = `${client.id}/${now.getFullYear()}/sched-${now.getTime()}-${i}.jpg`
        urls.push(await uploadMedia(path, buffer, mime))
      }
      published = await publishCarousel({ imageUrls: urls, caption, meta })
    } else {
      published = await publishImage({ imageDataUrl: images[0], caption, meta })
    }

    await updateJob(job.id, {
      status: 'done',
      result_post_id: published.postId || null,
      last_error: null,
    })
    return { id: job.id, ok: true, postId: published.postId || null, igId: published.id }
  } catch (err) {
    const msg = String(err?.message || err)
    await updateJob(job.id, { status: 'error', last_error: msg.slice(0, 500) })
    return { id: job.id, ok: false, error: msg }
  }
}

/** Texto do post (campos + legenda) para orientar o fundo por IA. */
function postTextOf(c) {
  const f = c.f || {}
  return [
    f.badge, f.headline, f.highlight, f.sub, f.eyebrow, f.line1, f.line2, f.title,
    f.item1, f.item2, f.item3, f.question, f.quote, f.myth, f.truth, c.caption,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
}

/** Extrai buffer e mime de uma data URL de imagem. */
function decodeDataUrl(dataUrl) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(dataUrl || ''))
  if (!m) throw new Error('data URL de imagem inválida')
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
}
