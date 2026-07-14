import type { Concept, Angle, Layout, Strategy } from '../types'

/**
 * Banco de conceitos prontos (funciona 100% offline, sem IA).
 * Cada item já traz legenda e hashtags.
 */
export const BANK: Concept[] = [
  // ---- AD (propaganda elaborada) ----
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'NOVO NO BRASIL',
      headline: 'O app que faz seu dinheiro',
      highlight: 'render respeito.',
      sub: 'Fotografe a nota, a IA lança sozinha. Metas com data, relatórios claros e zero planilha.',
      cta: 'Quero testar grátis',
    },
    caption:
      'Chegou o jeito mais fácil de organizar sua grana. 🐷✨\n\n📸 Escaneou a nota → a IA lançou.\n🎯 Definiu a meta → o app calcula quanto guardar.\n📊 Fim do mês sem susto.\n\nTeste 10 dias grátis, sem cartão. Link na bio!',
    hashtags:
      '#appdefinancas #controlefinanceiro #inteligenciaartificial #organizacaofinanceira #ControleDinDin',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'CHEGA DE PLANILHA',
      headline: 'Sua planilha pediu',
      highlight: 'demissão.',
      sub: 'Scanner com IA lança seus gastos em 3 segundos. Você só confirma e vive sua vida.',
      cta: 'Aposentar a planilha',
    },
    caption:
      'Ela serviu bem, mas chegou a hora. 📋👋\n\nFotografou o cupom → a IA lançou valor, data e categoria. Zero digitação, zero fórmula quebrada.\n\n🐷 Teste 10 dias grátis, sem cartão. Link na bio!',
    hashtags:
      '#chegadeplanilha #appdefinancas #inteligenciaartificial #controledegastos #ControleDinDin',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'FIM DO MÊS SEM SUSTO',
      headline: 'Descubra pra onde seu dinheiro',
      highlight: 'foge.',
      sub: 'Relatórios por categoria mostram cada vazamento. Metas com data mostram o caminho de volta.',
      cta: 'Ver meu dinheiro',
    },
    caption:
      'Ele não some — ele foge pra lugares que você não olha. 🕵️💸\n\nCom relatórios claros por categoria, você fecha os vazamentos e transforma sobra em meta.\n\n🐷 Controle DinDin, 10 dias grátis. Link na bio!',
    hashtags:
      '#findomes #controlefinanceiro #relatoriofinanceiro #metasfinanceiras #ControleDinDin',
  },

  // ---- STATEMENT (dicas de impacto) ----
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Dica do dia', line1: 'Não é quanto', line2: 'você guarda.' },
    caption:
      'A conta que ninguém te ensinou: não importa quanto entra, importa quanto sobra. 💸\n\nComeça anotando cada gasto por 7 dias — você vai se assustar (no bom sentido).\n\n🐷 Teste 10 dias grátis no Controle DinDin. Link na bio.',
    hashtags:
      '#financaspessoais #educacaofinanceira #controlefinanceiro #dinheiro #ControleDinDin',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Dica do dia', line1: 'Anote hoje.', line2: 'Agradeça amanhã.' },
    caption:
      'O gasto que você não anota é o que te surpreende no fim do mês. 📅\n\nLançar leva 3 segundos. Fingir que não gastou custa caro.\n\n🐷 Comece grátis no Controle DinDin.',
    hashtags:
      '#controledegastos #organizacaofinanceira #vidafinanceira #dinheiro #ControleDinDin',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Verdade financeira', line1: 'Todo real', line2: 'tem um destino.' },
    caption:
      'Dinheiro sem destino vira boleto surpresa. Dê um nome pra cada real antes do mês começar. 🎯\n\n🐷 Planeje no Controle DinDin — 10 dias grátis.',
    hashtags:
      '#planejamentofinanceiro #metasfinanceiras #liberdadefinanceira #ControleDinDin',
  },

  // ---- LIST (dicas numeradas) ----
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Salve este post',
      title: '3 hábitos de quem vive no azul',
      item1: 'Anote todo gasto no mesmo dia',
      item2: 'Separe a meta antes das compras',
      item3: 'Revise as assinaturas todo mês',
    },
    caption:
      'Salva aí pra não esquecer 👇\n\n3 hábitos simples que separam quem fecha o mês no azul de quem vive no vermelho.\n\nQual desses você já faz? Comenta! 🐷',
    hashtags:
      '#educacaofinanceira #habitosfinanceiros #controlefinanceiro #dinheiro #ControleDinDin',
  },
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Comece hoje',
      title: 'Organize sua grana em 3 passos',
      item1: 'Escaneie uma nota com a IA',
      item2: 'Defina 1 meta com prazo',
      item3: 'Acompanhe o saldo todo dia',
    },
    caption:
      'Organizar as finanças parece complicado — mas cabe em 3 passos. 🚀\n\nComeça pelo passo 1 hoje mesmo.\n\n🐷 Controle DinDin, 10 dias grátis. Link na bio.',
    hashtags:
      '#organizarasfinancas #appdefinancas #planejamentofinanceiro #ControleDinDin',
  },

  // ---- QUESTION (engajamento) ----
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Quanto você gastou em delivery esse mês? 👀' },
    caption:
      'Sejamos honestos… 🍔📱\n\nComenta o valor aproximado — sem julgamento! Só de escrever você já toma consciência.\n\n🐷 No Controle DinDin você vê isso por categoria em segundos.',
    hashtags:
      '#financaspessoais #delivery #controledegastos #dinheiro #ControleDinDin',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Você sabe quanto sobra no fim do mês?' },
    caption:
      'Responde rápido, sem abrir o app do banco 👇\n\nSe você travou pra responder, esse é o sinal. 😅\n\n🐷 Controle DinDin te mostra o saldo real em tempo real.',
    hashtags:
      '#educacaofinanceira #saldo #vidafinanceira #controlefinanceiro #ControleDinDin',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Qual assinatura você esqueceu de cancelar? 👇' },
    caption:
      'Todo mundo tem uma. 📺💸\n\nComenta qual é a sua — vamos descobrir quem tem a lista mais longa!\n\n🐷 Controle DinDin acompanha suas recorrências pra você não pagar por bobeira.',
    hashtags:
      '#assinaturas #controledegastos #economizar #dinheiro #ControleDinDin',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Time planilha ou time app? Comenta aí.' },
    caption:
      'A eterna briga. 🥊\n\nPlanilha dá trabalho, mas dá controle. App dá agilidade. Onde você está?\n\n🐷 No Controle DinDin você tem os dois mundos — com scanner de IA.',
    hashtags:
      '#planilha #appdefinancas #organizacaofinanceira #ControleDinDin',
  },

  // ---- FEATURE (recursos) ----
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'SCANNER COM IA',
      headline: 'Fotografou. Lançou.',
      sub: 'A IA lê o cupom fiscal e preenche valor, data e categoria sozinha. Você só confirma.',
    },
    caption:
      'Chega de digitar gasto por gasto. 📸🤖\n\nVocê fotografa o cupom e a inteligência artificial faz o resto em segundos.\n\n🐷 Testa grátis por 10 dias no Controle DinDin.',
    hashtags:
      '#inteligenciaartificial #appdefinancas #scannerdenotas #controlefinanceiro #ControleDinDin',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'METAS COM PROJEÇÃO',
      headline: 'Sua meta com data certa.',
      sub: 'O app calcula quanto guardar por mês pra você chegar no prazo — e avisa se sair da rota.',
    },
    caption:
      'Sonho sem plano é só desejo. ✈️💰\n\nDefina a meta e o Controle DinDin projeta quanto guardar por mês pra chegar lá.\n\n🐷 Comece grátis. Link na bio.',
    hashtags:
      '#metasfinanceiras #planejamentofinanceiro #liberdadefinanceira #ControleDinDin',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'RELATÓRIOS',
      headline: 'Pra onde foi seu dinheiro?',
      sub: 'Veja tudo por categoria, com gráficos claros, em poucos segundos.',
    },
    caption:
      'A pergunta que assombra todo fim de mês. 📊\n\nCom relatórios por categoria, você finalmente enxerga onde o dinheiro escorre.\n\n🐷 Controle DinDin — 10 dias grátis.',
    hashtags:
      '#relatoriofinanceiro #controledegastos #educacaofinanceira #ControleDinDin',
  },

  // ---- QUOTE (frases) ----
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Liberdade financeira começa com uma anotação simples.' },
    caption:
      'O primeiro passo é sempre o menor. ✍️\n\nAnote o gasto de hoje. Amanhã, você anota de novo. É assim que se constrói controle.\n\n🐷 Controle DinDin. Link na bio.',
    hashtags:
      '#liberdadefinanceira #motivacaofinanceira #educacaofinanceira #ControleDinDin',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Quem controla o pouco, comanda o muito.' },
    caption:
      'Não espere sobrar pra começar a cuidar. 💪\n\nControle sobre R$ 50 hoje vira controle sobre R$ 5.000 amanhã.\n\n🐷 Comece grátis no Controle DinDin.',
    hashtags:
      '#mentalidadefinanceira #dinheiro #vidafinanceira #ControleDinDin',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Dinheiro guardado é escolha feita com calma, não com pressa.' },
    caption:
      'Poupar não é sobre cortar tudo — é sobre escolher melhor. 🧘\n\n🐷 Deixe o Controle DinDin cuidar das contas pra você decidir com calma.',
    hashtags:
      '#pouparfinanceiro #consumoconsciente #financaspessoais #ControleDinDin',
  },

  // ---- MYTH (mitos vs verdades) ----
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Preciso ganhar mais pra começar a poupar.',
      truth: 'Dá pra começar com o que sobra hoje — nem que sejam R$ 20 por semana.',
    },
    caption:
      'O maior mito das finanças. 🚫\n\nQuem espera "ganhar mais" nunca começa. Quem começa pequeno, cresce.\n\n🐷 Controle DinDin te ajuda a enxergar o que já dá pra guardar.',
    hashtags:
      '#mitosfinanceiros #educacaofinanceira #pouparfinanceiro #ControleDinDin',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Controlar gasto é chato e toma tempo.',
      truth: 'Com scanner de IA, um lançamento leva 3 segundos. Sério.',
    },
    caption:
      'Se você acha que controlar gasto dá trabalho… é porque ainda não usou IA. 🤖\n\n🐷 Fotografa o cupom, a IA lança. Testa grátis no Controle DinDin.',
    hashtags:
      '#inteligenciaartificial #controledegastos #appdefinancas #ControleDinDin',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Cartão de crédito é o vilão.',
      truth: 'O vilão é não acompanhar a fatura. Cartão organizado é aliado.',
    },
    caption:
      'Calma com o coitado do cartão. 💳\n\nO problema nunca foi o crédito — foi a falta de acompanhamento.\n\n🐷 Controle DinDin te mostra a fatura antes dela te surpreender.',
    hashtags:
      '#cartaodecredito #educacaofinanceira #controlefinanceiro #ControleDinDin',
  },

  // ---- ANTI-BET (posicionamento da marca) ----
  {
    layout: 'statement',
    angle: 'antibet',
    f: {
      eyebrow: 'A conta que não fecha',
      line1: 'A casa sempre',
      line2: 'ganha. Você não.',
    },
    caption:
      'A matemática da aposta é simples: ela foi feita pra você perder no longo prazo. 🎰❌\n\nCada real na bet é um real que não vira meta, reserva ou sossego.\n\n🐷 Aposte no seu futuro. Comece grátis no Controle DinDin.',
    hashtags:
      '#chegadeaposta #antibet #vidafinanceira #educacaofinanceira #ControleDinDin',
  },
  {
    layout: 'statement',
    angle: 'antibet',
    f: {
      eyebrow: 'Vire o jogo',
      line1: 'Aposte no seu',
      line2: 'futuro, não na sorte.',
    },
    caption:
      'A sorte é o marketing de quem lucra com a sua falência. 🃏\n\nO mesmo dinheiro que some na bet pode virar uma meta real, com data pra acontecer.\n\n🐷 Controle DinDin — 10 dias grátis.',
    hashtags:
      '#antibet #pareagora #metasfinanceiras #liberdadefinanceira #ControleDinDin',
  },
  {
    layout: 'quote',
    angle: 'antibet',
    f: { quote: 'O único lugar onde seu dinheiro sempre perde é na aposta.' },
    caption:
      'Não existe "método", não existe "dia de sorte". Existe estatística — e ela não está do seu lado. 📉\n\n🐷 Coloque seu dinheiro onde ele cresce, não onde ele some. Controle DinDin.',
    hashtags:
      '#antibet #chegadeaposta #conscienciafinanceira #dinheiro #ControleDinDin',
  },
  {
    layout: 'myth',
    angle: 'antibet',
    f: {
      myth: 'Só mais uma aposta e recupero tudo.',
      truth: 'É exatamente assim que a dívida começa — e a casa conta com isso.',
    },
    caption:
      'A frase mais cara do mundo. 🚨\n\nPerseguir prejuízo é o roteiro da falência. Quem lucra é sempre a plataforma.\n\nSe apostar virou compulsão, procure ajuda: Jogadores Anônimos (jogadoresanonimos.com.br).\n\n🐷 Retome o controle no Controle DinDin.',
    hashtags:
      '#antibet #pareagora #saudefinanceira #vidafinanceira #ControleDinDin',
  },
  {
    layout: 'myth',
    angle: 'antibet',
    f: {
      myth: 'Bet é uma renda extra.',
      truth: 'Renda extra tem retorno previsível. Aposta tem prejuízo garantido no fim.',
    },
    caption:
      'Bet não é investimento, não é renda, não é trabalho. É custo disfarçado de esperança. 💸\n\n🐷 Quer renda de verdade? Comece guardando o que você gastaria apostando. Controle DinDin.',
    hashtags:
      '#antibet #rendaextra #educacaofinanceira #chegadeaposta #ControleDinDin',
  },
  {
    layout: 'question',
    angle: 'antibet',
    f: { question: 'Quanto você já perdeu em apostas esse mês? Some tudo. 😳' },
    caption:
      'Vai doer, mas soma. 🧮\n\nAgora imagina esse valor rendendo numa meta sua todo mês. Dá pra virar o jogo.\n\n🐷 Comenta o que você faria com esse dinheiro de volta.',
    hashtags:
      '#antibet #chegadeaposta #controledegastos #conscienciafinanceira #ControleDinDin',
  },
  {
    layout: 'list',
    angle: 'antibet',
    f: {
      eyebrow: 'Salve e compartilhe',
      title: '3 verdades que a bet esconde',
      item1: 'A probabilidade é feita pra você perder',
      item2: 'O app é projetado pra te viciar',
      item3: 'Quem lucra nunca é você',
    },
    caption:
      'Ninguém te conta isso nos anúncios com influencer. 🎯\n\nSalva esse post e manda pra alguém que precisa ver.\n\n🐷 Aposte em você. Controle DinDin.',
    hashtags:
      '#antibet #pareagora #educacaofinanceira #chegadeaposta #ControleDinDin',
  },
  {
    layout: 'feature',
    angle: 'antibet',
    f: {
      badge: 'APOSTE EM VOCÊ',
      headline: 'Cada real tem um lugar melhor.',
      sub: 'Direcione o que iria pra bet a uma meta e veja o dinheiro crescer, não sumir.',
    },
    caption:
      'E se, em vez de apostar, você guardasse? 🐷\n\nDefina uma meta no Controle DinDin e transforme o impulso de apostar em progresso de verdade.\n\n🐷 Teste 10 dias grátis.',
    hashtags:
      '#antibet #metasfinanceiras #liberdadefinanceira #chegadeaposta #ControleDinDin',
  },
]

