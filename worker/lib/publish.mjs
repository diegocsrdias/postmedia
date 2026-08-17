// Publicação: reusa os endpoints que o postmedia JÁ tem, então o worker não
// precisa de chave do Supabase nem de nenhum endpoint novo. Fluxo:
//   1) pede uma URL de upload assinada (/api/ig-upload-url)
//   2) sobe o mp4 direto pro bucket (PUT)
//   3) manda publicar como Reels/Story (/api/ig-publish-video)

import { readFile } from 'node:fs/promises'

export async function publish({ base, videoPath, caption, meta, targets = ['reels'] }) {
  const api = base.replace(/\/$/, '')

  // 1) URL assinada de upload
  const up = await postJson(api + '/api/ig-upload-url', { client: meta.client, ext: 'mp4' })
  if (!up.uploadUrl || !up.path) throw new Error('ig-upload-url não devolveu uploadUrl/path')

  // 2) sobe o arquivo
  const body = await readFile(videoPath)
  const put = await fetch(up.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4', 'x-upsert': 'true' },
    body,
  })
  if (!put.ok) throw new Error('Falha no upload do vídeo: ' + put.status)

  // 3) publica
  return postJson(api + '/api/ig-publish-video', { path: up.path, targets, caption, meta })
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(url + ' -> ' + res.status + ' ' + JSON.stringify(data).slice(0, 200))
  return data
}
