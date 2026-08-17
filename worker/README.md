# Worker de vídeos de demonstração

Gera Reels/Stories a partir do **uso real** do app (ex.: ControleDinDin):
Playwright dirige o app num viewport de celular e grava → ffmpeg monta o 9:16
com legendas e CTA → publica reusando os endpoints do postmedia.

Roda no **GitHub Actions** (ver `.github/workflows/demo-reels.yml`), isolado do
app da Vercel. Não usa chave do Supabase — a publicação passa pelos endpoints
`/api/ig-upload-url` e `/api/ig-publish-video` que já existem.

## O que você precisa preparar

### 1. Conta DEMO com dados semeados (crítico)
Tudo que aparecer na tela vai pro **Reel público**. Use uma conta de demonstração
com dados **falsos e seguros** — nunca uma conta real (senão você publica saldo,
nome e transações de alguém).

### 2. `data-testid` no fonte do app
Os roteiros (`flows/dindin.mjs`) selecionam por `data-testid`, que **não quebra**
quando o CSS muda. Adicione estes no ControleDinDin (ajuste os nomes se quiser —
é só manter os dois lados iguais):

| testid | onde |
|---|---|
| `login-email` | campo de e-mail do login |
| `login-password` | campo de senha |
| `login-submit` | botão de entrar |
| `dashboard` | qualquer elemento estável da home logada |
| `nav-add` | botão de adicionar lançamento |
| `add-scan` | opção "escanear nota" |
| `scan-processing` | estado "a IA está lendo…" |
| `scan-result` | resultado do lançamento pronto |
| `meta-nova` | botão de nova meta |
| `meta-projecao` | bloco da projeção de saldo |

### 3. Segredos no GitHub (Settings → Secrets and variables → Actions)
Nunca coloque isso no código nem mande por chat:

| segredo | valor |
|---|---|
| `DINDIN_DEMO_URL` | base do app de demo (ex.: `https://demo.controledindin.com.br`) |
| `DINDIN_DEMO_EMAIL` | login da conta demo |
| `DINDIN_DEMO_PASSWORD` | senha da conta demo |
| `POSTMEDIA_BASE_URL` | base do postmedia (ex.: `https://postmedia.vercel.app`) |

## Como rodar

**No GitHub:** aba *Actions* → *demo-reels* → *Run workflow* → escolha o fluxo e
se quer publicar. Com `publish=false` ele só **gera** e anexa o mp4 como artefato
pra você conferir antes de postar.

**Local (pra depurar):** requer `ffmpeg` instalado e as env vars setadas.
```bash
cd worker
npm install && npx playwright install chromium
node record-demo.mjs --flow scan-nota            # só gera (out/)
node record-demo.mjs --flow scan-nota --publish  # gera e publica
```

## Adicionar um fluxo novo
Edite `flows/dindin.mjs`: um objeto `{ id, title, caption, login, steps }`.
Cada passo é declarativo — `goto`, `click`, `fill`, `waitFor`, `caption`, `hold`.
Legendas só com **fatos aprovados** (sem número/claim inventado na tela).
