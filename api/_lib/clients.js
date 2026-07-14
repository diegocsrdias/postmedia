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
    imageWorlds: [
      'cofrinho de porcelana ao lado de moedas e notas de real sobre uma mesa de madeira',
      'carteira de couro aberta com notas e cartão sobre uma superfície neutra',
      'caderno de planejamento financeiro aberto com gráficos desenhados à mão e uma caneta',
      'mesa de café da manhã organizada, com celular mostrando um app e xícara de café',
      'sala de estar brasileira aconchegante e organizada, luz de fim de tarde',
      'pilha de notas de dinheiro brasileiro cuidadosamente arrumadas ao lado de uma calculadora',
      'jarra de vidro tipo cofrinho com moedas, sobre uma prateleira de casa organizada',
      'mesa de trabalho home office com laptop, agenda e xícara, ambiente limpo e produtivo',
    ],
    imageWorld:
      'objetos e cenas ligadas a dinheiro, economia doméstica e vida financeira das pessoas no Brasil (cofrinhos, carteiras, notas, planejamento, casa organizada)',
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
    imageWorlds: [
      'consultório de psicologia aconchegante, poltrona de tecido, luz natural suave entrando pela janela',
      'mesa de madeira clara com caderno aberto, caneta e uma xícara de chá fumegante',
      'janela grande com cortina leve balançando, planta ao lado, luz suave da manhã',
      'estante de livros de psicologia organizada, com uma planta pequena e um porta-retrato discreto',
      'mãos segurando uma xícara quente sobre um colo, tricô ou manta ao fundo, ambiente calmo',
      'varanda ou jardim tranquilo com poltrona de vime, plantas e luz filtrada por folhas',
      'mesa de centro com bloco de anotações, óculos e uma vela apagada, atmosfera serena',
      'caminho ou trilha ao ar livre em luz suave, transmitindo introspecção e caminhada interior',
    ],
    imageWorld:
      'cenas de acolhimento e bem-estar emocional: consultório aconchegante, luz natural suave, plantas, xícara de chá, caderno e caneta, ambiente calmo — nunca clichês de "loucura" ou clínica fria',
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
