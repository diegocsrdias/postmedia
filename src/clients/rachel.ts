import type { Concept } from '../types'
import type { ThemeChip } from '../data/shared'
import type { ClientConfig } from './types'
import logo from '../assets/rachel/logo-rachel.svg'
import perfil from '../assets/rachel/rachel-perfil.png'

/**
 * Banco de conceitos prontos da Rachel Villari — psicóloga clínica (funciona
 * 100% offline, sem IA). Cada item já traz legenda e hashtags.
 */
const BANK: Concept[] = [
  // ---- AD (propaganda elaborada) ----
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'ESPAÇO DE ESCUTA',
      headline: 'Você não precisa',
      highlight: 'ter tudo pronto.',
      sub: 'Psicoterapia humanizada para adolescentes, adultos e idosos. Presencial, online ou domiciliar.',
      cta: 'Quero agendar',
    },
    caption:
      'A terapia também é o lugar de organizar. 🌿\n\nUm espaço de escuta qualificada, acolhimento e cuidado — conduzido com ética e base científica.\n\n💬 Vamos conversar? Link na bio.',
    hashtags:
      '#psicologia #terapia #saudemental #psicoterapia #RachelVillari',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'ATENDIMENTO HUMANIZADO',
      headline: 'Um espaço só seu',
      highlight: 'pra desabafar.',
      sub: 'Escuta qualificada, individualizada e baseada em evidências científicas. Sem julgamento.',
      cta: 'Agendar conversa',
    },
    caption:
      'Nem sempre precisamos ter certeza de nada pra começar. 🤍\n\nA gente pode começar com uma conversa simples e ver se faz sentido pra você.\n\n💬 Chama no WhatsApp — link na bio.',
    hashtags: '#psicologa #acolhimento #saudemental #autoconhecimento #RachelVillari',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'SAÚDE MENTAL',
      headline: 'Cuidar da mente',
      highlight: 'também é prioridade.',
      sub: 'Avaliação neuropsicológica, estimulação cognitiva e psicoterapia clínica em São Paulo.',
      cta: 'Conhecer o atendimento',
    },
    caption:
      'Cuidar da cabeça é tão importante quanto cuidar do corpo. 🧠💛\n\nAtendimento ético, individualizado, pra adolescentes, adultos e idosos.\n\n💬 Vamos marcar uma conversa? Link na bio.',
    hashtags: '#neuropsicologia #psicoterapia #saudemental #bemestar #RachelVillari',
  },

  // ---- STATEMENT (dicas/lembretes de impacto) ----
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Lembrete gentil', line1: 'Pedir ajuda', line2: 'é ato de coragem.' },
    caption:
      'Ninguém devia carregar tudo sozinho. 🤍\n\nProcurar terapia não é fraqueza — é reconhecer que você merece cuidado.\n\n💬 Se fizer sentido pra você, vamos conversar. Link na bio.',
    hashtags: '#saudemental #terapia #autocuidado #psicologia #RachelVillari',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Verdade que acalma', line1: 'Você não precisa', line2: 'dar conta de tudo.' },
    caption:
      'Você não precisa ter tudo organizado pra começar. 🌿\n\nA terapia também é o lugar de organizar — no seu tempo, do seu jeito.\n\n💬 Vamos começar com uma conversa? Link na bio.',
    hashtags: '#psicoterapia #saudemental #acolhimento #autoconhecimento #RachelVillari',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Terapia também é isso', line1: 'Organizar', line2: 'o que dói.' },
    caption:
      'Nem tudo precisa de resposta imediata. 🕊️\n\nÀs vezes o primeiro passo é só nomear o que você sente — o resto a gente constrói junto.\n\n💬 Link na bio pra agendar.',
    hashtags: '#psicologia #saudeemocional #terapiaonline #bemestar #RachelVillari',
  },

  // ---- LIST (dicas numeradas / como funciona) ----
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Salve este post',
      title: '3 sinais de que vale conversar com alguém',
      item1: 'Cansaço emocional que não passa com descanso',
      item2: 'Dificuldade de lidar com mudanças ou perdas',
      item3: 'Ansiedade que atrapalha o dia a dia',
    },
    caption:
      'Salva pra rever quando precisar 👇\n\nSe algum desses sinais soou familiar, talvez seja a hora de conversar com alguém.\n\n💬 Estou aqui, sem julgamento. Link na bio.',
    hashtags: '#saudemental #ansiedade #psicologia #autoconhecimento #RachelVillari',
  },
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Antes da 1ª sessão',
      title: 'Como funciona a terapia comigo',
      item1: 'Fale comigo e marcamos uma primeira conversa',
      item2: 'Construímos juntos o processo, no seu ritmo',
      item3: 'Acompanhamento contínuo, com sigilo total',
    },
    caption:
      'Sei que dar o primeiro passo pode gerar dúvidas. 🌱\n\nPor isso o processo é simples: conversamos, entendemos sua demanda e seguimos juntos.\n\n💬 Qualquer dúvida, me chama. Link na bio.',
    hashtags: '#psicoterapia #comofunciona #saudemental #atendimentopsicologico #RachelVillari',
  },

  // ---- QUESTION (engajamento) ----
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Quando foi a última vez que alguém te perguntou como você está — de verdade?' },
    caption:
      'Pergunta simples, resposta nem sempre fácil. 🤍\n\nComenta aqui embaixo — às vezes só de parar pra pensar já ajuda.\n\n💬 E se precisar de um espaço pra isso, estou aqui.',
    hashtags: '#saudeemocional #autoconhecimento #psicologia #bemestar #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'O que te impede de procurar terapia hoje?' },
    caption:
      'Sem julgamento, só reflexão. 🌿\n\nMedo, preço, vergonha, falta de tempo? Comenta — talvez a resposta te ajude a dar o primeiro passo.\n\n💬 Vamos conversar sobre isso?',
    hashtags: '#terapia #psicoterapia #saudemental #autocuidado #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Qual seu jeito favorito de cuidar da mente fora do consultório?' },
    caption:
      'Terapia é parte do cuidado — mas não é a única. 🧘\n\nConta aqui o que mais te ajuda no dia a dia: caminhada, journaling, silêncio, conversa boa?',
    hashtags: '#bemestar #saudemental #autocuidado #mentesa #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Você sabe reconhecer quando precisa de ajuda profissional?' },
    caption:
      'Nem sempre é óbvio. 🤍\n\nSe você chegou até aqui lendo isso, talvez seja a hora de se perguntar com carinho.\n\n💬 Podemos conversar, sem compromisso. Link na bio.',
    hashtags: '#saudemental #psicologia #autoconhecimento #terapia #RachelVillari',
  },

  // ---- FEATURE (áreas de atuação) ----
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'PSICOTERAPIA CLÍNICA',
      headline: 'Um espaço de verdade.',
      sub: 'Atendimento individualizado para adolescentes, adultos e idosos, com escuta ética e acolhedora.',
    },
    caption:
      'Cada pessoa é única — e o atendimento também deveria ser. 🌿\n\nConduzo cada processo de forma ética, individualizada e baseada em evidências científicas.\n\n💬 Vamos conversar? Link na bio.',
    hashtags: '#psicoterapia #atendimentopsicologico #saudemental #psicologa #RachelVillari',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'AVALIAÇÃO NEUROPSICOLÓGICA',
      headline: 'Entenda como sua mente funciona.',
      sub: 'Avaliação completa para apoiar diagnóstico, tratamento e qualidade de vida.',
    },
    caption:
      'Entender a mente é o primeiro passo pra cuidar melhor dela. 🧠\n\nA avaliação neuropsicológica ajuda a mapear funções cognitivas e direcionar o cuidado certo.\n\n💬 Saiba mais — link na bio.',
    hashtags: '#neuropsicologia #avaliacaoneuropsicologica #saudemental #RachelVillari',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'ESTIMULAÇÃO COGNITIVA',
      headline: 'Memória e atenção em dia.',
      sub: 'Exercícios e acompanhamento para manter a mente ativa em todas as idades.',
    },
    caption:
      'A mente também precisa de treino. 🧩\n\nCom estimulação cognitiva, trabalhamos memória, atenção e raciocínio no seu ritmo.\n\n💬 Vamos conversar sobre o melhor caminho pra você?',
    hashtags: '#estimulacaocognitiva #memoria #terceiraidade #saudemental #RachelVillari',
  },

  // ---- QUOTE (frases) ----
  {
    layout: 'quote',
    angle: 'frase',
    f: {
      quote:
        'Você não precisa ter tudo organizado para começar. A terapia também é o lugar de organizar.',
    },
    caption:
      'Uma frase pra guardar. 🤍\n\nSe você está esperando "o momento certo", talvez ele já tenha chegado.\n\n💬 Link na bio pra agendar uma conversa.',
    hashtags: '#psicoterapia #saudemental #autoconhecimento #frasesdeterapia #RachelVillari',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Cuidar da mente é um ato de amor-próprio, não de fraqueza.' },
    caption:
      'Repete isso pra você sempre que precisar. 🌿\n\nBuscar ajuda é coragem, não fraqueza.\n\n💬 Estou aqui quando fizer sentido pra você.',
    hashtags: '#amorproprio #saudemental #psicologia #autocuidado #RachelVillari',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Todo mundo merece um espaço de escuta sem julgamento.' },
    caption:
      'É isso que ofereço em cada sessão. 🕊️\n\nUm espaço reservado e acolhedor, pensado pra você se sentir à vontade.\n\n💬 Vamos conversar? Link na bio.',
    hashtags: '#escutaativa #psicoterapia #acolhimento #saudemental #RachelVillari',
  },

  // ---- MYTH (mitos vs verdades) ----
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Terapia é só pra quem tem um transtorno grave.',
      truth: 'Terapia é pra quem quer se conhecer melhor e viver com mais leveza — com ou sem diagnóstico.',
    },
    caption:
      'Vamos desconstruir esse mito juntos? 🧠\n\nVocê não precisa estar em crise pra merecer um espaço de cuidado.\n\n💬 Vamos conversar? Link na bio.',
    hashtags: '#mitosdaterapia #saudemental #psicoterapia #RachelVillari',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Falar com amigos resolve, não preciso de psicóloga.',
      truth: 'Amigos acolhem, mas a terapia oferece um olhar técnico, ético e sem julgamento pra te ajudar de verdade.',
    },
    caption:
      'Os dois têm valor — mas não substituem um ao outro. 🤍\n\nAmigos são rede de apoio. Terapia é processo profissional, com ética e técnica.\n\n💬 Vamos conversar sobre o que você precisa?',
    hashtags: '#psicoterapia #saudemental #autoconhecimento #RachelVillari',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Se eu começar terapia, vou precisar pra sempre.',
      truth: 'O processo tem tempo — muita gente segue por um período e retoma a vida com as ferramentas que constrói.',
    },
    caption:
      'A terapia não é uma sentença — é um processo. ⏳\n\nCada pessoa tem seu tempo, e o objetivo é te dar autonomia, não dependência.\n\n💬 Vamos conversar sobre o seu momento?',
    hashtags: '#processoterapeutico #saudemental #psicoterapia #RachelVillari',
  },
]

