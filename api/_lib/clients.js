// Perfis de cliente usados para parametrizar os prompts de IA (texto e imagem).
// Cada cliente tem seu próprio negócio, tom de voz, oferta e paleta.

// `voice` define o enquadramento dos prompts de texto e imagem:
//   'publicitario' — marca de consumo: redator publicitário, imagem de campanha.
//   'editorial'    — serviço profissional regulado (saúde, direito): a voz do
//                    próprio profissional, sem retórica de venda e sem modo promo
//                    de imagem. Usar quando "propaganda" seria antiético ou
//                    simplesmente destruiria a credibilidade da página.
export const CLIENTS = {
  dindin: {
    id: 'dindin',
    voice: 'publicitario',
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
    voice: 'editorial',
    name: 'Rachel Villari',
    business:
      'psicóloga clínica em São Paulo (CRP 06/158060) — psicoterapia para adolescentes, adultos e idosos, avaliação neuropsicológica, estimulação cognitiva e psicologia na reabilitação física',
    // Formação real (ver rachelvillari.com.br) — dá lastro técnico ao texto e
    // evita que a IA invente credenciais.
    credentials:
      'Especialista em Psicologia Hospitalar com ênfase em Reabilitação (Hospital das Clínicas, FMUSP) e em Neuropsicologia (FMU); pós-graduanda em Neuropsicologia',
    offer:
      'Atendimento presencial (Vila da Saúde/SP), online ou domiciliar. Sessões semanais de 50 minutos, com sigilo garantido. ' +
      'Sem preços divulgados — CTA sempre para agendar uma conversa pelo WhatsApp.',
    tone:
      'humanista, acolhedor e profissional — a voz de uma psicóloga clínica experiente falando com propriedade técnica, ' +
      'nunca a voz de um "coach de autoajuda" ou de uma legenda gerada por IA',
    audience:
      'pessoas em busca de apoio emocional, autoconhecimento, saúde mental e qualidade de vida — adolescentes, adultos e idosos',
    ctaWord: 'agendar uma conversa pelo WhatsApp',
    hashtag: '#RachelVillari',
    palette: 'terracota (#BE6238), creme quente (#F6EEE3) e marrom escuro (#352E27)',
    // Menos gente que o padrão (0.7): cenas de ambiente soam mais sóbrias e
    // evitam o clichê de stock photo emotiva típico de página de psicólogo.
    peopleProbability: 0.45,
    // Direcionamentos próprios: ângulos de conteúdo de psicologia, no lugar da
    // lista publicitária padrão (que puxava "custo de não agir", "objeção de
    // quem hesita", "exagero" — gatilhos impróprios pra saúde mental).
    directions: [
      'explique com precisão um conceito real da psicologia (regulação emocional, luto, vínculo, ansiedade antecipatória) em linguagem acessível',
      'descreva uma observação clínica concreta e verossímil sobre como as pessoas se sentem',
      'desfaça com cuidado um mal-entendido comum sobre terapia ou saúde mental',
      'traga um micro-cenário do cotidiano que ilustre uma questão emocional reconhecível',
      'faça uma pergunta reflexiva e específica, que convide a pensar (não a comentar por engajamento)',
      'explique de forma clara como funciona um dos serviços (psicoterapia, avaliação neuropsicológica, estimulação cognitiva)',
      'diferencie duas coisas que costumam ser confundidas (tristeza e depressão, ansiedade e preocupação, limite e rigidez)',
      'aborde com respeito uma dúvida legítima de quem nunca fez terapia',
      'fale sobre saúde mental numa fase específica da vida (adolescência, vida adulta, envelhecimento)',
      'compartilhe uma reflexão sobre o processo terapêutico em si — ritmo, vínculo, tempo',
    ],
    // Vários "mundos" visuais possíveis — um é sorteado a cada geração pra
    // evitar que a IA de imagem sempre convirja pro mesmo objeto/cenário
    // (antes era só uma frase fixa, e o resultado saía quase sempre igual).
    // Cenas neutras (sem fixar quem aparece) — a presença/etnia das pessoas é
    // decidida por sorteio no generate-image.js, não aqui, pra não enviesar.
    // Cenas sóbrias e cotidianas. Evitam de propósito encenar atendimento
    // (simular paciente é problema ético) e clichê de banco de imagens emotivo,
    // que é o que fazia a página parecer propaganda em vez de consultório.
    imageWorlds: [
      'consultório de psicologia vazio e bem cuidado, poltronas e luz natural pela janela',
      'mesa de trabalho de uma profissional com livros de psicologia e caderno de anotações',
      'sala de espera serena e bem iluminada, plantas e assentos confortáveis',
      'xícara de café ao lado de um livro aberto sobre uma mesa de madeira, luz da manhã',
      'estante com livros técnicos de psicologia e neuropsicologia, foco suave',
      'caderno e caneta sobre a mesa junto à janela, ambiente calmo de fim de tarde',
      'varanda tranquila com plantas e uma cadeira, sem ninguém, luz suave',
      'detalhe de um ambiente doméstico organizado e silencioso, tecidos e madeira',
      'caminho arborizado com luz filtrada pelas árvores, clima calmo',
      'material de avaliação neuropsicológica organizado sobre a mesa do consultório',
    ],
    imageWorld:
      'cenas sóbrias ligadas ao cuidado em saúde mental: ambientes calmos e reais (consultório, casa, espaços de pausa), ' +
      'objetos cotidianos e luz natural — nunca encenação de sessão com paciente, nunca clichê emotivo de banco de imagens, ' +
      'nunca clichês de "loucura" ou clínica fria',
    // Regras de conteúdo específicas pra evitar o "cheirinho de IA genérica" e
    // problemas éticos (CRP proíbe promessa de cura/resultado e sensacionalismo).
    writingRules: [
      'Isto NÃO é publicidade: é conteúdo educativo de uma profissional de saúde. Escreva como uma psicóloga escrevendo para o público dela, jamais como uma agência vendendo um serviço',
      'PROIBIDO diagnosticar, prometer cura ou garantir resultado (nunca "acabe com a ansiedade em 3 passos", "cure seu trauma", "resolva de vez")',
      'PROIBIDO clichê de autoajuda genérico e vazio (nada de "você não está sozinho", "sua mente merece cuidado", "dê o primeiro passo hoje" soltos sem contexto real)',
      'PROIBIDO frase de para-choque de caminhão ou tom raso — escreva como quem realmente entende de psicologia, citando com naturalidade conceitos reais (regulação emocional, escuta ativa, autoconhecimento, luto, ansiedade, vínculo, autocuidado) sem jargão pesado',
      'PROIBIDA retórica de venda: sem "benefício", sem antes/depois, sem prova social, sem quebra de objeção, sem exagero, sem humor comercial, sem gatilho de escassez ou de culpa (nunca sugerir o que a pessoa perde por não fazer terapia)',
      'PROIBIDO explorar a dor do público como isca. Falar de sofrimento é legítimo; instrumentalizá-lo para gerar procura, não',
      'Cada texto deve trazer UMA reflexão, observação clínica ou pergunta específica e verossímil — nunca uma afirmação motivacional genérica que serviria pra qualquer nicho',
      'Prefira precisão a impacto: uma frase correta e específica vale mais que uma frase de efeito. Na dúvida entre soar interessante e soar honesta, escolha honesta',
      'No máximo 1 emoji por legenda (pode ser zero); nunca fileira de emojis; nunca hashtag motivacional vazia',
      'CTA sempre respeitoso, discreto e sem urgência artificial — um convite ("se fizer sentido pra você"), nunca uma conversão. Nunca "corra", "últimas vagas", "não perca essa chance"',
      'Tom sério e profissional o tempo todo, mesmo quando acolhedor — isso não é uma marca de consumo, é saúde mental',
      'Respeite o Código de Ética do Psicólogo e a Resolução CFP 011/2018: sem sensacionalismo, sem autopromoção exagerada, sem prometer eficácia, sem depoimento de paciente',
    ],
  },
}

const DEFAULT_CLIENT_ID = 'dindin'

/** Retorna o perfil do cliente pelo id, caindo pro padrão se não existir/vazio. */
export function getClient(id) {
  return (id && CLIENTS[id]) || CLIENTS[DEFAULT_CLIENT_ID]
}

/** True quando o cliente é um serviço profissional (voz editorial, não publicitária). */
export function isEditorial(client) {
  return !!client && client.voice === 'editorial'
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
