// Dispara o workflow do worker (GitHub Actions) que GERA + PUBLICA um Reel.
//
// Por que Actions e não aqui: gerar o vídeo exige gravar o app real (Playwright)
// e compor o 9:16 (ffmpeg) — pesado demais para uma função serverless. O runner
// do agendador (Vercel) apenas DISPARA; o Action faz o trabalho e, ao terminar,
// chama de volta /api/schedule-complete para fechar o job na fila.
//
// Env vars necessárias no servidor (Vercel):
//   GITHUB_DISPATCH_TOKEN  token com permissão de disparar workflows no repo
//                          (fine-grained: Actions read/write; ou classic: repo)
//   GITHUB_REPO            'owner/repo' (ex.: 'diegocsrdias/postmedia')
//   GITHUB_EVENT_TYPE      opcional; padrão 'schedule-reel'

/** Lê a config do GitHub ou explica exatamente o que falta. */
function githubConfig() {
  const token = process.env.GITHUB_DISPATCH_TOKEN
  if (!token) throw new Error('Configuração ausente no servidor: GITHUB_DISPATCH_TOKEN')
  // Repo padrão deste projeto; só precisa de env se um dia mudar de repositório.
  const repo = process.env.GITHUB_REPO || 'diegocsrdias/postmedia'
  const eventType = process.env.GITHUB_EVENT_TYPE || 'schedule-reel'
  return { token, repo, eventType }
}

/**
 * Enfileira a geração/publicação de um Reel via repository_dispatch.
 * `client_payload` vira o contexto do job dentro do Action (job, flow, targets,
 * callback). Não espera o vídeo ficar pronto — só confirma o disparo.
 */
export async function dispatchReel({ jobId, client, flow, targets, callbackUrl }) {
  const { token, repo, eventType } = githubConfig()
  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      'user-agent': 'postmedia-scheduler',
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: {
        job_id: jobId,
        client,
        flow: flow || 'auto',
        targets: (targets && targets.length ? targets : ['reels']).join(','),
        callback: callbackUrl || '',
      },
    }),
  })
  // repository_dispatch responde 204 No Content quando aceito.
  if (res.status !== 204) {
    const detail = await res.text().catch(() => '')
    throw new Error(`GitHub dispatch ${res.status}: ${detail.slice(0, 200)}`)
  }
  return { dispatched: true }
}
