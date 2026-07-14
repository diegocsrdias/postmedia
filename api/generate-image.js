import { chat, image, preflight, readJson } from './_lib/openai.js'
import { imageIdeaPrompt, imagePrompt } from './_lib/prompts.js'

const SIZES = {
  square: '1024x1024',
  story: '1024x1536',
}

// Direcionamentos de estilo sorteados a cada geração, pra variar a composição
// da foto (ângulo, luz, enquadramento) mesmo quando o post é o mesmo.
const STYLE_HINTS = [
  'ângulo baixo, luz quente de manhã entrando de lado',
  'foto macro com foco raso (bokeh), luz suave de fim de tarde',
  'vista de cima (flat lay) sobre uma mesa de madeira clara',
  'ambiente doméstico aconchegante, luz natural vinda de uma janela',
  'cena ao ar livre, luz difusa de dia nublado',
  'still de estúdio, fundo desfocado e reflexos suaves',
  'foto de rua urbana ao entardecer, luzes suaves ao fundo',
  'ambiente de escritório moderno, luz lateral de janela grande',
  'cena aconchegante ao entardecer, luz dourada (golden hour)',
  'composição minimalista, muito espaço negativo, luz difusa e limpa',
]

function randomStyleHint() {
  return STYLE_HINTS[Math.floor(Math.random() * STYLE_HINTS.length)]
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { postText = '', idea = '', format = 'square' } = await readJson(req)
    const rawText = String(postText || idea || '').trim()
    if (!rawText) {
      res.status(400).json({ error: 'Post vazio' })
      return
    }

    // 1) IA de texto sugere uma cena que faça sentido com o conteúdo do post
    //    (sorteando um direcionamento de estilo pra não repetir sempre a mesma composição).
    const hint = randomStyleHint()
    const { system, user } = imageIdeaPrompt(rawText, hint)
    let sceneIdea = rawText
    try {
      const raw = await chat({ system, user, maxTokens: 200, temperature: 1.05 })
      const cleaned = String(raw || '')
        .trim()
        .replace(/^["“”']+|["“”']+$/g, '')
      if (cleaned) sceneIdea = cleaned
    } catch {
      // se a sugestão de cena falhar, seguimos com o texto do post cru
    }

    // 2) IA de imagem gera o fundo com base na cena sugerida
    const size = SIZES[format] || SIZES.square
    const dataUrl = await image({ prompt: imagePrompt(sceneIdea), size })
    res.status(200).json({ image: dataUrl, idea: sceneIdea })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
