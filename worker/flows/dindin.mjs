// Roteiros de demonstração do ControleDinDin (declarativos).
//
// Seletores confirmados no fonte do app (github.com/diegocsrdias/Financas,
// finance-control/src). O engine aceita 'testid:', 'css:' e 'text:' — usamos
// testid quando o app já expõe um, e css/rota quando não. Navegação é por ROTA
// real (/goals, /forecast), então dá pra ir direto com `goto` após o login.
//
// As legendas ('caption') são o texto na tela do vídeo. Regra do playbook: só
// FATOS APROVADOS — nada de número/claim inventado. Por isso o CTA não afirma
// duração de trial (confirme e ajuste se quiser citar "X dias grátis").
// `$DINDIN_DEMO_EMAIL` / `$DINDIN_DEMO_PASSWORD` vêm das variáveis de ambiente.

/** Login comum (conta DEMO com dados falsos e seguros). */
const login = [
  { goto: '/login', hold: 800 },
  { fill: 'css:input[type="email"]', value: '$DINDIN_DEMO_EMAIL' },
  { fill: 'css:input[type="password"]', value: '$DINDIN_DEMO_PASSWORD' },
  { click: 'css:button[type="submit"]' },
  // marcador de "logado" VISÍVEL no mobile: o FAB do Quick-Add (o app tem uma
  // sidebar desktop com aria-label duplicado, mas ela fica hidden no celular).
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
      // FAB central abre o Quick-Add (aria-label confirmado no BottomNav).
      { click: 'css:[aria-label="Abrir Quick-Add"]', caption: 'Toca em adicionar', hold: 1000 },
      // input do Quick-Add (classe .qa-input). O parser roda no onChange.
      { fill: 'css:.qa-input', value: 'Mercado 87,90 no débito', caption: 'Escreve como você fala', hold: 1600 },
      // "Salvar" só habilita quando a IA monta o lançamento (draft).
      { click: 'text:Salvar', caption: 'e a IA lança sozinha ✨', hold: 1600 },
      // abre a lista pra mostrar o lançamento já registrado.
      { goto: '/transactions', hold: 400 },
      { waitFor: 'testid:transactions-list', caption: 'Pronto, já entrou', hold: 1800 },
      { caption: 'Comece com teste grátis · link na bio', hold: 2400 },
    ],
  },
  {
    id: 'meta',
    title: 'Meta com projeção automática',
    caption:
      'Defina uma meta e veja a projeção do seu saldo ao longo do tempo. 🐷\n\nComece com teste grátis. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      // rota real das metas (o drawer navega pra /goals).
      { goto: '/goals', caption: 'Suas metas', hold: 1400 },
      { waitFor: 'testid:goals-new-cta', caption: 'Crie um objetivo', hold: 1400 },
      // rota real da projeção de saldo.
      { goto: '/forecast', caption: 'com projeção automática de saldo', hold: 1400 },
      { waitFor: 'testid:forecast-headline-stats', hold: 1800 },
      { caption: 'Comece com teste grátis · link na bio', hold: 2400 },
    ],
  },
]

export function getFlow(id) {
  return flows.find((f) => f.id === id)
}
