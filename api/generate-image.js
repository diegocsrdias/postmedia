import { chat, image, preflight, readJson } from './_lib/openai.js'
import { imageIdeaPrompt, imagePrompt } from './_lib/prompts.js'
import { getClient, randomImageWorld } from './_lib/clients.js'

const SIZES = {
  square: '1024x1024',
  story: '1024x1536',
}

// Em vez de um único "style hint" (que fazia as imagens convergirem sempre
// pro mesmo visual), a direção de arte agora é COMBINATÓRIA: sorteamos um
// valor de cada eixo independente. Isso multiplica o espaço de resultados
// possíveis (ângulo × lente × luz × hora × composição × clima), então cada
// geração sai visualmente distinta mesmo pro mesmo post.
const AXES = {
  editorial: {
    angle: [
      'ângulo baixo, olhando para a pessoa',
      'plano médio da pessoa no ambiente',
      'foto na altura dos olhos, frontal com a pessoa',
      'ângulo diagonal de três quartos sobre a pessoa',
      'câmera por cima do ombro da pessoa, vendo a cena',
      'close-up no rosto e nas mãos da pessoa',
    ],
    lens: [
      'lente 35mm, pessoa dentro do ambiente em foco',
      'lente 50mm, retrato com profundidade natural',
      'lente 85mm com a pessoa em foco e fundo desfocado (bokeh)',
      'foco raso no rosto, com um gesto em destaque',
      'grande-angular suave, pessoa e ambiente amplos',
    ],
    light: [
      'luz quente entrando de lado por uma janela',
      'luz difusa e suave de dia nublado',
      'luz dourada de fim de tarde (golden hour)',
      'luz de manhã limpa e clara',
      'contraluz suave com reflexos',
      'luz de estúdio controlada, sombras macias',
    ],
    time: ['início de manhã', 'meio do dia', 'fim de tarde', 'entardecer', 'hora azul'],
    composition: [
      'muito espaço negativo, minimalista',
      'composição rica e cheia de camadas',
      'regra dos terços, assunto deslocado do centro',
      'enquadramento simétrico e organizado',
      'primeiro plano em foco e fundo respirando',
    ],
    mood: [
      'clima aconchegante e acolhedor',
      'clima clean e organizado',
      'clima sereno e introspectivo',
      'clima produtivo e otimista',
      'clima natural e espontâneo',
    ],
  },
  // Modo propaganda: os mesmos eixos, mas puxados pro dramático/vendedor.
  promo: {
    angle: [
      'ângulo baixo heroico, a pessoa imponente',
      'close-up dramático no rosto da pessoa (herói)',
      'diagonal dinâmica com a pessoa em movimento e energia',
      'plano frontal forte, direto na pessoa',
      'plano médio poderoso da pessoa em destaque',
    ],
    lens: [
      'lente 85mm, pessoa-herói em foco cortante e fundo cremoso',
      'retrato publicitário aproximado, expressão irresistível',
      'grande-angular com perspectiva impactante sobre a pessoa',
      'lente 50mm nítida, pessoa no centro da atenção',
    ],
    light: [
      'iluminação dramática de estúdio, realces marcados',
      'contraluz forte com halo brilhante',
      'luz colorida de néon vibrante',
      'spot direcional intenso sobre o herói',
      'luz solar forte e saturada',
    ],
    time: ['estúdio sem hora definida', 'golden hour intensa', 'noite com luzes vibrantes'],
    composition: [
      'pessoa-herói centralizada e dominante, resto desfocado',
      'composição ousada com forte contraste de cor',
      'muito espaço para chamada, pessoa num canto de destaque',
      'camadas de profundidade puxando o olho pra pessoa',
    ],
    mood: [
      'clima aspiracional e desejável',
      'clima vibrante, energético e chamativo',
      'clima premium e sofisticado',
      'clima de oferta imperdível, animado',
    ],
  },
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Sorteia uma direção de arte combinatória para o modo pedido. */
function randomLook(mode) {
  const m = mode === 'promo' ? 'promo' : 'editorial'
  const ax = AXES[m]
  return {
    mode: m,
    angle: pick(ax.angle),
    lens: pick(ax.lens),
    light: pick(ax.light),
    time: pick(ax.time),
    composition: pick(ax.composition),
    mood: pick(ax.mood),
  }
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { postText = '', idea = '', format = 'square', clientId = '', mode = 'editorial' } =
      await readJson(req)
    const client = getClient(clientId)
    const rawText = String(postText || idea || '').trim()
    if (!rawText) {
      res.status(400).json({ error: 'Post vazio' })
      return
    }

    // 1) IA de texto sugere uma cena que faça sentido com o conteúdo do post,
    //    sorteando um "mundo visual" e uma direção de arte combinatória
    //    (modo editorial ou propaganda) diferentes a cada chamada.
    const look = randomLook(mode)
    const world = randomImageWorld(client)
    const { system, user } = imageIdeaPrompt(rawText, look, client, world)
    let sceneIdea = rawText
    try {
      const raw = await chat({ system, user, maxTokens: 200, temperature: 1.15 })
      const cleaned = String(raw || '')
        .trim()
        .replace(/^["“”']+|["“”']+$/g, '')
      if (cleaned) sceneIdea = cleaned
    } catch {
      // se a sugestão de cena falhar, seguimos com o texto do post cru
    }

    // 2) IA de imagem gera o fundo com base na cena sugerida, reforçando a
    //    mesma direção de arte (modo + eixos) diretamente no prompt final.
    const size = SIZES[format] || SIZES.square
    const dataUrl = await image({ prompt: imagePrompt(sceneIdea, client, look), size })
    res.status(200).json({ image: dataUrl, idea: sceneIdea, mode: look.mode })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}
