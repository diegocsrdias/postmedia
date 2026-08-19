// Roteiros de demonstração do ControleDinDin (declarativos).
//
// Seletores confirmados no fonte do app (github.com/diegocsrdias/Financas,
// finance-control/src) e no app rodando com a conta demo. O engine aceita
// 'testid:', 'css:' e 'text:'; navegação é por ROTA real, então `goto` vai
// direto após o login. Só features com conteúdo na conta demo entram (reservas
// e parcelamentos estão vazios — ficam de fora).
//
// Legendas ('caption') = texto na tela. Regra do playbook: só FATOS APROVADOS —
// nada de número/claim inventado (por isso o CTA não cita duração de trial).
// `$DINDIN_DEMO_EMAIL` / `$DINDIN_DEMO_PASSWORD` vêm das variáveis de ambiente.

const CTA = 'Comece com teste grátis · link na bio'

/** Login comum (conta DEMO com dados falsos e seguros). */
const login = [
  { goto: '/login', hold: 700 },
  { fill: 'css:input[type="email"]', value: '$DINDIN_DEMO_EMAIL' },
  { fill: 'css:input[type="password"]', value: '$DINDIN_DEMO_PASSWORD' },
  { click: 'css:button[type="submit"]' },
  // marcador de "logado" VISÍVEL no mobile: o FAB do Quick-Add (a sidebar de
  // desktop tem aria-label duplicado, mas fica hidden no celular).
  { waitFor: 'css:[aria-label="Abrir Quick-Add"]', hold: 600 },
]

export const flows = [
  {
    id: 'quick-add',
    title: 'Fala o gasto, a IA lança',
    caption:
      'Chega de planilha: você escreve o gasto em linguagem normal e o Controle DinDin lança sozinho. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { caption: 'Seus gastos, no controle', hold: 1400 },
      { click: 'css:[aria-label="Abrir Quick-Add"]', caption: 'Toca em adicionar', hold: 1000 },
      { fill: 'css:.qa-input', value: 'Mercado 87,90 no débito', caption: 'Escreve como você fala', hold: 1600 },
      { click: 'text:Salvar', caption: 'e a IA lança sozinha', hold: 1500 },
      { goto: '/transactions', hold: 400 },
      { waitFor: 'testid:transactions-list', caption: 'Pronto, já entrou', hold: 2000 },
      { caption: CTA, hold: 2400 },
    ],
  },
  {
    id: 'meta',
    title: 'Meta com projeção automática',
    caption:
      'Defina uma meta e veja a projeção do seu saldo ao longo do tempo. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { goto: '/goals', caption: 'Suas metas', hold: 1600 },
      { waitFor: 'testid:goals-new-cta', caption: 'Defina um objetivo', hold: 2000 },
      { goto: '/forecast', caption: 'e veja a projeção do saldo', hold: 1600 },
      { waitFor: 'testid:forecast-headline-stats', hold: 2200 },
      { caption: CTA, hold: 2400 },
    ],
  },
  {
    id: 'insights',
    title: 'Pra onde vai seu dinheiro',
    caption:
      'A IA lê seus hábitos e mostra onde o dinheiro está indo — sem você montar relatório nenhum. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { goto: '/insights', caption: 'Pra onde vai seu dinheiro?', hold: 1600 },
      { waitFor: 'testid:category-radar', caption: 'A IA lê seus hábitos', hold: 1800 },
      // desliza até o radar de categorias (que tem dado) — mostra a distribuição.
      { click: 'testid:category-radar', caption: 'e mostra onde você mais gasta', hold: 2400 },
      { caption: CTA, hold: 2400 },
    ],
  },
  {
    id: 'transacoes',
    title: 'Tudo organizado por dia',
    caption:
      'Cada lançamento no lugar, agrupado por dia, com resumo do período na hora. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { goto: '/transactions', caption: 'Tudo que entra e sai', hold: 1600 },
      { waitFor: 'testid:period-summary-strip', caption: 'organizado por dia', hold: 2000 },
      { click: 'text:Despesas', caption: 'e filtra num toque', hold: 1800 },
      { waitFor: 'testid:transactions-list', hold: 1600 },
      { caption: CTA, hold: 2400 },
    ],
  },
  {
    id: 'recorrencias',
    title: 'Contas fixas no automático',
    caption:
      'Aluguel, assinaturas, salário: cadastra uma vez e entra sozinho todo mês. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { goto: '/recurring', caption: 'Contas que se repetem?', hold: 1600 },
      { waitFor: 'text:Transações Recorrentes', caption: 'Cadastra uma vez', hold: 2000 },
      { caption: 'e entra sozinho todo mês', hold: 2200 },
      { caption: CTA, hold: 2400 },
    ],
  },
]

export function getFlow(id) {
  return flows.find((f) => f.id === id)
}
