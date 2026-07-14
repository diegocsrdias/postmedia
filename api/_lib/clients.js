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
  },
  rachel: {
    id: 'rachel',
    name: 'Rachel Villari',
    business:
      'psicóloga clínica em São Paulo (CRP 06/158060) — psicoterapia para adolescentes, adultos e idosos, avaliação neuropsicológica, estimulação cognitiva e psicologia na reabilitação física',
    offer:
      'Atendimento presencial (Vila da Saúde/SP), online ou domiciliar. Sem preços divulgados — CTA sempre para agendar uma conversa pelo WhatsApp.',
    tone: 'humanista, acolhedor, acessível, sem jargão clínico, nunca alarmista; empodera sem prometer milagres',
    audience:
      'pessoas em busca de apoio emocional, autoconhecimento, saúde mental e qualidade de vida — adolescentes, adultos e idosos',
    ctaWord: 'agendar uma conversa pelo WhatsApp',
    hashtag: '#RachelVillari',
    palette: 'terracota (#BE6238), creme quente (#F6EEE3) e marrom escuro (#352E27)',
    imageWorld:
      'cenas de acolhimento e bem-estar emocional: consultório aconchegante, luz natural suave, plantas, xícara de chá, caderno e caneta, ambiente calmo — nunca clichês de "loucura" ou clínica fria',
  },
}

const DEFAULT_CLIENT_ID = 'dindin'

/** Retorna o perfil do cliente pelo id, caindo pro padrão se não existir/vazio. */
export function getClient(id) {
  return (id && CLIENTS[id]) || CLIENTS[DEFAULT_CLIENT_ID]
}
