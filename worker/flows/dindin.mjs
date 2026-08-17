// Roteiros de demonstração do ControleDinDin (declarativos).
//
// Os seletores 'testid:*' são o CONTRATO que o app precisa expor no fonte
// (data-testid nesses elementos). Ver ../README.md para a lista completa.
//
// As legendas ('caption') são o texto que aparece na tela do vídeo. Regra do
// playbook: só afirmar FATOS APROVADOS — nada de número/claim inventado aqui.
// `$DINDIN_DEMO_EMAIL` / `$DINDIN_DEMO_PASSWORD` vêm das variáveis de ambiente.

/** Login comum a todos os fluxos (usa a conta DEMO, com dados semeados/seguros). */
const login = [
  { goto: '/login', hold: 800 },
  { fill: 'testid:login-email', value: '$DINDIN_DEMO_EMAIL' },
  { fill: 'testid:login-password', value: '$DINDIN_DEMO_PASSWORD' },
  { click: 'testid:login-submit' },
  { waitFor: 'testid:dashboard', hold: 600 },
]

export const flows = [
  {
    id: 'scan-nota',
    title: 'Fotografe a nota, a IA lança',
    // legenda do post (não é o texto na tela) — CTA de fato aprovado
    caption:
      'Cansado de digitar cada gasto? No Controle DinDin você fotografa a nota e a IA lança sozinha. 🐷\n\nTeste grátis 10 dias, sem cartão. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { caption: 'Seus gastos, no controle', hold: 1400 },
      { click: 'testid:nav-add', caption: 'Toca em adicionar', hold: 1000 },
      { click: 'testid:add-scan', caption: 'Fotografa a nota fiscal', hold: 1200 },
      { waitFor: 'testid:scan-processing', caption: 'A IA lê a nota…', hold: 1400 },
      { waitFor: 'testid:scan-result', caption: 'e lança sozinha ✨', hold: 1800 },
      { caption: 'Teste grátis 10 dias · sem cartão', hold: 2400 },
    ],
  },
  {
    id: 'meta',
    title: 'Meta com projeção automática',
    caption:
      'Defina uma meta e veja a projeção do seu saldo. Simples assim. 🐷\n\nTeste grátis 10 dias, sem cartão. Link na bio.\n\n#ControleDinDin',
    login,
    steps: [
      { goto: '/metas', caption: 'Cria uma meta', hold: 1400 },
      { click: 'testid:meta-nova', caption: 'Escolhe o objetivo', hold: 1200 },
      { waitFor: 'testid:meta-projecao', caption: 'com projeção automática de saldo', hold: 1800 },
      { caption: 'Teste grátis 10 dias · sem cartão', hold: 2400 },
    ],
  },
]

export function getFlow(id) {
  return flows.find((f) => f.id === id)
}
