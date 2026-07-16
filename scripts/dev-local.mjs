// Servidor de dev local que replica o ambiente da Vercel:
// - Vite (front-end) como middleware, com HMR
// - as MESMAS funções de /api montadas em /api/*
//
// Uso: carrega .env, depois `node scripts/dev-local.mjs`
// (não versionado como fluxo oficial — só para testar a API localmente sem
//  precisar de login na Vercel; em produção, a Vercel roda api/*.js sozinha.)

import http from 'node:http'
import fs from 'node:fs'
import { createServer as createViteServer } from 'vite'

// ---- carregar .env manualmente (sem dependências) ----
try {
  const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  console.warn('[.env] não encontrado — a IA vai falhar sem OPENAI_API_KEY')
}

const PORT = Number(process.env.PORT || 3000)

const apiHandlers = {
  '/api/generate-ads': () => import('../api/generate-ads.js'),
  '/api/generate-theme': () => import('../api/generate-theme.js'),
  '/api/generate-mix': () => import('../api/generate-mix.js'),
  '/api/generate-image': () => import('../api/generate-image.js'),
}

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
})

/** Adiciona os helpers de res que a Vercel injeta (status/json), sobre o res do Node. */
function vercelifyRes(res) {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(obj))
    return res
  }
  return res
}

const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0]
  const loader = apiHandlers[url]
  if (loader) {
    vercelifyRes(res)
    loader()
      .then((mod) => mod.default(req, res))
      .catch((err) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(err?.message || err) }))
      })
    return
  }
  vite.middlewares(req, res)
})

server.listen(PORT, () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY)
  console.log(`\n  dev-local em http://localhost:${PORT}`)
  console.log(`  OPENAI_API_KEY: ${hasKey ? 'presente ✓' : 'AUSENTE ✗ (IA vai falhar)'}`)
  console.log(`  modelo texto: ${process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'}`)
  console.log(`  modelo imagem: ${process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'}\n`)
})
