# Gerador de Criativos · Controle DinDin

Ferramenta interna de marketing para gerar criativos (posts, stories e Reels)
para Instagram, Facebook e TikTok do app **Controle DinDin** — finanças
pessoais com IA (mascote porquinho 🐷).

Gera artes prontas a partir de um banco de conceitos, deixa você editar os
textos inline, copiar a legenda com hashtags e **baixar em PNG** ou como
**vídeo Reels de ~6s** (Ken Burns + legenda animada). Opcionalmente usa IA para
criar anúncios novos e fazer _newsjacking_ (amarrar um tema em alta à marca).

Este projeto foi **desempacotado** a partir do bundle offline original
(`gerador-criativos-offline.html`), que era um Artifact do Claude exportado em
HTML único. Agora é um app React + TypeScript editável e versionável.

## Stack

- [Vite](https://vite.dev/) + React 18 + TypeScript (front-end)
- **Vercel Functions** (`/api`, Node) como backend — a chave da OpenAI fica
  **só no servidor**, nunca no navegador
- [html2canvas](https://html2canvas.hertzen.com/) para exportar PNG/vídeo
- API da OpenAI: **texto** (Chat Completions) e **imagem** (`gpt-image-1`)

## Rodando localmente

```bash
npm install
npm run dev      # front-end em http://localhost:5173
```

> ℹ️ `npm run dev` sobe **só o front-end**. Sem backend, a geração por IA
> retorna erro (mas o app funciona 100% offline com o banco de conceitos fixos).
> Para testar a IA localmente, use `vercel dev` (abaixo).

Outros scripts:

```bash
npm run build    # typecheck (tsc) + build de produção em dist/
npm run preview  # serve o build de dist/
```

## IA — como funciona

O app tem duas partes de IA, ambas atendidas pelo backend em `/api`:

- **Texto** (`gpt-4o-mini`): headlines, legendas e hashtags — nos botões
  **"Gerar com esse tema"**, chips de tema e no filtro **📣 Anúncio**.
- **Imagem** (`gpt-image-1`): um **fundo gerado por IA** para os layouts de
  fundo escuro (`ad`, `statement`, `feature`), no bloco **🎨 Fundo por IA** de
  cada card. A imagem entra atrás do texto com um véu escuro para manter a
  legibilidade.

> **A "arte" continua sendo template HTML** (cores, mascote, screenshot). O
> texto vem da IA e, opcionalmente, um fundo de imagem por IA. Modelos de texto
> como `gpt-4o-mini` **não geram imagens** — por isso a imagem usa `gpt-image-1`.

Sem backend/chave, o app funciona **100% offline** com o banco de conceitos
fixos; só os recursos de IA ficam indisponíveis (mostram um toast de erro).

### Variáveis de ambiente (no servidor)

| Variável              | Padrão         | O que é                         |
| --------------------- | -------------- | ------------------------------- |
| `OPENAI_API_KEY`      | —              | **Obrigatória** para a IA       |
| `OPENAI_TEXT_MODEL`   | `gpt-4o-mini`  | Modelo de texto                 |
| `OPENAI_IMAGE_MODEL`  | `gpt-image-1`  | Modelo de imagem                |
| `VITE_API_BASE`       | `/api`         | (front, opcional) base da API   |

Modelos de texto alternativos: `gpt-4o` (copy mais criativa, mais caro).

## Deploy na Vercel

1. Faça o push do repo para o GitHub e importe o projeto na Vercel
   (framework detectado automaticamente: **Vite**).
2. Em **Settings → Environment Variables**, adicione:
   - `OPENAI_API_KEY` = sua chave
   - (opcional) `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`
3. Deploy. O front-end é servido estático e as funções em `api/*.js` viram
   endpoints serverless em `/api/...` no mesmo domínio.

A chave **nunca** vai ao navegador — todas as chamadas à OpenAI acontecem
dentro das funções. Ainda assim, use uma chave com **limite de gasto** definido
na OpenAI, já que qualquer visitante do site pode acionar a geração.

### Rodar o backend localmente

Duas opções (ambas leem o `.env` — preencha `OPENAI_API_KEY` primeiro):

```bash
# Opção A — sem login na Vercel (recomendado p/ dev):
npm run dev:api   # sobe Vite + /api juntos em http://localhost:3000

# Opção B — idêntico à produção, exige `vercel login`:
npm i -g vercel
vercel dev
```

`npm run dev:api` roda um pequeno servidor ([scripts/dev-local.mjs](scripts/dev-local.mjs))
que monta as **mesmas** funções de `api/*.js` em `/api`, então a IA funciona
igual à produção — sem precisar autenticar na Vercel.

## Estrutura

```
api/                   # backend — Vercel Functions (chave fica aqui, no servidor)
  _lib/
    openai.js          # chat(), image(), extractJsonArray, readJson, preflight
    prompts.js         # prompts de texto e imagem
  generate-ads.js      # POST /api/generate-ads
  generate-theme.js    # POST /api/generate-theme
  generate-image.js    # POST /api/generate-image
src/
  assets/              # logo, mascote e screenshot (extraídos do bundle original)
  data/bank.ts         # BANK de conceitos + rótulos, temas, estratégias, campos editáveis
  lib/
    creatives.ts       # shuffle, pool, pickFresh, instantiate, deriveVcap
    api.ts             # cliente do backend (generateAds/generateByTheme/generateImage)
    export.ts          # downloadPng, downloadReels, copyText
  components/
    CreativeCanvas.tsx # a "arte" 1080×1080/1920 (todos os layouts + fundo de IA)
    CreativeCard.tsx   # card: preview + edição + fundo por IA + botões
  App.tsx              # estado, toolbar, tema, estratégia e grid
  types.ts             # tipos compartilhados
```

## Layouts disponíveis

`ad` (anúncio), `statement` (frase de impacto), `list` (dicas numeradas),
`question` (engajamento), `feature` (recurso do app), `quote` (frase) e
`myth` (mito vs verdade). Os "ângulos" incluem também **anti-bet**
(posicionamento da marca contra apostas).

## Notas de exportação

- **Reels/vídeo** e a exportação PNG dependem do `html2canvas` e das APIs
  `MediaRecorder`/`canvas.captureStream` do navegador. Funcionam melhor em
  Chrome/Edge. O formato de saída de vídeo é `mp4` quando suportado, senão
  `webm`.
- **Fundos por IA** exportam junto no PNG/vídeo porque o `gpt-image-1` devolve
  a imagem em base64 (data URL), sem depender de CORS de host externo.
- O arquivo original `gerador-criativos-offline.html` foi mantido na raiz como
  referência do estado anterior.
