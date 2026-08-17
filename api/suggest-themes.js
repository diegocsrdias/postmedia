import { chat, extractJsonArray, preflight, readJson } from './_lib/openai.js'
import { getClient, isEditorial } from './_lib/clients.js'

// Sugere os "temas quentes" do input de tema — antes uma lista fixa e sem valor.
// Agora a IA propõe ~8 ganchos RELEVANTES para HOJE, cientes da data atual e do
// contexto da marca (sazonalidade, datas comerciais/comemorativas próximas,
// assuntos do momento). Cliente editorial (saúde) recebe temas de conscientização
// e de saúde mental, nunca newsjacking oportunista.
//
// Ressalva honesta: o modelo tem corte de conhecimento — são sugestões sazonais
// e relevantes, não um feed ao vivo de trending real.
export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    const { clientId, client } = await readJson(req)
    const c = getClient(clientId || client)
    const items = await suggest(c)
    res.status(200).json({ items })
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) })
  }
}

/** Data de hoje no fuso do Brasil, em partes legíveis para o prompt. */
function todayBR() {
  const tz = 'America/Sao_Paulo'
  const now = new Date()
  const full = now.toLocaleDateString('pt-BR', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const month = now.toLocaleDateString('pt-BR', { timeZone: tz, month: 'long' })
  const year = now.toLocaleDateString('pt-BR', { timeZone: tz, year: 'numeric' })
  return { full, month, year }
}

async function suggest(c) {
  const editorial = isEditorial(c)
  const { full, month, year } = todayBR()
  const positioning = (c.brief && c.brief.positioning) || ''

  const system = editorial
    ? 'Você é estrategista de conteúdo de ' +
      c.name +
      ' (' +
      c.business +
      '). Sugira temas de conteúdo relevantes para o momento — SEMPRE no registro sério de uma profissional de saúde. ' +
      'NADA de newsjacking oportunista nem apelo comercial: foque em datas de conscientização (ex.: Setembro Amarelo, Janeiro Branco), ' +
      'fases da vida e assuntos de saúde mental que combinem com a época do ano. ' +
      (positioning ? 'Posicionamento: ' + positioning + '. ' : '')
    : 'Você é estrategista de conteúdo da marca ' +
      c.name +
      ' (' +
      c.business +
      '). Sugira ganchos de conteúdo (newsjacking) realmente relevantes para o momento, ' +
      'amarráveis à marca de forma natural. ' +
      (positioning ? 'Posicionamento: ' + positioning + '. ' : '') +
      'Público: ' +
      c.audience +
      '. '

  const user =
    'Hoje é ' +
    full +
    '. Sugira EXATAMENTE 8 temas que façam sentido AGORA, considerando a época do ano (estamos em ' +
    month +
    ' de ' +
    year +
    '), datas comemorativas ou de conscientização PRÓXIMAS (não as que já passaram) e assuntos do momento. ' +
    'Varie: misture datas do calendário com temas perenes oportunos. Evite repetir sempre os mesmos. ' +
    'Cada item tem EXATAMENTE estes campos:\n' +
    '{ "label": "rótulo curtíssimo começando com 1 emoji (até ~22 caracteres)", ' +
    '"theme": "frase de 3 a 8 palavras descrevendo o tema para a IA criar o post" }\n\n' +
    'PT-BR. Responda SOMENTE com um array JSON válido, sem crases nem texto extra.'

  const txt = await chat({ system, user, maxTokens: 500, temperature: 0.85 })
  const arr = extractJsonArray(txt)
  return (arr || [])
    .filter((x) => x && x.label && x.theme)
    .slice(0, 8)
    .map((x) => ({ label: String(x.label).trim(), theme: String(x.theme).trim() }))
}
