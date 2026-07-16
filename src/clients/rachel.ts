import type { Concept } from '../types'
import type { ThemeChip } from '../data/shared'
import type { ClientConfig } from './types'
import logo from '../assets/rachel/logo-rachel.svg'
import perfil from '../assets/rachel/rachel-perfil.png'

/**
 * Banco de conceitos prontos da Rachel Villari — psicóloga clínica (funciona
 * 100% offline, sem IA). Cada item já traz legenda e hashtags.
 *
 * Estes textos são a referência de tom da marca: conteúdo editorial de uma
 * profissional de saúde, não publicidade. Ao editar, mantenha a precisão
 * técnica e evite retórica de venda, promessa de resultado e clichê de
 * autoajuda (ver writingRules em api/_lib/clients.js).
 */
const BANK: Concept[] = [
  // ---- AD (cartaz institucional: apresenta um serviço com sobriedade) ----
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'PSICOTERAPIA',
      headline: 'Um espaço para',
      highlight: 'pensar em voz alta.',
      sub: 'Atendimento individual para adolescentes, adultos e idosos. Sessões de 50 minutos, presenciais na Vila da Saúde, online ou domiciliares.',
      cta: 'Agendar conversa',
    },
    caption:
      'A psicoterapia é um espaço reservado para elaborar o que costuma ficar sem tempo de ser pensado.\n\nO trabalho é conduzido com base em evidências científicas e no sigilo previsto pelo Código de Ética.\n\nSe fizer sentido para você, podemos conversar — link na bio.',
    hashtags:
      '#psicologia #psicoterapia #saudemental #psicologiaclinica #RachelVillari',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'AVALIAÇÃO NEUROPSICOLÓGICA',
      headline: 'Um mapa de como',
      highlight: 'sua mente funciona.',
      sub: 'Investigação de memória, atenção, linguagem e funções executivas, com relatório e devolutiva para orientar condutas.',
      cta: 'Saber mais',
    },
    caption:
      'A avaliação neuropsicológica investiga funções cognitivas por meio de testes padronizados e produz um relatório que apoia o trabalho de médicos, terapeutas e da própria pessoa.\n\nÉ indicada em casos de queixa de memória, dificuldades de atenção, lesões cerebrais e acompanhamento de quadros neurológicos.\n\nDúvidas sobre o processo? Link na bio.',
    hashtags: '#neuropsicologia #avaliacaoneuropsicologica #cognicao #saudemental #RachelVillari',
  },
  {
    layout: 'ad',
    angle: 'anuncio',
    f: {
      badge: 'ATENDIMENTO DOMICILIAR',
      headline: 'Quando sair de casa',
      highlight: 'não é possível.',
      sub: 'Psicologia em reabilitação física e estimulação cognitiva no domicílio, para quem enfrenta limitações de mobilidade.',
      cta: 'Falar sobre o caso',
    },
    caption:
      'Limitação de mobilidade, internação prolongada ou um quadro em reabilitação não deveriam interromper o acompanhamento psicológico.\n\nMinha formação em Psicologia Hospitalar com ênfase em Reabilitação (HC-FMUSP) orienta esse trabalho, feito na casa da pessoa e em diálogo com a equipe de saúde que a acompanha.\n\nPara conversar sobre um caso, o link está na bio.',
    hashtags: '#psicologiahospitalar #reabilitacao #atendimentodomiciliar #saudemental #RachelVillari',
  },

  // ---- STATEMENT (observação clínica em duas linhas) ----
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Sobre ansiedade', line1: 'A ansiedade antecipa', line2: 'o que ainda não houve.' },
    caption:
      'A ansiedade opera no futuro: o corpo responde a uma ameaça que ainda não aconteceu, como se já estivesse acontecendo.\n\nPor isso argumentar consigo mesmo raramente resolve — o sistema de alarme não é convencido por lógica. O trabalho terapêutico costuma passar menos por eliminar a ansiedade e mais por entender o que ela está tentando proteger.\n\nSe quiser conversar sobre isso, o link está na bio.',
    hashtags: '#ansiedade #psicoterapia #saudemental #psicologiaclinica #RachelVillari',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Sobre o luto', line1: 'O luto não tem', line2: 'prazo de validade.' },
    caption:
      'Não existe um cronograma correto para o luto, e a ideia de "superar" costuma ser mal colocada.\n\nO processo tende menos à eliminação da perda e mais à reorganização da vida em torno dela — o vínculo não desaparece, muda de lugar. Quando o sofrimento se mantém intenso a ponto de interromper o funcionamento cotidiano por muito tempo, vale buscar acompanhamento.\n\nLink na bio para conversarmos.',
    hashtags: '#luto #psicologia #saudemental #psicoterapia #RachelVillari',
  },
  {
    layout: 'statement',
    angle: 'dica',
    f: { eyebrow: 'Sobre autoconhecimento', line1: 'Nomear o que se sente', line2: 'já organiza.' },
    caption:
      'Dar nome preciso a um estado emocional não é detalhe de vocabulário: a pesquisa em regulação emocional indica que discriminar o que se sente ("não é raiva, é frustração") reduz a intensidade da reação.\n\nParte do trabalho em terapia é justamente ampliar esse repertório — sair do genérico "estou mal" para algo mais específico, que possa ser trabalhado.\n\nSe fizer sentido, o link está na bio.',
    hashtags: '#autoconhecimento #regulacaoemocional #psicoterapia #saudemental #RachelVillari',
  },

  // ---- LIST (informação organizada; nunca checklist de autodiagnóstico) ----
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Como funciona',
      title: 'O que acontece numa avaliação neuropsicológica',
      item1: 'Entrevista inicial e definição da questão a investigar',
      item2: 'Sessões de testes padronizados de memória, atenção e linguagem',
      item3: 'Devolutiva e relatório com orientações para a equipe de saúde',
    },
    caption:
      'A avaliação neuropsicológica costuma gerar dúvidas antes de começar, então vale explicar o percurso.\n\nNão é um teste de inteligência nem um julgamento: é uma investigação estruturada do funcionamento cognitivo, que resulta em informação útil para orientar tratamento e decisões.\n\nO número de sessões varia conforme a questão investigada. Dúvidas, link na bio.',
    hashtags: '#neuropsicologia #avaliacaoneuropsicologica #cognicao #memoria #RachelVillari',
  },
  {
    layout: 'list',
    angle: 'dica',
    f: {
      eyebrow: 'Escolhendo profissional',
      title: 'O que verificar antes de iniciar terapia',
      item1: 'Registro ativo no Conselho Regional de Psicologia (CRP)',
      item2: 'Clareza sobre abordagem, frequência e combinações do setting',
      item3: 'Se você se sente à vontade para falar — o vínculo é parte do tratamento',
    },
    caption:
      'Escolher um psicólogo é uma decisão sobre a qual quase ninguém recebe orientação.\n\nO registro no CRP pode ser consultado publicamente e é o mínimo. Além disso, a pesquisa sobre resultados em psicoterapia é consistente em um ponto: a qualidade do vínculo entre paciente e terapeuta é um dos maiores preditores de bons desfechos, acima da abordagem escolhida.\n\nSe não fluir depois de algumas sessões, isso é assunto legítimo para levar à terapia.',
    hashtags: '#psicoterapia #psicologia #saudemental #CRP #RachelVillari',
  },

  // ---- QUESTION (convite a pensar, não isca de comentário) ----
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Você consegue distinguir estar cansado de estar esgotado?' },
    caption:
      'São coisas diferentes. O cansaço responde ao descanso; o esgotamento persiste depois de dormir, do fim de semana, das férias.\n\nEssa distinção importa porque muda a conduta: contra o esgotamento, mais descanso do mesmo tipo costuma não bastar — o que está em questão é a relação com a demanda, não a quantidade de sono.\n\nSe isso ressoa há tempo demais, o link está na bio.',
    hashtags: '#esgotamento #burnout #saudemental #psicoterapia #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'De quem é a voz que te cobra quando você erra?' },
    caption:
      'A autocrítica raramente é inventada por nós. Ela costuma ter história: um tom, uma frase, alguém que dizia aquilo antes de virarmos nós mesmos quem diz.\n\nReconhecer a origem dessa voz não a faz desaparecer, mas cria alguma distância — e é dessa distância que sai a possibilidade de responder a ela em vez de apenas obedecer.\n\nEsse é um trabalho possível em terapia. Link na bio.',
    hashtags: '#autocritica #autoconhecimento #psicoterapia #saudemental #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'Envelhecer explica qualquer esquecimento?' },
    caption:
      'Não. Alguma lentificação cognitiva acompanha o envelhecimento típico, mas nem todo esquecimento entra nessa conta.\n\nEsquecer onde deixou a chave é diferente de não reconhecer para que ela serve. Quando as falhas passam a interferir em atividades que a pessoa fazia sem dificuldade, isso merece investigação — e não resignação.\n\nA avaliação neuropsicológica ajuda a diferenciar os dois casos. Link na bio.',
    hashtags: '#envelhecimento #neuropsicologia #memoria #terceiraidade #RachelVillari',
  },
  {
    layout: 'question',
    angle: 'pergunta',
    f: { question: 'O que você faz com o que sente quando não há tempo de sentir?' },
    caption:
      'Emoção adiada não se dissolve: costuma reaparecer deslocada — no sono que não vem, na irritação desproporcional, no corpo que dói sem causa clínica.\n\nRotinas muito cheias podem funcionar como anestesia eficiente, e por isso mesmo difícil de perceber. Terapia é, entre outras coisas, um tempo reservado para o que fica sempre para depois.\n\nLink na bio.',
    hashtags: '#saudeemocional #psicoterapia #saudemental #autoconhecimento #RachelVillari',
  },

  // ---- FEATURE (áreas de atuação, descritas com precisão) ----
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'PSICOTERAPIA CLÍNICA',
      headline: 'Sessões de 50 minutos, semanais.',
      sub: 'Atendimento individual para adolescentes, adultos e idosos, com frequência ajustável ao caso.',
    },
    caption:
      'O enquadre da psicoterapia — duração, frequência, sigilo — não é burocracia: é parte do que torna o trabalho possível.\n\nA regularidade sustenta a continuidade do processo, e o sigilo é o que permite dizer o que não se diz em outros lugares. Ambos são previstos pelo Código de Ética da profissão.\n\nPresencial na Vila da Saúde, online ou domiciliar. Link na bio.',
    hashtags: '#psicoterapia #psicologiaclinica #saudemental #psicologa #RachelVillari',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'ESTIMULAÇÃO COGNITIVA',
      headline: 'Trabalho estruturado, não jogo de memória.',
      sub: 'Intervenção para declínio cognitivo, lesões cerebrais e quadros demenciais, ajustada a cada caso.',
    },
    caption:
      'Estimulação cognitiva não é passatempo nem promessa de recuperar o que era antes.\n\nÉ um trabalho estruturado sobre funções específicas — atenção, memória, linguagem, funções executivas — com objetivos definidos a partir do caso: preservar autonomia, sustentar o que está funcionando, adaptar o que mudou.\n\nAplicada em declínio cognitivo, lesões cerebrais e demências. Link na bio.',
    hashtags: '#estimulacaocognitiva #neuropsicologia #demencia #terceiraidade #RachelVillari',
  },
  {
    layout: 'feature',
    angle: 'recurso',
    f: {
      badge: 'PSICOLOGIA NA REABILITAÇÃO',
      headline: 'O corpo muda; a vida em volta, também.',
      sub: 'Acompanhamento psicológico durante processos de reabilitação física, em diálogo com a equipe de saúde.',
    },
    caption:
      'A reabilitação física costuma ser tratada como uma questão do corpo, mas raramente é só isso: muda a rotina, o trabalho, a autonomia, a forma como a pessoa se vê.\n\nO acompanhamento psicológico nesse período trabalha o que essa reorganização exige — e funciona melhor articulado com a equipe que já cuida do caso.\n\nFormação em Psicologia Hospitalar com ênfase em Reabilitação (HC-FMUSP). Link na bio.',
    hashtags: '#psicologiahospitalar #reabilitacao #saudemental #psicologia #RachelVillari',
  },

  // ---- QUOTE (reflexão autoral com densidade, não frase motivacional) ----
  {
    layout: 'quote',
    angle: 'frase',
    f: {
      quote:
        'Você não precisa ter tudo organizado para começar. A terapia também é o lugar de organizar.',
    },
    caption:
      'Muita gente adia a terapia esperando conseguir formular direito o que está sentindo — como se fosse preciso chegar com a questão pronta.\n\nMas a formulação costuma ser resultado do processo, não pré-requisito. Começar sem saber exatamente o que se procura é uma forma bastante comum de começar.\n\nSe fizer sentido para você, o link está na bio.',
    hashtags: '#psicoterapia #saudemental #autoconhecimento #psicologia #RachelVillari',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Nem tudo que dói precisa ser resolvido depressa. Algumas coisas precisam ser compreendidas primeiro.' },
    caption:
      'Existe uma pressa comum em fazer o desconforto passar — e ela é compreensível.\n\nMas nem todo sofrimento é um defeito a corrigir; parte dele carrega informação sobre o que importa, o que foi perdido, o que precisa mudar. A terapia frequentemente começa desacelerando essa pressa o suficiente para que a compreensão seja possível.\n\nLink na bio.',
    hashtags: '#psicoterapia #saudemental #psicologiaclinica #autoconhecimento #RachelVillari',
  },
  {
    layout: 'quote',
    angle: 'frase',
    f: { quote: 'Escutar não é esperar a vez de falar. É uma técnica, e leva anos para ser aprendida.' },
    caption:
      'A escuta clínica é frequentemente confundida com gentileza ou paciência. É outra coisa: um trabalho técnico de acompanhar o que é dito, o que não é, e o que aparece entre as duas coisas.\n\nÉ isso que diferencia uma sessão de psicoterapia de uma boa conversa com alguém querido — ambas têm valor, e nenhuma substitui a outra.\n\nLink na bio.',
    hashtags: '#escutaclinica #psicoterapia #psicologia #saudemental #RachelVillari',
  },

  // ---- MYTH (esclarecimento técnico de mal-entendidos comuns) ----
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Terapia é só para quem tem um transtorno grave.',
      truth: 'A psicoterapia trata sofrimento, e sofrimento não exige diagnóstico para ser legítimo.',
    },
    caption:
      'A ideia de que só se busca terapia em crise faz muita gente esperar chegar ao limite antes de procurar ajuda.\n\nLuto, mudanças de fase, dificuldades de relação e questões de autoconhecimento são demandas frequentes em consultório e não configuram transtorno algum. O critério não é a gravidade do quadro, é o quanto algo está pesando.\n\nLink na bio.',
    hashtags: '#mitosdaterapia #saudemental #psicoterapia #psicologia #RachelVillari',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Psicólogo e psiquiatra fazem a mesma coisa.',
      truth: 'São formações distintas: o psiquiatra é médico e prescreve medicação; o psicólogo conduz a psicoterapia.',
    },
    caption:
      'A confusão é comum e atrapalha o acesso ao cuidado certo.\n\nPsiquiatria é especialidade médica: diagnostica e prescreve. Psicologia é outra graduação, sem prescrição, e conduz o processo psicoterapêutico. Não são concorrentes — em muitos casos o acompanhamento conjunto é o mais indicado, e os dois profissionais trabalham articulados.\n\nDúvidas sobre qual procurar? Link na bio.',
    hashtags: '#psicologia #psiquiatria #saudemental #psicoterapia #RachelVillari',
  },
  {
    layout: 'myth',
    angle: 'mito',
    f: {
      myth: 'Se eu começar terapia, vou precisar para sempre.',
      truth: 'A psicoterapia tem início, meio e fim — e o encerramento faz parte do trabalho.',
    },
    caption:
      'O receio de dependência é legítimo e merece resposta honesta.\n\nA duração varia conforme a demanda: alguns processos são breves e focais, outros se estendem. Mas o objetivo é sempre ampliar autonomia, e o encerramento é discutido junto, não decidido unilateralmente. Retomar depois, se fizer sentido, também é comum.\n\nSe quiser conversar sobre o seu caso, o link está na bio.',
    hashtags: '#processoterapeutico #psicoterapia #saudemental #psicologia #RachelVillari',
  },
]

