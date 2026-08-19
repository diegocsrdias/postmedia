// Prompts de IA (rodam no servidor). Parametrizados por cliente (ver ./clients.js).

import { isEditorial } from './clients.js'
import { ANGLE_LABELS, LAYOUT_LABELS } from './labels.js'

/**
 * Bloco de DIREÇÃO POR DESEMPENHO, anexado aos prompts de geração. Traduz a
 * memória de aprendizado (ver api/build-learnings.js) em orientações concretas
 * para a IA priorizar o que vem funcionando nesta conta. Vazio quando ainda não
 * há aprendizado — aí a geração se comporta como antes.
 */
export function performanceGuidance(learnings) {
  if (!learnings) return ''
  const stats = learnings.stats || {}
  const topAngles = (stats.byAngle || []).slice(0, 3).map((r) => ANGLE_LABELS[r.key] || r.key)
  const topLayouts = (stats.byLayout || []).slice(0, 3).map((r) => LAYOUT_LABELS[r.key] || r.key)
  const parts = ['\n\nAPRENDIZADO DE DESEMPENHO DESTA CONTA (use para orientar as escolhas, sem repetir fórmula):']
  if (learnings.brief) parts.push('- Panorama: ' + learnings.brief)
  if (topAngles.length) parts.push('- Tende a performar melhor com estes ângulos: ' + topAngles.join(', ') + '.')
  if (topLayouts.length) parts.push('- E com estes layouts: ' + topLayouts.join(', ') + '. Favoreça-os quando fizer sentido para o conteúdo.')
  parts.push('- Não sacrifique a qualidade nem a variedade só para seguir isto: é um viés, não uma regra rígida.')
  return parts.join('\n')
}

/** Formata as regras de escrita específicas do cliente (se houver) pro system prompt. */
function guardrails(client) {
  const rules = client && client.writingRules
  if (!rules || !rules.length) return ''
  return '\n\nREGRAS OBRIGATÓRIAS DE ESCRITA (siga TODAS, sem exceção):\n' + rules.map((r) => '- ' + r).join('\n')
}

/**
 * "Playbook" da marca — as diretrizes estratégicas e de segurança comuns a TODA
 * geração de texto, preenchidas com o contexto de cada cliente (ver `client.brief`
 * em ./clients.js). É a camada genérica e adaptável da plataforma: a metodologia é
 * a mesma para todos (só afirmar o aprovado, nunca inventar dado, um CTA só, sem
 * promessa de resultado garantido), o conteúdo muda por cliente. Vazio quando o
 * cliente não define `brief` — aí o comportamento é o de antes (retrocompatível).
 */
function brandPlaybook(client) {
  const b = client && client.brief
  if (!b) return ''
  const L = []
  if (b.mission) L.push('MISSÃO: ' + b.mission + '.')
  if (b.positioning) L.push('POSICIONAMENTO: ' + b.positioning + '.')
  if (b.funnelDefault) {
    L.push(
      'FOCO DE FUNIL: ' +
        b.funnelDefault +
        '. Cada peça tem UM objetivo e UM CTA principal — nunca empilhe chamadas para ação.',
    )
  }
  if (b.approvedClaims && b.approvedClaims.length) {
    L.push(
      'FATOS APROVADOS (a ÚNICA fonte de números, preços, prazos, nomes de planos, funcionalidades e credenciais que você pode citar):\n' +
        b.approvedClaims.map((c) => '  • ' + c).join('\n'),
    )
  }
  if (b.safety && b.safety.length) {
    L.push('SEGURANÇA E ÉTICA (inegociável):\n' + b.safety.map((s) => '  • ' + s).join('\n'))
  }
  // Regra universal de integridade — vale para qualquer cliente, tenha ou não
  // approvedClaims. É o coração do playbook: sem invenção de fato.
  L.push(
    'INTEGRIDADE: nunca invente dado, estatística, depoimento, avaliação, cliente, funcionalidade, ' +
      'certificação, data ou resultado. Só use os FATOS APROVADOS acima; se um número ou detalhe não ' +
      'estiver lá, omita ou reformule sem ele. Nunca prometa resultado garantido nem transformação instantânea.',
  )
  return '\n\nDIRETRIZES DA MARCA (siga em toda peça):\n' + L.join('\n')
}

/**
 * Abertura do system prompt — é ela que define o "papel" que a IA assume, e
 * portanto o que mais pesa no resultado. Chamar a IA de "redator publicitário"
 * fazia todo o resto sair com cara de anúncio, mesmo com as regras de escrita
 * dizendo o contrário; para clientes editoriais ela escreve como o próprio
 * profissional.
 */
