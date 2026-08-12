// Proteção dos endpoints acionados por cron (que geram custo/publicam).
//
// A Vercel, quando CRON_SECRET está configurado nas env vars, envia
// `Authorization: Bearer <CRON_SECRET>` ao chamar as rotas de cron. Aceitamos
// também o header manualmente (para disparo por ferramenta externa/teste) ou o
// mesmo segredo em `?key=` na query.
//
// Se CRON_SECRET NÃO estiver definido, o guard é permissivo (não trava nada) —
// assim nada quebra antes de você configurar o segredo.

/** Retorna true e responde 401 se a requisição não estiver autorizada. */
export function cronGuard(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // sem segredo configurado: não trava

  const auth = req.headers['authorization'] || req.headers['Authorization'] || ''
  const bearer = String(auth).replace(/^Bearer\s+/i, '')
  let key = ''
  try {
    key = new URL(req.url, 'http://x').searchParams.get('key') || ''
  } catch {
    /* ignore */
  }
  if (bearer === secret || key === secret) return false

  res.status(401).json({ error: 'Não autorizado' })
  return true
}
