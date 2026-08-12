import { preflight, readJson } from './_lib/openai.js'
import { getClient } from './_lib/clients.js'
import { generateBackground } from './_lib/image.js'

// Gera um fundo por IA a partir do texto do post. A lógica vive em _lib/image.js
// (reutilizada pelo agendador). Entrada: { postText|idea, format, clientId, mode }.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { postText = '', idea = '', format = 'square', clientId = '', mode = 'editorial' } =
      await readJson(req)
    const client = getClient(clientId)
    const text = String(postText || idea || '').trim()
    if (!text) {
      res.status(400).json({ error: 'Post vazio' })
      return
    }
    const out = await generateBackground(client, { postText: text, format, mode })
    res.status(200).json(out)
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