function persona(role, client) {
  if (isEditorial(client)) {
    return (
      'Você escreve o conteúdo de redes sociais de ' +
      client.name +
      ', ' +
      client.business +
      (client.credentials ? '. Formação: ' + client.credentials : '') +
      '. Você NÃO é publicitário: você é a voz da própria profissional, produzindo conteúdo educativo ' +
      'e de credibilidade para o público dela. O objetivo é informar bem e transmitir confiança — não vender.'
    )
  }
  // Quando o cliente define um papel próprio no brief (ex.: "Diretor de
  // Crescimento…"), ele substitui o rótulo genérico — enquadra a IA como a
  // estrategista da marca, não um redator qualquer.
  const briefRole = client && client.brief && client.brief.role
  if (briefRole) {
    return 'Você é ' + briefRole + ' — a marca "' + client.name + '", ' + client.business + '.'
  }
  return 'Você é ' + role + ' da marca "' + client.name + '", ' + client.business + '.'
}

// Regra de higiene de texto — a IA às vezes espaça as letras de uma palavra pra
// "dar ênfase" (P E R F E I Ç Ã O), o que quebra o card/vídeo. Vale pra todos.
const TEXT_HYGIENE =
  '\n\nFORMA DO TEXTO: escreva palavras inteiras e reais, sem erros de digitação. ' +
  'NUNCA separe as letras de uma palavra com espaços para dar ênfase (ex.: escreva "PERFEIÇÃO", jamais "P E R F E I Ç Ã O"). ' +
  'Não use espaçamento, caixa alta exagerada nem caracteres decorativos como recurso de destaque.'

/** Corpo comum do system prompt (oferta, tom, público, regras, playbook). */
function brandContext(client) {
  return (
    ' ' +
    client.offer +
    ' Tom: ' +
    client.tone +
    '. Público: ' +
    client.audience +
    '.' +
    guardrails(client) +
    brandPlaybook(client) +
    TEXT_HYGIENE
  )
}

export function adsPrompt(n, existingHeadlines, client, learnings) {
  const editorial = isEditorial(client)
  const system = persona('redator publicitário', client) + brandContext(client)
  // No modo editorial o layout "ad" continua existindo (é útil pra apresentar um
  // serviço), mas vira um cartaz institucional informativo — sem retórica de venda.
  const brief = editorial
    ? 'Crie ' +
      n +
      ' conceitos de CARTAZ INSTITUCIONAL diferentes entre si — cada um apresenta com sobriedade um serviço ou uma informação real sobre o atendimento' +
      (existingHeadlines ? ', e diferentes destes já usados: ' + existingHeadlines : '') +
      '. NÃO são anúncios: são peças informativas, no tom de um material de consultório.\n\n'
    : 'Crie ' +
      n +
      ' conceitos de ANÚNCIO (estilo propaganda) diferentes entre si' +
      (existingHeadlines ? ' e diferentes destes já usados: ' + existingHeadlines : '') +
      '.\n\n'
  const subSpec = editorial
    ? '"sub": 1-2 frases explicando o serviço com clareza e precisão (informativo, nunca vendedor)'
    : '"sub": 1-2 frases vendendo um benefício concreto'
  const headlineSpec = editorial
    ? '"headline": início de uma frase sóbria e clara (até ~34 caracteres), "highlight": fecho da frase que ficará em destaque (1-3 palavras com ponto final)'
    : '"headline": início da frase de impacto (até ~34 caracteres), "highlight": fecho da frase que ficará em destaque (1-3 palavras com ponto final)'
  const user =
    brief +
    'Cada conceito tem EXATAMENTE estes campos:\n' +
    '{ "f": { "badge": selo curto em MAIÚSCULAS (2-4 palavras), ' +
    headlineSpec +
    ', ' +
    subSpec +
    ', "cta": texto do botão (2-4 palavras, sobre ' +
    client.ctaWord +
    ') }, "caption": "legenda 2-4 linhas (emoji só se combinar com o tom da marca) e CTA pro link na bio", "hashtags": "5 hashtags incluindo ' +
    client.hashtag +
    '", "vcap": "frase curta pra tela do vídeo" }\n\n' +
    'headline+highlight devem formar UMA frase fluida. PT-BR. Responda SOMENTE com um array JSON válido, sem crases nem texto extra.' +
    performanceGuidance(learnings)
  return { system, user }
}