const THEMES: ThemeChip[] = [
  { label: '💛 Setembro Amarelo', theme: 'Setembro Amarelo e prevenção ao suicídio' },
  { label: '🤍 Janeiro Branco', theme: 'Janeiro Branco e cuidado com a saúde mental' },
  { label: '🎒 Volta às aulas', theme: 'ansiedade na volta às aulas' },
  { label: '💐 Dia das Mães', theme: 'Dia das Mães e saúde emocional materna' },
  { label: '🔥 Burnout no trabalho', theme: 'burnout e esgotamento no trabalho' },
  { label: '🎄 Fim de ano', theme: 'ansiedade e cobranças de fim de ano' },
  { label: '👵 Saúde mental na terceira idade', theme: 'saúde mental e cognitiva na terceira idade' },
  { label: '🧠 Autoconhecimento', theme: 'autoconhecimento e inteligência emocional' },
]

export const rachelClient: ClientConfig = {
  id: 'rachel',
  name: 'Rachel Villari',
  brandParts: ['Rachel', 'Villari'],
  smallPrint: 'CRP 06/158060 · Psicóloga',
  ctaBadgeLong: 'Agende uma conversa 💬',
  ctaBadgeShort: 'Vamos conversar 💬',
  offerLine: 'Presencial, online ou domiciliar',
  colors: {
    dark: '#352E27',
    darkText: '#FBF5EC',
    darkTextMuted: '#EBD2BD',
    accent: '#BE6238',
    accentText: '#FFFCF6',
    accentSoft: '#9C4D29',
    cream: '#F6EEE3',
    surfaceAlt: '#EFE1CF',
    ink: '#352E27',
    inkMuted: '#6E6256',
    line: '#E6D8C6',
  },
  fonts: {
    body: "'Mulish', sans-serif",
    serif: "'Spectral', Georgia, serif",
    mono: "'Mulish', sans-serif",
  },
  images: {
    logo,
    heroFrame: 'portrait',
    heroMedia: perfil,
  },
  bank: BANK,
  themes: THEMES,
}
