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
      'pessoa brasileira sorrindo ao guardar moedas num cofrinho sobre a mesa da cozinha',
      'jovem casal brasileiro conferindo as contas no celular, aliviado e otimista',
      'mulher brasileira anotando metas num caderno de planejamento financeiro, xícara de café ao lado',
      'família brasileira tomando café da manhã e conversando sobre a economia da casa',
      'homem brasileiro no home office olhando um app de finanças no celular, satisfeito',
      'pessoa idosa brasileira organizando notas e recibos na sala de estar aconchegante',
      'mãe e filho brasileiros colocando moedas juntos num cofrinho de porquinho',
      'jovem brasileira comemorando uma conquista financeira com o celular na mão',
    ],
    imageWorld:
      'pessoas brasileiras do dia a dia lidando com dinheiro e economia doméstica de forma positiva (guardando dinheiro, planejando metas, conferindo o app, comemorando conquistas em casa)',
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
      'psicóloga acolhendo uma pessoa em sessão num consultório aconchegante, luz natural suave',
      'pessoa serena tomando um chá junto à janela, expressão calma e introspectiva',
      'mulher adulta escrevendo num diário em casa, momento de autoconhecimento',
      'pessoa idosa conversando com carinho com uma psicóloga numa sala tranquila',
      'adolescente em conversa acolhedora com uma profissional, ambiente seguro e leve',
      'duas pessoas caminhando e conversando ao ar livre em luz suave, clima de escuta',
      'pessoa respirando fundo com os olhos fechados numa varanda tranquila com plantas',
      'mãos de duas pessoas em gesto de apoio durante uma conversa acolhedora',
    ],
    imageWorld:
      'pessoas em cenas de acolhimento e bem-estar emocional: sessões de escuta, momentos de autoconhecimento, conversas serenas em ambientes calmos e humanos — nunca clichês de "loucura" ou clínica fria',
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
