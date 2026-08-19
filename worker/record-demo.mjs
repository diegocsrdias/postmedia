// Orquestra um vídeo de demonstração de ponta a ponta:
//   grava o app real (Playwright) -> compõe o 9:16 (ffmpeg) -> publica (API).
//
// Uso:
//   node record-demo.mjs --flow scan-nota                 (grava + compõe; salvo em out/)
//   node record-demo.mjs --flow scan-nota --publish       (também publica no Instagram)
//   node record-demo.mjs --flow scan-nota --targets reels,story --publish
//
// Variáveis de ambiente:
//   DINDIN_DEMO_URL        base do app de demo (ex.: https://demo.controledindin.com.br)
//   DINDIN_DEMO_EMAIL      login da conta DEMO (dados semeados/seguros)
//   DINDIN_DEMO_PASSWORD   senha da conta DEMO
//   POSTMEDIA_BASE_URL     base do postmedia (ex.: https://postmedia.vercel.app) — só com --publish

import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { recordFlow } from './lib/engine.mjs'
import { compose } from './lib/compose.mjs'
import { publish } from './lib/publish.mjs'
import { getFlow, flows } from './flows/dindin.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

function arg(name, def) {
  const i = process.argv.indexOf('--' + name)
  if (i === -1) return def
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

/**
 * Avisa o agendador (postmedia) que este Reel terminou, fechando o job na fila.
 * Só dispara quando veio do agendador (--job-id + --callback). O segredo vai em
 * ?key= (env POSTMEDIA_CRON_SECRET) — nunca no client_payload, pra não vazar nos
 * logs do Actions. Best-effort: uma falha aqui não deve mascarar o resultado.
 */
async function notifyScheduler({ jobId, callback, ok, error }) {
  if (!jobId || !callback) return
  try {
    const secret = process.env.CRON_SECRET || ''
    const url = callback + (secret ? '?key=' + encodeURIComponent(secret) : '')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId, ok, error: error ? String(error).slice(0, 500) : undefined }),
    })
    console.log('  callback do agendador:', res.status)
  } catch (err) {
    console.error('  falha no callback do agendador:', err?.message || err)
  }
}

async function main() {
  let flowId = arg('flow')
  if (!flowId) throw new Error('Informe --flow <id> (ex.: scan-nota)')
  // 'auto': sorteia um roteiro entre os disponíveis (usado pelo agendador).
  if (flowId === 'auto') {
    flowId = flows[Math.floor(Math.random() * flows.length)].id
    console.log('▶ flow auto → sorteado:', flowId)
  }
  const flow = getFlow(flowId)
  if (!flow) throw new Error('Fluxo desconhecido: ' + flowId)

  const baseUrl = process.env.DINDIN_DEMO_URL
  if (!baseUrl) throw new Error('DINDIN_DEMO_URL ausente')

  const outDir = join(HERE, 'out')
  await mkdir(outDir, { recursive: true })

  console.log('▶ gravando fluxo:', flowId)
  const { videoPath, captions, durationMs } = await recordFlow(flow, { baseUrl, outDir })
  console.log('  vídeo cru:', videoPath, '·', Math.round(durationMs / 1000) + 's')

  const outPath = join(outDir, 'dindin-' + flowId + '.mp4')
  console.log('▶ compondo 9:16 + legendas')
  await compose({ videoPath, outPath, captions, durationSec: durationMs / 1000 })
  console.log('  pronto:', outPath)

  if (arg('publish')) {
    const base = process.env.POSTMEDIA_BASE_URL
    if (!base) throw new Error('POSTMEDIA_BASE_URL ausente (necessário com --publish)')
    const client = String(arg('client', 'dindin'))
    const targets = String(arg('targets', 'reels')).split(',').map((s) => s.trim()).filter(Boolean)
    console.log('▶ publicando em:', targets.join(', '))
    const meta = {
      client,
      format: 'reels',
      layout: 'demo',
      angle: 'tema',
      headline: flow.title,
      caption: flow.caption,
    }
    const res = await publish({ base, videoPath: outPath, caption: flow.caption, meta, targets })
    console.log('  publicado:', JSON.stringify(res))
  }
}

// --job-id/--callback vêm quando o disparo veio do agendador (postmedia): ao
// terminar (ok OU erro) avisamos o backend pra fechar o job na fila.
const jobId = arg('job-id')
const callback = arg('callback')

main()
  .then(() => notifyScheduler({ jobId, callback, ok: true }))
  .catch(async (err) => {
    console.error('✖', err?.message || err)
    await notifyScheduler({ jobId, callback, ok: false, error: err?.message || err })
    process.exit(1)
  })
