// Motor de gravação: dirige o app real (ex.: ControleDinDin) num viewport de
// celular com Playwright e grava o uso em vídeo. Tudo é declarativo — o roteiro
// (ver ../flows/) diz os passos por data-testid, então mudanças de CSS no app
// NÃO quebram a automação. Enquanto executa, marca a linha do tempo das legendas
// (quando cada frase deve aparecer), que o compose usa depois.
//
// Para NÃO parecer um robô/RPA, cada interação é "humana": um cursor desliza até
// o alvo, um efeito de toque (ripple) aparece onde se clica, o texto é digitado
// letra por letra e há pausas pra respirar entre os passos.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Cursor + ripple injetados na página. Roda a cada navegação (document start);
// cria o elemento no DOMContentLoaded e expõe funções pra Node dirigir.
const CURSOR_SCRIPT = `
(() => {
  if (window.__demoReady) return;
  window.__demoReady = true;
  const build = () => {
    if (!document.body || document.getElementById('__demoCursor')) return;
    const c = document.createElement('div');
    c.id = '__demoCursor';
    Object.assign(c.style, {
      position:'fixed', left:'50%', top:'55%', width:'36px', height:'36px',
      marginLeft:'-18px', marginTop:'-18px', borderRadius:'50%',
      background:'rgba(40,40,70,0.28)', border:'2px solid rgba(255,255,255,0.95)',
      boxShadow:'0 3px 10px rgba(0,0,0,0.35)', zIndex:'2147483647', pointerEvents:'none',
      transition:'left .55s cubic-bezier(.22,.61,.36,1), top .55s cubic-bezier(.22,.61,.36,1)'
    });
    document.body.appendChild(c);
  };
  window.__demoMove = (x,y) => { build(); const c=document.getElementById('__demoCursor'); if(c){c.style.left=x+'px'; c.style.top=y+'px';} };
  window.__demoTap = (x,y) => {
    build();
    const r = document.createElement('div');
    Object.assign(r.style, {
      position:'fixed', left:x+'px', top:y+'px', width:'12px', height:'12px',
      marginLeft:'-6px', marginTop:'-6px', borderRadius:'50%',
      border:'3px solid rgba(120,120,255,0.95)', background:'rgba(120,120,255,0.15)',
      zIndex:'2147483646', pointerEvents:'none', opacity:'0.95',
      transition:'all .55s ease-out'
    });
    document.body.appendChild(r);
    requestAnimationFrame(() => {
      r.style.width='80px'; r.style.height='80px'; r.style.marginLeft='-40px'; r.style.marginTop='-40px'; r.style.opacity='0';
    });
    setTimeout(() => r.remove(), 650);
    const c=document.getElementById('__demoCursor');
    if (c) c.animate([{transform:'scale(1)'},{transform:'scale(0.82)'},{transform:'scale(1)'}], {duration:260});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
`

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
  await context.addInitScript(CURSOR_SCRIPT)
  const page = await context.newPage()

  const captions = []
  const t0 = Date.now()
  const mark = (text, holdMs) => {
    if (!text) return
    const start = (Date.now() - t0) / 1000
    captions.push({ text, start, end: start + (holdMs || 1500) / 1000 })
  }

  // Garante o cursor após navegações e o desliza até o centro do alvo.
  const ensureCursor = () => page.evaluate(() => window.__demoMove && window.__demoMove(innerWidth / 2, innerHeight * 0.55)).catch(() => {})
  const glideTo = async (loc) => {
    await loc.scrollIntoViewIfNeeded().catch(() => {})
    await sleep(250)
    const box = await loc.boundingBox()
    if (!box) return null
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + box.height / 2)
    await page.evaluate(([x, y]) => window.__demoMove && window.__demoMove(x, y), [x, y])
    await sleep(650) // tempo do cursor viajar (a transição CSS é .55s)
    await page.evaluate(([x, y]) => window.__demoTap && window.__demoTap(x, y), [x, y])
    await sleep(220)
    return { x, y }
  }

  const runSteps = async (steps) => {
    for (const st of steps) {
      if (st.goto) {
        // retry leve: a home às vezes demora a responder (cold start / rede)
        let ok = false
        for (let i = 0; i < 3 && !ok; i++) {
          try {
            await page.goto(base + st.goto, { waitUntil: 'domcontentloaded', timeout: 45000 })
            ok = true
          } catch (err) {
            if (i === 2) throw err
            await sleep(1500)
          }
        }
        await sleep(700) // deixa a tela assentar (SPA hidratar/animar)
        await ensureCursor()
      }
      if (st.waitFor) await locator(page, st.waitFor).waitFor({ timeout: st.timeout || 15000 })
      if (st.fill) {
        const loc = locator(page, st.fill)
        await glideTo(loc)
        await loc.click()
        await loc.fill('')
        await loc.pressSequentially(interp(st.value), { delay: 90 }) // digita como gente
        await sleep(400)
      }
      if (st.click) {
        const loc = locator(page, st.click)
        await glideTo(loc)
        await loc.click()
        await sleep(500)
      }
      mark(st.caption, st.hold)
      await sleep(st.hold || 900)
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
