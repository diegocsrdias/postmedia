// Helper compartilhado das Vercel Functions.
// A chave OPENAI_API_KEY vem das env vars do servidor — NUNCA vai ao navegador.

const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations'

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'

function apiKey() {
  const k = process.env.OPENAI_API_KEY
  if (!k) throw new Error('OPENAI_API_KEY ausente nas variáveis de ambiente do servidor')
  return k
}

/** Chat Completions → texto. */
export async function chat({
  system,
  user,
  maxTokens = 1800,
  temperature = 0.9,
  presencePenalty,
  frequencyPenalty,
}) {
  const body = {
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
  }
  // penalidades ajudam a IA a não repetir as mesmas palavras/aberturas
  if (typeof presencePenalty === 'number') body.presence_penalty = presencePenalty
  if (typeof frequencyPenalty === 'number') body.frequency_penalty = frequencyPenalty
  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

/** Gera uma imagem e retorna data URL (base64). */
export async function image({ prompt, size = '1024x1024' }) {
  const res = await fetch(IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size,
      n: 1,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const item = data?.data?.[0]
  // gpt-image-1 sempre devolve b64_json; DALL·E pode devolver url.
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`
  if (item?.url) return item.url
  throw new Error('Resposta de imagem sem dados')
}

/**
 * Extrai o primeiro array JSON de um texto (a IA às vezes adiciona crases/texto,
 * vírgula sobrando ou corta a resposta no meio). É tolerante:
 * 1) tenta o parse direto; 2) remove vírgulas finais e tenta de novo;
 * 3) como último recurso, resgata os objetos {...} completos, um a um.
 */
export function extractJsonArray(txt) {
  let s = String(txt || '').trim()
  const m = s.match(/\[[\s\S]*\]/)
  if (m) s = m[0]

  const tryParse = (str) => {
    try {
      const v = JSON.parse(str)
      return Array.isArray(v) ? v : null
    } catch {
      return null
    }
  }

  // 1) direto
  let out = tryParse(s)
  if (out) return out

  // 2) tira vírgulas antes de ] ou }
  out = tryParse(s.replace(/,\s*([}\]])/g, '$1'))
  if (out) return out

  // 3) resgata objetos completos individualmente (aguenta truncamento no fim)
  const salvaged = []
  let depth = 0
  let start = -1
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        const obj = tryParse('[' + s.slice(start, i + 1) + ']')
        if (obj && obj[0]) salvaged.push(obj[0])
        start = -1
      }
    }
  }
  if (salvaged.length) return salvaged

  // sem jeito: deixa o JSON.parse original estourar com a mensagem real
  return JSON.parse(s)
}

/** Lê o corpo JSON de uma request da Vercel (Node runtime). */
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

/** Aplica CORS/headers padrão e responde OPTIONS. Retorna true se já respondeu. */
export function preflight(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return true
  }
  return false
}
