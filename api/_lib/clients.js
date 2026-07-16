// Perfis de cliente usados para parametrizar os prompts de IA (texto e imagem).
// Cada cliente tem seu próprio negócio, tom de voz, oferta e paleta.

export const CLIENTS = {
  dindin: {
    id: 'dindin',
    name: 'Controle DinDin',
    business:
      'app brasileiro de controle financeiro pessoal com IA: scanner de notas fiscais (fotografa e a IA lança), metas com projeção automática, relatórios por categoria e recorrências',
    offer: 'Oferta: 10 dias grátis sem cartão; Pro R$9,99/mês, Premium R$19,99/mês.',
    tone: 'propaganda criativa, bem-humorada e confiável, com um mascote porquinho',
    audience: 'brasileiros que querem organizar as finanças',
    ctaWord: 'testar grátis / baixar o app',
    hashtag: '#ControleDinDin',
    palette: 'azul-marinho profundo (#303078), verde-limão vibrante (#C0D830) e creme (#F6F2EA)',
    // Vários "mundos" visuais possíveis — um é sorteado a cada geração pra
    // evitar que a IA de imagem sempre convirja pro mesmo objeto/cenário.
    // Cenas neutras (sem fixar quem aparece) — a presença/etnia das pessoas é
    // decidida por sorteio no generate-image.js, não aqui, pra não enviesar.
    imageWorlds: [
      'guardar moedas num cofrinho sobre a mesa da cozinha, clima otimista',
      'conferir as contas no celular na sala, expressão de alívio',
      'anotar metas num caderno de planejamento financeiro, xícara de café ao lado',
      'café da manhã em casa com conversa sobre a economia doméstica',
      'home office organizado com um app de finanças aberto no celular',
      'organizar notas e recibos na sala de estar aconchegante',
      'cofrinho de porquinho, moedas e notas arrumadas sobre uma mesa de madeira',
      'comemorar uma conquista financeira em casa, celular na mão',
    ],
    imageWorld:
      'cenas do dia a dia ligadas a dinheiro e economia doméstica de forma positiva (guardar dinheiro, planejar metas, conferir o app, comemorar conquistas em casa)',
    writingRules: [],
  },
  rachel: {
    id: 'rachel',
    name: 'Rachel Villari',
    business:
      'psicóloga clínica em São Paulo (CRP 06/158060) — psicoterapia para adolescentes, adultos e idosos, avaliação neuropsicológica, estimulação cognitiva e psicologia na reabilitação física',
    offer:
      'Atendimento presencial (Vila da Saúde/SP), online ou domiciliar. Sem preços divulgados — CTA sempre para agendar uma conversa pelo WhatsApp.',
    tone:
      'humanista, acolhedor e profissional — a voz de uma psicóloga clínica experiente falando com propriedade técnica, ' +
      'nunca a voz de um "coach de autoajuda" ou de uma legenda gerada por IA',
    audience:
      'pessoas em busca de apoio emocional, autoconhecimento, saúde mental e qualidade de vida — adolescentes, adultos e idosos',
    ctaWord: 'agendar uma conversa pelo WhatsApp',
    hashtag: '#RachelVillari',
    palette: 'terracota (#BE6238), creme quente (#F6EEE3) e marrom escuro (#352E27)',
    // Vários "mundos" visuais possíveis — um é sorteado a cada geração pra
    // evitar que a IA de imagem sempre convirja pro mesmo objeto/cenário
    // (antes era só uma frase fixa, e o resultado saía quase sempre igual).
    // Cenas neutras (sem fixar quem aparece) — a presença/etnia das pessoas é
    // decidida por sorteio no generate-image.js, não aqui, pra não enviesar.
    imageWorlds: [
      'sessão de psicoterapia acolhedora num consultório aconchegante, luz natural suave',
      'momento sereno tomando um chá junto à janela, clima calmo e introspectivo',
      'escrever num diário em casa, momento de autoconhecimento',
      'conversa carinhosa numa sala tranquila, clima de escuta',
      'conversa acolhedora entre profissional e paciente, ambiente seguro e leve',
      'caminhada e conversa ao ar livre em luz suave, clima de escuta',
      'respiração e pausa numa varanda tranquila com plantas, olhos fechados',
      'gesto de apoio e mãos dadas durante uma conversa acolhedora',
    ],
    imageWorld:
      'cenas de acolhimento e bem-estar emocional: sessões de escuta, momentos de autoconhecimento, conversas serenas em ambientes calmos e humanos — nunca clichês de "loucura" ou clínica fria',
    // Regras de conteúdo específicas pra evitar o "cheirinho de IA genérica" e
    // problemas éticos (CRP proíbe promessa de cura/resultado e sensacionalismo).
    writingRules: [
      'PROIBIDO diagnosticar, prometer cura ou garantir resultado (nunca "acabe com a ansiedade em 3 passos", "cure seu trauma", "resolva de vez")',
      'PROIBIDO clichê de autoajuda genérico e vazio (nada de "você não está sozinho", "sua mente merece cuidado", "dê o primeiro passo hoje" soltos sem contexto real)',
      'PROIBIDO frase de para-choque de caminhão ou tom raso — escreva como quem realmente entende de psicologia, citando com naturalidade conceitos reais (regulação emocional, escuta ativa, autoconhecimento, luto, ansiedade, vínculo, autocuidado) sem jargão pesado',
      'Cada texto deve trazer UMA reflexão, observação clínica ou pergunta específica e verossímil — nunca uma afirmação motivacional genérica que serviria pra qualquer nicho',
      'No máximo 1 emoji por legenda (pode ser zero); nunca fileira de emojis; nunca hashtag motivacional vazia',
      'CTA sempre respeitoso e sem urgência artificial — nunca "corra", "últimas vagas", "não perca essa chance"',
      'Tom sério e profissional o tempo todo, mesmo quando acolhedor — isso não é uma marca de consumo, é saúde mental',
    ],
  },
}

const DEFAULT_CLIENT_ID = 'dindin'

/** Retorna o perfil do cliente pelo id, caindo pro padrão se não existir/vazio. */
export function getClient(id) {
  return (id && CLIENTS[id]) || CLIENTS[DEFAULT_CLIENT_ID]
}

/**
 * Sorteia um dos "mundos visuais" do cliente (lista de cenários/objetos concretos),
 * pra cada geração de imagem partir de um vocabulário diferente e não convergir
 * sempre pro mesmo objeto (ex.: sempre xícara de chá + planta + caderno).
 */
export function randomImageWorld(client) {
  const worlds = client && client.imageWorlds
  if (worlds && worlds.length) return worlds[Math.floor(Math.random() * worlds.length)]
  return client.imageWorld
}