export const ANGLE_LABELS: Record<Angle, string> = {
  dica: 'Dica rápida',
  recurso: 'Recurso do app',
  pergunta: 'Pergunta',
  frase: 'Frase',
  mito: 'Mito vs verdade',
  tema: 'Tema do momento',
  antibet: '🚫 Anti-bet',
  anuncio: '📣 Anúncio',
}

export interface ThemeChip {
  label: string
  theme: string
}

export const THEMES: ThemeChip[] = [
  { label: '🏆 Copa do Mundo 2026', theme: 'Copa do Mundo 2026' },
  { label: '✈️ Férias de julho', theme: 'férias de julho e gastos de viagem' },
  { label: '🎒 Volta às aulas', theme: 'volta às aulas e material escolar' },
  { label: '👔 Dia dos Pais', theme: 'Dia dos Pais e presentes' },
  { label: '💵 Alta do dólar', theme: 'alta do dólar e economia' },
  { label: '🤖 Febre da IA', theme: 'inteligência artificial no dia a dia' },
  { label: '🛍️ Black Friday', theme: 'Black Friday e compras por impulso' },
  { label: '💝 Dia dos Namorados', theme: 'Dia dos Namorados e finanças a dois' },
]

export const STRAT: Record<Layout, Strategy> = {
  ad: {
    mood: 'Épico / comercial',
    bpm: '110–125 BPM',
    hook: 'O celular girando na tela',
    goal: 'Visitas ao perfil / cliques',
    plat: 'Reels + FB (impulsionar)',
  },
  statement: {
    mood: 'Punchy / impacto',
    bpm: '120–130 BPM',
    hook: '"Para de rolar 🛑"',
    goal: 'Compartilhamento',
    plat: 'Reels + TikTok',
  },
  list: {
    mood: 'Motivacional / upbeat',
    bpm: '100–120 BPM',
    hook: '"Salva esse post 👇"',
    goal: 'Salvamentos',
    plat: 'Reels + TikTok',
  },
  question: {
    mood: 'Leve / curioso',
    bpm: '90–110 BPM',
    hook: 'A pergunta na tela',
    goal: 'Comentários',
    plat: 'Reels + TikTok',
  },
  feature: {
    mood: 'Tech / energia',
    bpm: '120–130 BPM',
    hook: '"Isso economiza seu tempo ⏱️"',
    goal: 'Visitas ao perfil',
    plat: 'Reels + TikTok',
  },
  quote: {
    mood: 'Calmo / cinematográfico',
    bpm: '80–95 BPM',
    hook: '"Uma verdade sobre dinheiro:"',
    goal: 'Retenção / salvar',
    plat: 'Reels',
  },
  myth: {
    mood: 'Tensão → alívio',
    bpm: '100–120 BPM',
    hook: '"Mito ou verdade? 🤔"',
    goal: 'Comentários / debate',
    plat: 'Reels + TikTok',
  },
}

/** Campos editáveis por layout: [chave, rótulo]. */
export const EDIT_FIELDS: Record<Layout, [keyof import('../types').CreativeFields, string][]> = {
  ad: [
    ['headline', 'Título'],
    ['highlight', 'Destaque (verde)'],
    ['sub', 'Descrição'],
    ['cta', 'Botão CTA'],
    ['badge', 'Selo'],
  ],
  statement: [
    ['line1', 'Linha 1'],
    ['line2', 'Linha 2 (destaque)'],
  ],
  list: [
    ['title', 'Título'],
    ['item1', 'Item 1'],
    ['item2', 'Item 2'],
    ['item3', 'Item 3'],
  ],
  question: [['question', 'Pergunta']],
  feature: [
    ['headline', 'Título'],
    ['sub', 'Descrição'],
  ],
  quote: [['quote', 'Frase']],
  myth: [
    ['myth', 'Mito'],
    ['truth', 'Verdade'],
  ],
}