const THEMES: ThemeChip[] = [
  { label: '💛 Setembro Amarelo', theme: 'Setembro Amarelo e prevenção ao suicídio' },
  { label: '🤍 Janeiro Branco', theme: 'Janeiro Branco e cuidado com a saúde mental' },
  { label: '🎒 Volta às aulas', theme: 'ansiedade na volta às aulas' },
  { label: '🔥 Burnout no trabalho', theme: 'burnout e esgotamento no trabalho' },
  { label: '🎄 Fim de ano', theme: 'ansiedade e cobranças de fim de ano' },
  { label: '👵 Saúde mental na terceira idade', theme: 'saúde mental e cognitiva na terceira idade' },
  { label: '🧠 Memória e cognição', theme: 'memória, atenção e avaliação neuropsicológica' },
  { label: '🕊️ Luto', theme: 'luto e processos de perda' },
  { label: '💬 Como funciona a terapia', theme: 'dúvidas comuns sobre como funciona a psicoterapia' },
  { label: '🧩 Autoconhecimento', theme: 'autoconhecimento e regulação emocional' },
]

export const rachelClient: ClientConfig = {
  id: 'rachel',
  voice: 'editorial',
  name: 'Rachel Villari',
  brandParts: ['Rachel', 'Villari'],
  smallPrint: 'CRP 06/158060 · Psicóloga',
  ctaBadgeLong: 'Agende uma conversa',
  ctaBadgeShort: 'Vamos conversar',
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
