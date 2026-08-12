// Geração de FUNDO por IA (foto), reutilizável pelo endpoint generate-image e
// pelo agendador (run-scheduler). Sorteia uma direção de arte combinatória
// (ângulo × lente × luz × hora × composição × clima) e um "mundo visual" do
// cliente, pede à IA de texto uma cena coerente com o post e então gera a imagem.

import { chat, image } from './openai.js'
import { imageIdeaPrompt, imagePrompt } from './prompts.js'
import { isEditorial, randomImageWorld } from './clients.js'

const SIZES = {
  square: '1024x1024',
  story: '1024x1536',
}

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

const PEOPLE_PROBABILITY = 0.7

const ETHNICITIES = [
  'pessoa parda',
  'pessoa branca',
  'pessoa negra',
  'pessoa asiática',
  'pessoa indígena',
  'pessoa de pele clara',
  'pessoa ruiva',
  'pessoa idosa de cabelos grisalhos',
]

/** Sorteia uma direção de arte combinatória para o modo pedido. */
export function randomLook(mode, client) {
  const m = mode === 'promo' && !isEditorial(client) ? 'promo' : 'editorial'
  const ax = AXES[m]
  const p = typeof client?.peopleProbability === 'number' ? client.peopleProbability : PEOPLE_PROBABILITY
  const withPeople = Math.random() < p
  return {
    mode: m,
    angle: pick(ax.angle),
    lens: pick(ax.lens),
    light: pick(ax.light),
    time: pick(ax.time),
    composition: pick(ax.composition),
    mood: pick(ax.mood),
    withPeople,
    ethnicity: withPeople ? pick(ETHNICITIES) : null,
  }
}

/**
 * Gera um fundo por IA para um post. Retorna { image (data URL), idea, mode }.
 * `format` é 'square' ou 'story'; `mode` é 'editorial' ou 'promo'.
 */
export async function generateBackground(client, { postText = '', format = 'square', mode = 'editorial' } = {}) {
  const rawText = String(postText || '').trim()
  if (!rawText) throw new Error('Post vazio')

  const look = randomLook(mode, client)
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
    /* segue com o texto do post cru */
  }

  const size = SIZES[format] || SIZES.square
  const dataUrl = await image({ prompt: imagePrompt(sceneIdea, client, look), size })
  return { image: dataUrl, idea: sceneIdea, mode: look.mode }
}
