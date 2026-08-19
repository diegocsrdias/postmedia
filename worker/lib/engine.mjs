// Motor de gravação: dirige o app real (ex.: ControleDinDin) num viewport de
// celular com Playwright e grava o uso em vídeo. Tudo é declarativo — o roteiro
// (ver ../flows/) diz os passos por data-testid, então mudanças de CSS no app
// NÃO quebram a automação. Enquanto executa, marca a linha do tempo das legendas
// (quando cada frase deve aparecer), que o compose usa depois.
//
// Seletores aceitos nos passos:
//   'testid:foo' -> [data-testid="foo"]   (preferido — estável)
//   'css:.foo'   -> .foo
//   'text:Foo'   -> getByText('Foo')

import { chromium } from 'playwright'

function locator(page, s) {
  if (s.startsWith('testid:')) return page.locator(`[data-testid="${s.slice(7)}"]`).first()
  if (s.startsWith('css:')) return page.locator(s.slice(4)).first()
  if (s.startsWith('text:')) return page.getByText(s.slice(5)).first()
  return page.locator(s).first()
}

/** Substitui $VAR pelas variáveis de ambiente (para credenciais no roteiro). */
function interp(v) {
  return String(v ?? '').replace(/\$([A-Z0-9_]+)/g, (_, k) => process.env[k] ?? '')
}

/**
 * Grava um fluxo e devolve { videoPath, captions[], durationMs }.
 * `flow.login` (opcional) roda antes de `flow.steps`.
 */
export async function recordFlow(flow, { baseUrl, outDir }) {
  const base = baseUrl.replace(/\/$/, '')
  const browser = await chromium.launch()
  // O vídeo é gravado no MESMO tamanho do viewport — se divergir, o Playwright
  // desenha a página 1:1 no canto de um canvas maior e o resto fica cinza. O
  // deviceScaleFactor melhora a nitidez do render (downscale) sem mudar o canvas.
  const VW = 412
  const VH = 892
  const context = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: outDir, size: { width: VW, height: VH } },
  })
  const page = await context.newPage()

  const captions = []
  const t0 = Date.now()
  const mark = (text, holdMs) => {
    if (!text) return
    const start = (Date.now() - t0) / 1000
    captions.push({ text, start, end: start + (holdMs || 1500) / 1000 })
  }

  const runSteps = async (steps) => {
    for (const st of steps) {
      if (st.goto) await page.goto(base + st.goto, { waitUntil: 'domcontentloaded' })
      if (st.fill) await locator(page, st.fill).fill(interp(st.value))
      if (st.click) await locator(page, st.click).click()
      if (st.waitFor) await locator(page, st.waitFor).waitFor({ timeout: st.timeout || 15000 })
      mark(st.caption, st.hold)
      await page.waitForTimeout(st.hold || 600)
    }
  }

  try {
    if (flow.login) await runSteps(flow.login)
    await runSteps(flow.steps)
  } finally {
    // fechar o contexto finaliza o arquivo de vídeo
    await context.close()
    await browser.close()
  }

  const videoPath = await page.video().path()
  return { videoPath, captions, durationMs: Date.now() - t0 }
}
