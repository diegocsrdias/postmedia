// Render da arte no SERVIDOR com Chromium headless (piloto automático).
//
// Abre a rota /render.html (que monta um CreativeCanvas em tamanho real), injeta
// o criativo via window.__renderCreative, espera o sinal __renderReady (fontes +
// imagens carregadas) e tira o screenshot do nó [data-cap] em JPEG. Reusa a MESMA
// arte do preview do Estúdio, então o post automático sai idêntico ao manual.
//
// Depende de puppeteer-core + @sparticuz/chromium (leves o bastante para a Vercel).

import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

/** URL pública do próprio deploy (onde /render.html é servido). */
function baseUrl() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL
  return 'http://localhost:3000'
}

let _browser = null

async function getBrowser() {
  // puppeteer-core 25+ removeu isConnected() — agora é a propriedade `connected`
  if (_browser && _browser.connected) return _browser
  // CHROME_PATH permite testar localmente com um Chrome instalado.
  const executablePath = process.env.CHROME_PATH || (await chromium.executablePath())
  _browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
    defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 1 },
  })
  return _browser
}

/** Fecha a instância do Chromium (chamar ao fim do runner). */
export async function closeBrowser() {
  if (_browser) {
    try {
      await _browser.close()
    } catch {
      /* ignore */
    }
    _browser = null
  }
}

/**
 * Renderiza uma lista de criativos e devolve as imagens como data URLs (JPEG).
 * `payloads`: array de { clientId, square, creative }.
 */
export async function renderCreatives(payloads) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  const out = []
  try {
    for (const p of payloads) {
      const height = p.square ? 1080 : 1920
      await page.setViewport({ width: 1080, height, deviceScaleFactor: 1 })
      await page.goto(baseUrl() + '/render.html', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForFunction('window.__renderAppReady === true', { timeout: 15000 })
      await page.evaluate((pl) => window.__renderCreative(pl), p)
      await page.waitForFunction('window.__renderReady === true', { timeout: 25000 })
      const el = await page.$('[data-cap]')
      if (!el) throw new Error('nó [data-cap] não encontrado na página de render')
      const buf = await el.screenshot({ type: 'jpeg', quality: 92 })
      out.push('data:image/jpeg;base64,' + Buffer.from(buf).toString('base64'))
    }
    return out
  } finally {
    await page.close().catch(() => {})
  }
}
