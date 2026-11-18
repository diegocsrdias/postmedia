import { timingSafeEqual } from 'node:crypto'

// Autenticação de TODAS as rotas /api.
//
// Antes, só os endpoints de cron checavam segredo (e mesmo assim ficavam
// abertos se o CRON_SECRET não estivesse configurado). Os demais — inclusive
// /api/ig-publish — aceitavam requisição de qualquer origem: quem descobrisse a
// URL do deploy conseguia publicar no Instagram dos clientes e gastar a chave da
// OpenAI.
//
// Agora toda rota exige uma destas chaves:
//   • POSTMEDIA_ADMIN_KEY — a chave que VOCÊ digita no app (uma vez por navegador);
//   • CRON_SECRET        — a chave das automações (cron da Vercel, worker do
//                          GitHub Actions, pingers externos).
//
// A chave pode vir no header `X-Postmedia-Key`, em `Authorization: Bearer <chave>`
// ou em `?key=<chave>` (este último só por compatibilidade com o callback do
// worker e pingers antigos; prefira o header).
//
// Sem nenhuma chave configurada no servidor, a API fica FECHADA (503), não
// aberta: esquecer de configurar não pode virar porta escancarada.

function configuredKeys() {
  return [process.env.POSTMEDIA_ADMIN_KEY, process.env.CRON_SECRET]
    .map((k) => String(k || '').trim())
    .filter(Boolean)
}

function presentedKey(req) {
  const h = req.headers || {}
  const direct = h['x-postmedia-key']
  if (direct) return String(direct).trim()

  const auth = String(h['authorization'] || '')
  const bearer = auth.replace(/^Bearer\s+/i, '').trim()
  if (bearer && bearer !== auth.trim()) return bearer

  try {
    return (new URL(req.url, 'http://x').searchParams.get('key') || '').trim()
  } catch {
    return ''
  }
}

/** Comparação em tempo constante (evita descobrir a chave por timing). */
function sameKey(a, b) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/**
 * Responde 401/503 e devolve true se a requisição NÃO estiver autorizada.
 * Uso: `if (requireAuth(req, res)) return`
 */
export function requireAuth(req, res) {
  const keys = configuredKeys()
  if (!keys.length) {
    res.status(503).json({
      error: 'API bloqueada: configure POSTMEDIA_ADMIN_KEY (e CRON_SECRET) nas variáveis de ambiente.',
    })
    return true
  }
  const key = presentedKey(req)
  if (key && keys.some((k) => sameKey(key, k))) return false

  res.status(401).json({ error: 'Não autorizado' })
  return true
}

/** Headers aceitos no CORS (o navegador precisa poder mandar a chave). */
export const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Postmedia-Key'
