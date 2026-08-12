/**
 * Rota de RENDER — usada pelo Chromium headless do agendador (api/_lib/render.js)
 * para fotografar a arte em tamanho real, sem nenhuma UI ao redor.
 *
 * Não recebe dados pela URL (evita limite de tamanho com bgImage em data URL):
 * o render.js chama `window.__renderCreative(payload)` via page.evaluate. Quando
 * fontes + imagens terminam de carregar, marcamos `window.__renderReady = true`
 * e o Chromium tira o screenshot do nó [data-cap].
 */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CreativeCanvas } from '../components/CreativeCanvas'
import { getClient } from '../clients'
import type { Creative } from '../types'
import '../index.css'

interface RenderPayload {
  clientId: string
  square: boolean
  creative: Creative
}

declare global {
  interface Window {
    __renderCreative?: (p: RenderPayload) => void
    __renderAppReady?: boolean
    __renderReady?: boolean
  }
}

function RenderApp() {
  const [payload, setPayload] = useState<RenderPayload | null>(null)

  // expõe a função que o render.js chama e sinaliza que o app montou
  useEffect(() => {
    window.__renderCreative = (p: RenderPayload) => {
      window.__renderReady = false
      setPayload(p)
    }
    window.__renderAppReady = true
    return () => {
      delete window.__renderCreative
    }
  }, [])

  // quando o criativo renderiza, espera fontes+imagens e libera o screenshot
  useEffect(() => {
    if (!payload) return
    let cancelled = false
    ;(async () => {
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready
      } catch {
        /* ignore */
      }
      const root = document.querySelector('[data-cap]')
      const imgs = root ? Array.from(root.querySelectorAll('img')) : []
      await Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((r) => {
                  img.onload = () => r()
                  img.onerror = () => r()
                }),
        ),
      )
      // dois frames + um respiro para o layout/decodificação assentarem
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      await new Promise<void>((r) => setTimeout(r, 150))
      if (!cancelled) window.__renderReady = true
    })()
    return () => {
      cancelled = true
    }
  }, [payload])

  if (!payload) return null
  const client = getClient(payload.clientId)
  const innerW = 1080
  const innerH = payload.square ? 1080 : 1920
  return (
    <div style={{ width: innerW, height: innerH, background: '#fff' }}>
      <CreativeCanvas
        c={payload.creative}
        idx={0}
        square={payload.square}
        scaleStr="1"
        innerW={innerW}
        innerH={innerH}
        client={client}
      />
    </div>
  )
}

createRoot(document.getElementById('render-root')!).render(
  <StrictMode>
    <RenderApp />
  </StrictMode>,
)
