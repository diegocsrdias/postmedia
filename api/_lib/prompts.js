// Prompts de IA (rodam no servidor). Parametrizados por cliente (ver ./clients.js).

/** Formata as regras de escrita específicas do cliente (se houver) pro system prompt. */
function guardrails(client) {
  const rules = client && client.writingRules
  if (!rules || !rules.length) return ''
  return '\n\nREGRAS OBRIGATÓRIAS DE ESCRITA (siga TODAS, sem exceção):\n' + rules.map((r) => '- ' + r).join('\n')
}

export function adsPrompt(n, existingHeadlines, client) {
  const system =
    'Você é redator publicitário da marca "' +
    client.name +
    '", ' +
    client.business +
    '. ' +
    client.offer +
    ' Tom: ' +
    client.tone +
    '. Público: ' +
    client.audience +
    '.' +
    guardrails(client)
  const user =
    'Crie ' +
    n +
    ' conceitos de ANÚNCIO (estilo propaganda) diferentes entre si' +
    (existingHeadlines ? ' e diferentes destes já usados: ' + existingHeadlines : '') +
    '.\n\n' +
    'Cada conceito tem EXATAMENTE estes campos:\n' +
    '{ "f": { "badge": selo curto em MAIÚSCULAS (2-4 palavras), "headline": início da frase de impacto (até ~34 caracteres), "highlight": fecho da frase que ficará em destaque (1-3 palavras com ponto final), "sub": 1-2 frases vendendo um benefício concreto, "cta": texto do botão (2-4 palavras, sobre ' +
    client.ctaWord +
    ') }, "caption": "legenda 2-4 linhas (emoji só se combinar com o tom da marca) e CTA pro link na bio", "hashtags": "5 hashtags incluindo ' +
    client.hashtag +
    '", "vcap": "frase curta pra tela do vídeo" }\n\n' +
    'headline+highlight devem formar UMA frase fluida. PT-BR. Responda SOMENTE com um array JSON válido, sem crases nem texto extra.'
  return { system, user }
}

export function themePrompt(n, theme, client) {
  const system =
    'Você é redator de social media da marca "' +
    client.name +
    '", ' +
    client.business +
    '. ' +
    client.offer +
    ' Tom ' +
    client.tone +
    '. Público: ' +
    client.audience +
    '.' +
    guardrails(client)
  const user =
    'Crie ' +
    n +
    ' criativos para redes sociais (Instagram, Facebook e TikTok) que conectam o TEMA EM ALTA "' +
    theme +
    '" à marca — newsjacking. Amarre o tema à mensagem da marca de forma natural, criativa e coerente com o tom.\n\n' +
    'Use APENAS estes layouts e EXATAMENTE estes campos:\n' +
    '- "statement": { "eyebrow": rótulo curto, "line1": frase de impacto (parte 1), "line2": fecho (parte 2) }\n' +
    '- "list": { "eyebrow": rótulo curto, "title": título, "item1", "item2", "item3" }\n' +
    '- "question": { "question": pergunta que puxa comentário }\n' +
    '- "feature": { "badge": curto em MAIÚSCULAS, "headline": título, "sub": 1 frase } (ligue a um serviço/recurso da marca)\n' +
    '- "quote": { "quote": frase de efeito }\n' +
    '- "myth": { "myth": crença errada, "truth": correção }\n\n' +
    'Regras: varie os layouts entre os itens; textos MUITO curtos (line1/line2/headline/title até ~28 caracteres pra caber na tela); PT-BR; nada ofensivo.\n\n' +
    'Responda SOMENTE com um array JSON válido (sem texto antes ou depois, sem crases). Cada item:\n' +
    '{ "layout": "...", "f": { campos do layout escolhido }, "caption": "legenda de 2-3 linhas (emoji só se combinar com o tom da marca) e chamada pra ação (' +
    client.ctaWord +
    ')", "hashtags": "5 hashtags começando com # incluindo ' +
    client.hashtag +
    '", "vcap": "texto curto pra aparecer na tela do vídeo" }'
  return { system, user }
}

/**
 * Pede à IA de texto para bolar uma ideia curta de CENA (fundo fotográfico)
 * que faça sentido com o conteúdo do post — usado antes de gerar a imagem,
 * pra cada geração sair diferente e conectada ao texto do criativo.
 */
export function imageIdeaPrompt(postText, styleHint, client) {
  const system =
    'Você é diretor de arte da marca "' +
    client.name +
    '" (' +
    client.business +
    '). ' +
    'Sua função é sugerir, em UMA frase curta e concreta (até ~22 palavras), uma cena real ' +
    'para servir de FOTO DE FUNDO de um post, que se conecte com o assunto do texto abaixo, ' +
    'dentro do universo visual: ' +
    client.imageWorld +
    '. ' +
    'Descreva objetos, cenário e clima da cena. NÃO inclua texto/letras/logotipos na descrição. ' +
    'NÃO repita cenas óbvias sempre iguais — varie o ângulo e o cenário a cada pedido. ' +
    'Responda APENAS com a frase da cena, sem aspas, sem explicações.'
  const user =
    'Texto do post: "' +
    String(postText || '').trim() +
    '"\n' +
    (styleHint ? 'Direcionamento de estilo para esta cena: ' + styleHint + '.\n' : '') +
    'Sugira a cena de fundo agora.'
  return { system, user }
}

/** Monta o prompt de imagem, ancorado na identidade visual da marca. */
export function imagePrompt(userIdea, client) {
  const brand =
    'Fotografia profissional e editorial para post de rede social da marca "' +
    client.name +
    '" (' +
    client.business +
    '). ' +
    'NÃO faça ilustração flat, NÃO faça vetor, NÃO faça desenho geométrico simples — o resultado deve parecer uma foto real, ' +
    'batida com câmera profissional (lente boa, profundidade de campo, luz e sombra naturais, texturas e materiais reais e ricos em detalhe: ' +
    'madeira, tecido, papel, vidro, metal, pele, plantas, ambientes reais). ' +
    'Cena elaborada e cheia de vida, com composição fotográfica de revista (regra dos terços, luz direcional, reflexos, profundidade), ' +
    'dentro do universo visual da marca: ' +
    client.imageWorld +
    '. ' +
    'Aplique a identidade da marca de forma sutil e natural através da luz, reflexos, objetos de cena ou grade de cor — ' +
    'tons que lembrem ' +
    client.palette +
    ' — sem parecer um filtro artificial por cima. ' +
    'Deixe uma área de respiro (ex.: parede lisa, céu, mesa vazia, fundo desfocado) livre de elementos para permitir sobrepor texto depois. ' +
    'Altíssima resolução, riqueza de textura e realismo fotográfico. ' +
    "SEM texto, SEM letras, SEM números, SEM logotipos, SEM marcas d'água, SEM aparência de ilustração/cartoon/3D genérico. "
  return brand + 'Cena/ideia a retratar: ' + String(userIdea || '').trim()
}