/** System prompt base (identidade da marca) — compartilhado entre os geradores de texto. */
function brandSystem(role, client) {
  return persona(role, client) + brandContext(client)
}

/**
 * Contrato de layouts+campos, idêntico ao que o front espera (ver EDIT_FIELDS).
 * Fica num só lugar pra themePrompt e mixPrompt não divergirem.
 * O modo editorial reinterpreta os mesmos layouts com intenção informativa —
 * "frase de impacto" e "pergunta que puxa comentário" são briefings de
 * engajamento, e puxavam o texto pro raso.
 */
function layoutContract(client) {
  if (isEditorial(client)) {
    return (
      'Use APENAS estes layouts e EXATAMENTE estes campos:\n' +
      '- "statement": { "eyebrow": rótulo curto, "line1": afirmação sóbria e precisa (parte 1), "line2": fecho (parte 2) }\n' +
      '- "list": { "eyebrow": rótulo curto, "title": título informativo, "item1", "item2", "item3" } (itens concretos e úteis, nunca dicas genéricas)\n' +
      '- "question": { "question": pergunta reflexiva e específica, que convide a pensar }\n' +
      '- "feature": { "badge": curto em MAIÚSCULAS, "headline": título, "sub": 1 frase } (apresente um serviço real com clareza)\n' +
      '- "quote": { "quote": reflexão autoral com densidade — nunca frase motivacional de rede social }\n' +
      '- "myth": { "myth": mal-entendido comum e específico, "truth": esclarecimento tecnicamente correto }\n\n'
    )
  }
  return (
    'Use APENAS estes layouts e EXATAMENTE estes campos:\n' +
    '- "statement": { "eyebrow": rótulo curto, "line1": frase de impacto (parte 1), "line2": fecho (parte 2) }\n' +
    '- "list": { "eyebrow": rótulo curto, "title": título, "item1", "item2", "item3" }\n' +
    '- "question": { "question": pergunta que puxa comentário }\n' +
    '- "feature": { "badge": curto em MAIÚSCULAS, "headline": título, "sub": 1 frase } (ligue a um serviço/recurso da marca)\n' +
    '- "quote": { "quote": frase de efeito }\n' +
    '- "myth": { "myth": crença errada, "truth": correção }\n\n'
  )
}

/** Formato de saída (JSON), compartilhado. */
function outputContract(client) {
  const caption = isEditorial(client)
    ? '"caption": "legenda de 2-4 linhas que desenvolva a ideia do post com substância (emoji só se combinar com o tom), fechando com um convite discreto (' +
      client.ctaWord +
      ')"'
    : '"caption": "legenda de 2-3 linhas (emoji só se combinar com o tom da marca) e chamada pra ação (' +
      client.ctaWord +
      ')"'
  return (
    'Responda SOMENTE com um array JSON válido (sem texto antes ou depois, sem crases). Cada item:\n' +
    '{ "layout": "...", "f": { campos do layout escolhido }, ' +
    caption +
    ', "hashtags": "5 hashtags começando com # incluindo ' +
    client.hashtag +
    '", "vcap": "texto curto pra aparecer na tela do vídeo" }'
  )
}

export function themePrompt(n, theme, client, learnings) {
  const editorial = isEditorial(client)
  const system = brandSystem('redator de social media', client)
  // Newsjacking (surfar tema em alta pra vender) é impróprio pra saúde mental:
  // datas como Setembro Amarelo pedem conteúdo informativo, não oportunismo.
  const brief = editorial
    ? 'Crie ' +
      n +
      ' publicações para redes sociais (Instagram, Facebook e TikTok) sobre o tema "' +
      theme +
      '". Trate o tema com seriedade e propriedade técnica, do ponto de vista da psicologia. ' +
      'NÃO use o tema como gancho de divulgação: o objetivo é contribuir com informação de qualidade sobre ele. ' +
      'A ligação com o trabalho dela deve ser discreta e surgir naturalmente, se surgir.\n\n'
    : 'Crie ' +
      n +
      ' criativos para redes sociais (Instagram, Facebook e TikTok) que conectam o TEMA EM ALTA "' +
      theme +
      '" à marca — newsjacking. Amarre o tema à mensagem da marca de forma natural, criativa e coerente com o tom.\n\n'
  const user =
    brief +
    layoutContract(client) +
    'Regras: varie os layouts entre os itens; textos MUITO curtos (line1/line2/headline/title até ~28 caracteres pra caber na tela); PT-BR; nada ofensivo.\n\n' +
    outputContract(client) +
    performanceGuidance(learnings)
  return { system, user }
}

