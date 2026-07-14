// Prompts de IA (rodam no servidor). Mantêm o texto original do app.

export function adsPrompt(n, existingHeadlines) {
  const system =
    'Você é redator publicitário da marca "Controle DinDin", app brasileiro de controle financeiro pessoal com IA: scanner de notas fiscais (fotografa e a IA lança), metas com projeção automática, relatórios por categoria e recorrências. Oferta: 10 dias grátis sem cartão; Pro R$9,99/mês, Premium R$19,99/mês. Tom: propaganda criativa, bem-humorada e confiável. Mascote: porquinho.'
  const user =
    'Crie ' +
    n +
    ' conceitos de ANÚNCIO (estilo propaganda de app) diferentes entre si' +
    (existingHeadlines ? ' e diferentes destes já usados: ' + existingHeadlines : '') +
    '.\n\n' +
    'Cada conceito tem EXATAMENTE estes campos:\n' +
    '{ "f": { "badge": selo curto em MAIÚSCULAS (2-4 palavras), "headline": início da frase de impacto (até ~34 caracteres), "highlight": fecho da frase que ficará em destaque verde (1-3 palavras com ponto final), "sub": 1-2 frases vendendo um benefício concreto do app, "cta": texto do botão (2-4 palavras) }, "caption": "legenda 2-4 linhas com emoji e CTA pro link na bio", "hashtags": "5 hashtags com #ControleDinDin", "vcap": "frase curta pra tela do vídeo" }\n\n' +
    'headline+highlight devem formar UMA frase fluida. PT-BR. Responda SOMENTE com um array JSON válido, sem crases nem texto extra.'
  return { system, user }
}

export function themePrompt(n, theme) {
  const system =
    'Você é redator de social media da marca "Controle DinDin", um app brasileiro de controle financeiro pessoal com IA: scanner de notas fiscais, metas com projeção automática, relatórios e recorrências. Oferta: 10 dias grátis; planos Pro R$9,99/mês e Premium R$19,99/mês. Tom divertido, leve e confiável, com um mascote porquinho. Público: brasileiros que querem organizar as finanças.'
  const user =
    'Crie ' +
    n +
    ' criativos para redes sociais (Instagram, Facebook e TikTok) que conectam o TEMA EM ALTA "' +
    theme +
    '" ao Controle DinDin — newsjacking. Amarre o tema a uma mensagem de finanças de forma natural, criativa e bem-humorada.\n\n' +
    'Use APENAS estes layouts e EXATAMENTE estes campos:\n' +
    '- "statement": { "eyebrow": rótulo curto, "line1": frase de impacto (parte 1), "line2": fecho (parte 2) }\n' +
    '- "list": { "eyebrow": rótulo curto, "title": título, "item1", "item2", "item3" }\n' +
    '- "question": { "question": pergunta que puxa comentário }\n' +
    '- "feature": { "badge": curto em MAIÚSCULAS, "headline": título, "sub": 1 frase } (ligue a um recurso do app)\n' +
    '- "quote": { "quote": frase de efeito }\n' +
    '- "myth": { "myth": crença errada, "truth": correção }\n\n' +
    'Regras: varie os layouts entre os itens; textos MUITO curtos (line1/line2/headline/title até ~28 caracteres pra caber na tela); PT-BR; nada ofensivo.\n\n' +
    'Responda SOMENTE com um array JSON válido (sem texto antes ou depois, sem crases). Cada item:\n' +
    '{ "layout": "...", "f": { campos do layout escolhido }, "caption": "legenda de 2-3 linhas com emoji e chamada pra ação", "hashtags": "5 hashtags começando com # incluindo #ControleDinDin", "vcap": "texto curto pra aparecer na tela do vídeo" }'
  return { system, user }
}

/** Monta o prompt de imagem, ancorado na identidade visual da marca. */
export function imagePrompt(userIdea) {
  const brand =
    'Fundo/ilustração para post de rede social do app de finanças "Controle DinDin". ' +
    'Paleta da marca: azul-marinho profundo (#303078), verde-limão vibrante (#C0D830) e creme (#F6F2EA). ' +
    'Estilo: moderno, limpo, flat/vetorial com formas geométricas suaves, alto contraste, adequado para sobrepor texto. ' +
    'SEM TEXTO, sem letras, sem números, sem logotipos na imagem. Composição com bastante espaço negativo. '
  return brand + 'Tema/ideia: ' + String(userIdea || '').trim()
}
