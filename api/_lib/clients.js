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