/**
 * Gera criativos "do dia" SEM tema fixo (o botão principal e o "Trocar").
 * Recebe `directions` — direcionamentos criativos sorteados no servidor
 * (ver generate-mix.js) — pra que cada chamada explore ângulos/ganchos
 * diferentes em vez de convergir sempre no mesmo estilo de texto.
 */
export function mixPrompt(n, client, directions, avoid, learnings) {
  const editorial = isEditorial(client)
  const system = brandSystem('redator de social media', client)
  const dir = directions && directions.length ? directions.join('; ') : ''
  const opening = editorial
    ? 'Crie EXATAMENTE ' +
      n +
      ' publicações ORIGINAIS e diferentes entre si para redes sociais (Instagram, Facebook e TikTok) — ' +
      'o array de resposta DEVE ter ' +
      n +
      ' itens, nem mais nem menos. ' +
      'Cada uma trata de um assunto próprio dentro da psicologia, com informação de verdade. ' +
      'Pense no que uma profissional experiente teria a dizer de relevante — não no que "converteria".\n'
    : 'Crie EXATAMENTE ' +
      n +
      ' criativos ORIGINAIS e diferentes entre si para redes sociais (Instagram, Facebook e TikTok) da marca — ' +
      'o array de resposta DEVE ter ' +
      n +
      ' itens, nem mais nem menos. ' +
      'Cada um explora um ângulo próprio do negócio (benefício, dor do público, curiosidade, bastidor, prova, objeção). '
  const rules = editorial
    ? 'Regras: VARIE bastante os layouts e a abertura de cada texto (não comece todos igual); ' +
      'soe humano e natural, nunca fórmula de IA nem frase de rede social; ' +
      'textos MUITO curtos (line1/line2/headline/title até ~28 caracteres pra caber na tela); PT-BR; nada ofensivo.\n\n'
    : 'Regras: VARIE bastante os layouts e a abertura de cada texto (não comece todos igual); ' +
      'soe humano e espontâneo, nunca fórmula de IA; textos MUITO curtos (line1/line2/headline/title até ~28 caracteres pra caber na tela); PT-BR; nada ofensivo.\n\n'
  const user =
    opening +
    (dir ? 'Direcionamentos para ESTA leva (use como inspiração, um por item quando fizer sentido): ' + dir + '.\n' : '\n') +
    (avoid ? 'NÃO repita nem parafraseie estes textos já usados: ' + avoid + '.\n' : '') +
    '\n' +
    layoutContract(client) +
    rules +
    outputContract(client) +
    performanceGuidance(learnings) +
    '\n\nLembrete final: o array deve conter ' +
    n +
    ' objetos.'
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
  const editorial = isEditorial(client)
  // Mesma regra do imagePrompt: cliente editorial nunca entra no modo promo.
  const promo = !editorial && look && look.mode === 'promo'
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
    (editorial ? editorialSceneRules() : '') +
    'Parta deste universo visual como ponto de partida (adapte livremente): ' +
    (world || client.imageWorld) +
    '. ' +
    peopleClauseIdea(look) +
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

/**
 * Regras de cena para clientes editoriais (serviço de saúde).
 * Duas preocupações: credibilidade (nada de stock photo emotiva, que é o que
 * faz uma página de psicóloga parecer propaganda barata) e ética — encenar
 * atendimento sugere retratar paciente real, o que o CFP não admite.
 */
function editorialSceneRules() {
  return (
    'A imagem precisa transmitir CREDIBILIDADE e serenidade profissional. ' +
    'NÃO encene atendimento clínico nem simule paciente em sessão (terapeuta ouvindo alguém sofrendo, prancheta, divã). ' +
    'NÃO use clichê de banco de imagens emotivo: cabeça entre as mãos, silhueta triste na janela, mão no ombro consolando, ' +
    'quebra-cabeça de cérebro, pessoa pulando feliz ao nascer do sol. ' +
    'Prefira cenas sóbrias e cotidianas — ambientes calmos e reais, luz natural, objetos comuns, gestos discretos — ' +
    'que sugiram cuidado e reflexão sem dramatizar sofrimento. '
  )
}

/** Traduz o objeto `look` sorteado numa frase legível pra IA. */
function lookLine(look) {
  return [look.angle, look.lens, look.light, look.time, look.composition, look.mood]
    .filter(Boolean)
    .join('; ')
}

/**
 * Cláusula de PESSOAS para o prompt de IDEIA de cena.
 * Nem toda cena tem gente (look.withPeople), e quando tem, a etnia vem
 * sorteada por imagem (look.ethnicity) para evitar viés/repetição.
 */
function peopleClauseIdea(look) {
  if (!look || !look.withPeople) {
    return 'Esta cena NÃO deve ter pessoas — foque no ambiente, objetos e clima, sem figuras humanas. '
  }
  const who = look.ethnicity || 'pessoa'
  return (
    'A cena deve ter pessoas como elemento principal. Inclua ao menos ' +
    who +
    ' (idade e contexto à sua escolha), interagindo naturalmente com o cenário. ' +
    'Descreva quem são e o que fazem (gesto, expressão, ação concreta). '
  )
}

/**
 * Cláusula de PESSOAS para o prompt de IMAGEM final. Espelha look.withPeople /
 * look.ethnicity, com a etnia como âncora concreta (a IA ignora "varie etnia"
 * genérico em geração isolada e converge sempre pro mesmo estereótipo).
 */
function peopleClauseImage(look, promo, editorial) {
  if (!look || !look.withPeople) {
    return 'Esta imagem NÃO deve conter pessoas nem figuras humanas — só ambiente, objetos, materiais e luz. '
  }
  const who = look.ethnicity || 'uma pessoa'
  if (promo) {
    return (
      'A imagem deve ter pessoas como protagonistas — inclua ' +
      who +
      ' fotografada como modelo de campanha publicitária, expressão marcante e aspiracional, interagindo com a cena. '
    )
  }
  if (editorial) {
    return (
      'A imagem deve ter pessoas como elemento principal — inclua ' +
      who +
      ', em um momento cotidiano comum, com expressão serena e contida (nem sorriso de propaganda, nem sofrimento encenado). ' +
      'Gente real, não modelo posando. '
    )
  }
  return (
    'A imagem deve ter pessoas como elemento principal — inclua ' +
    who +
    ', gente de verdade vivendo a cena com naturalidade (gesto, expressão e ação autênticos, nada posado demais). '
  )
}

/**
 * Monta o prompt de imagem, ancorado na identidade visual da marca.
 * `look.mode` alterna entre 'editorial' (foto natural e sóbria, padrão) e
 * 'promo' (imagem de propaganda: vibrante, saturada, composição de anúncio).
 */
export function imagePrompt(userIdea, client, look) {
  const editorial = isEditorial(client)
  // A voz do cliente tem a última palavra: um cliente editorial nunca gera
  // imagem de propaganda, mesmo que o chamador peça mode='promo'.
  const promo = !editorial && look && look.mode === 'promo'
  const base = promo
    ? 'Imagem de PROPAGANDA / campanha publicitária profissional para um anúncio da marca "' +
      client.name +
      '" (' +
      client.business +
      '). ' +
      'Deve parecer foto de campanha de agência: vibrante, saturada, com muito contraste e impacto visual imediato, ' +
      'um elemento herói em destaque, iluminação dramática e comercial, cores fortes e chamativas que puxam o olhar. ' +
      'Energia aspiracional e vendedora, cara de outdoor / anúncio de revista premium. '
    : editorial
      ? 'Fotografia editorial sóbria para o post de rede social de ' +
        client.name +
        ' (' +
        client.business +
        '). ' +
        'Deve parecer foto de matéria de revista séria — natural, discreta e verdadeira, jamais foto de banco de imagens ' +
        'nem imagem publicitária. Composição fotográfica cuidada (regra dos terços, profundidade), luz natural, ' +
        'paleta contida. Transmita calma, competência e confiança, nunca apelo comercial. '
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
  const people = peopleClauseImage(look, promo, editorial)
  const sceneRules = editorial ? editorialSceneRules() : ''
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
  const withPeople = look && look.withPeople
  const quality =
    'Altíssima resolução, riqueza de textura e realismo fotográfico' +
    (withPeople ? '; rostos e mãos das pessoas anatomicamente corretos e naturais, sem deformações' : '') +
    '. ' +
    "SEM texto, SEM letras, SEM números, SEM logotipos, SEM marcas d'água, SEM aparência de ilustração/cartoon/3D genérico. "
  return (
    base +
    craft +
    people +
    sceneRules +
    direction +
    brandColor +
    breathing +
    unique +
    quality +
    'Cena/ideia a retratar: ' +
    String(userIdea || '').trim()
  )
}
