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
import { getFlow } from './flows/dindin.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

function arg(name, def) {
  const i = process.argv.indexOf('--' + name)
  if (i === -1) return def
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

async function main() {
  const flowId = arg('flow')
  if (!flowId) throw new Error('Informe --flow <id> (ex.: scan-nota)')
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
    const targets = String(arg('targets', 'reels')).split(',').map((s) => s.trim())
    console.log('▶ publicando em:', targets.join(', '))
    const meta = {
      client: 'dindin',
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

main().catch((err) => {
  console.error('✖', err?.message || err)
  process.exit(1)
})
