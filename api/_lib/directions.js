// Direcionamentos criativos sorteados a cada leva de geração. Servem pra IA não
// convergir sempre no mesmo tipo de texto. Estes são os PUBLICITÁRIOS (padrão);
// clientes editoriais definem os seus em `client.directions`.
export const DIRECTIONS = [
  'foque numa dor concreta e cotidiana do público',
  'traga um benefício específico e mensurável',
  'comece com uma pergunta provocativa',
  'quebre um mito comum sobre o tema',
  'conte um micro-cenário do dia a dia',
  'use um contraste antes/depois',
  'traga um dado ou número que surpreenda',
  'fale direto com quem está adiando resolver isso',
  'destaque um recurso pouco óbvio da marca',
  'use humor leve e uma pitada de exagero',
  'aposte numa frase de efeito curta e memorável',
  'responda a uma objeção típica de quem hesita',
  'mostre o custo de NÃO agir',
  'celebre uma pequena vitória do público',
]

/** Sorteia `k` direcionamentos distintos do repertório do cliente. */
export function sampleDirections(k, client) {
  const source = (client && client.directions) || DIRECTIONS
  const out = []
  const pool = source.slice()
  for (let i = 0; i < k && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}
