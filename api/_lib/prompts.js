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
 *
 * `look` é um objeto de direcionamento sorteado (ver generate-image.js) com
 * eixos independentes (ângulo, lente, luz, hora, composição, clima). Passar os
 * eixos separadamente — em vez de uma única frase fixa — faz a IA divergir de
 * verdade a cada chamada, em vez de convergir sempre pra mesma "cena segura".
 */
export function imageIdeaPrompt(postText, look, client, world) {
  const promo = look && look.mode === 'promo'
  const system =
    'Você é diretor de arte da marca "' +
    client.name +
    '" (' +
    client.business +
    '). ' +
    (promo
      ? 'Sua função é sugerir, em UMA frase curta e concreta (até ~24 palavras), uma cena de PROPAGANDA visualmente chamativa e vendedora ' +
        'para servir de FOTO DE FUNDO de um anúncio, conectada ao assunto do texto abaixo. ' +
        'Pense em imagem de campanha publicitária: um herói/produto ou detalhe em destaque, cena aspiracional, energia e apelo comercial. '
      : 'Sua função é sugerir, em UMA frase curta e concreta (até ~22 palavras), uma cena real ' +
        'para servir de FOTO DE FUNDO de um post editorial, que se conecte com o assunto do texto abaixo. ') +
    'Parta deste universo visual como ponto de partida (adapte livremente): ' +
    (world || client.imageWorld) +
    '. ' +
    'Descreva objetos, cenário e clima da cena de forma bem específica e concreta (nada genérico). NÃO inclua texto/letras/logotipos na descrição. ' +
    'NÃO repita cenas óbvias sempre iguais — cada sugestão deve ser visualmente DIFERENTE das anteriores, variando ângulo, objetos, cenário e clima. ' +
    'Responda APENAS com a frase da cena, sem aspas, sem explicações.'
  const user =
    'Texto do post: "' +
    String(postText || '').trim() +
    '"\n' +
    (look
      ? 'Direcionamento para esta cena (respeite): ' + lookLine(look) + '.\n'
      : '') +
    'Sugira a cena de fundo agora.'
  return { system, user }
}

/** Traduz o objeto `look` sorteado numa frase legível pra IA. */
function lookLine(look) {
  return [look.angle, look.lens, look.light, look.time, look.composition, look.mood]
    .filter(Boolean)
    .join('; ')
}

/**
 * Monta o prompt de imagem, ancorado na identidade visual da marca.
 * `look.mode` alterna entre 'editorial' (foto natural e sóbria, padrão) e
 * 'promo' (imagem de propaganda: vibrante, saturada, composição de anúncio).
 */
export function imagePrompt(userIdea, client, look) {
  const promo = look && look.mode === 'promo'
  const base = promo
    ? 'Imagem de PROPAGANDA / campanha publicitária profissional para um anúncio da marca "' +
      client.name +
      '" (' +
      client.business +
      '). ' +
      'Deve parecer foto de campanha de agência: vibrante, saturada, com muito contraste e impacto visual imediato, ' +
      'um elemento herói em destaque, iluminação dramática e comercial, cores fortes e chamativas que puxam o olhar. ' +
      'Energia aspiracional e vendedora, cara de outdoor / anúncio de revista premium. '
    : 'Fotografia profissional e editorial para post de rede social da marca "' +
      client.name +
      '" (' +
      client.business +
      '). ' +
      'Cena elaborada e cheia de vida, com composição fotográfica de revista (regra dos terços, reflexos, profundidade), ' +
      'luz e clima naturais e sóbrios. '
  const craft =
    'NÃO faça ilustração flat, NÃO faça vetor, NÃO faça desenho geométrico simples — o resultado deve parecer uma FOTO REAL, ' +
    'batida com câmera profissional (lente boa, profundidade de campo, texturas e materiais reais e ricos em detalhe: ' +
    'madeira, tecido, papel, vidro, metal, pele, plantas, ambientes reais). '
  const direction = look ? 'Direção de arte OBRIGATÓRIA para esta imagem: ' + lookLine(look) + '. ' : ''
  const brandColor = promo
    ? 'Use com força as cores da marca — ' +
      client.palette +
      ' — como cores dominantes da cena (fundo, luz, objetos), de forma marcante e proposital. '
    : 'Aplique a identidade da marca de forma sutil e natural através da luz, reflexos, objetos de cena ou grade de cor — ' +
      'tons que lembrem ' +
      client.palette +
      ' — sem parecer um filtro artificial por cima. '
  const breathing =
    'Deixe uma área de respiro limpa e proposital (não precisa ser o centro) para sobrepor texto depois. '
  const unique =
    'IMPORTANTE: cada imagem deve ser visualmente ÚNICA e diferente das anteriores — varie ângulo, enquadramento, distância da câmera, hora do dia e disposição dos objetos; NÃO repita a mesma composição "segura" de plano geral com fundo desfocado. '
  const quality =
    'Altíssima resolução, riqueza de textura e realismo fotográfico. ' +
    "SEM texto, SEM letras, SEM números, SEM logotipos, SEM marcas d'água, SEM aparência de ilustração/cartoon/3D genérico. "
  return (
    base +
    craft +
    direction +
    brandColor +
    breathing +
    unique +
    quality +
    'Cena/ideia a retratar: ' +
    String(userIdea || '').trim()
  )
}
