// Proteção dos endpoints acionados por cron/automação (que geram custo/publicam).
//
// A Vercel, quando CRON_SECRET está configurado nas env vars, envia
// `Authorization: Bearer <CRON_SECRET>` ao chamar as rotas de cron. O worker do
// GitHub Actions manda o mesmo segredo. A POSTMEDIA_ADMIN_KEY também é aceita,
// para você disparar uma rota destas manualmente pelo app.
//
// Antes, sem CRON_SECRET definido o guard ficava ABERTO. Agora fica FECHADO:
// a regra é a mesma de todas as rotas (api/_lib/auth.js).

import { requireAuth } from './auth.js'

/** Retorna true e responde 401/503 se a requisição não estiver autorizada. */
export function cronGuard(req, res) {
  return requireAuth(req, res)
}
