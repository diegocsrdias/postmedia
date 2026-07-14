import html2canvas from 'html2canvas'

/** Baixa o nó do criativo como PNG (2x). */
export async function downloadPng(
  node: HTMLElement,
  idx: number,
  clientSlug: string = 'dindin',
): Promise<void> {
  const prev = node.style.transform
  node.style.transform = 'none'
  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    })
    node.style.transform = prev
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = clientSlug + '-criativo-' + (idx + 1) + '.png'
    a.click()
  } catch (err) {
    node.style.transform = prev
    throw err
  }
}

function wrap(c: CanvasRenderingContext2D, str: string, maxW: number): string[] {
  const words = str.split(/\s+/)
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const tt = cur ? cur + ' ' + w : w
    if (c.measureText(tt).width > maxW && cur) {
      out.push(cur)
      cur = w
    } else {
      cur = tt
    }
  }
  if (cur) out.push(cur)
  return out
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

/**
 * Gera um Reels de ~6s (1080×1920) a partir do nó do criativo:
 * Ken Burns + shimmer + legenda animada palavra a palavra. Baixa mp4/webm.
 */
export async function downloadReels(
  node: HTMLElement,
  idx: number,
  vcap: string,
  captionOn: boolean,
  clientSlug: string = 'dindin',
): Promise<void> {
  const prev = node.style.transform
  node.style.transform = 'none'
  let base: HTMLCanvasElement
  try {
    base = await html2canvas(node, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    })
  } finally {
    node.style.transform = prev
  }

  const W = 1080
  const H = 1920
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!

  const tryTypes = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ]
  let mime = ''
  for (const t of tryTypes) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) {
      mime = t
      break
    }
  }
  if (!mime) throw new Error('Navegador sem suporte a vídeo')
  const ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm'

  const stream = cv.captureStream(30)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []

  const done = new Promise<void>((resolve) => {
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data)
    }
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = clientSlug + '-reels-' + (idx + 1) + '.' + ext
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      resolve()
    }
  })

  const DUR = 6000
  const start = performance.now()
  rec.start()

  const cap = (vcap || '').trim()

  const draw = (now: number) => {
    const t = Math.min(1, (now - start) / DUR)
    ctx.clearRect(0, 0, W, H)
    // Ken Burns zoom 1.0 -> 1.07
    const zoom = 1 + 0.07 * t
    const dw = W * zoom
    const dh = H * zoom
    const dx = (W - dw) / 2
    const dy = (H - dh) * 0.35
    ctx.drawImage(base, dx, dy, dw, dh)
    // shimmer sweep (first 45%)
    if (t < 0.45) {
      const p = t / 0.45
      const cx = -0.4 + 1.8 * p
      const gx = cx * W
      const grd = ctx.createLinearGradient(gx - 220, 0, gx + 220, H)
      grd.addColorStop(0, 'rgba(255,255,255,0)')
      grd.addColorStop(0.5, 'rgba(224,238,133,0.28)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)
    }
    // animated caption band (word-by-word)
    if (captionOn && cap) {
      ctx.font = '800 60px Inter, sans-serif'
      const maxW = 880
      const revealP = Math.min(1, (now - start) / (DUR * 0.55))
      const allWords = cap.split(/\s+/)
      const shown = Math.max(1, Math.ceil(allWords.length * revealP))
      const text = allWords.slice(0, shown).join(' ')
      const lines = wrap(ctx, text, maxW)
      const lh = 78
      const padX = 42
      const padY = 30
      let bw = 0
      lines.forEach((l) => {
        bw = Math.max(bw, ctx.measureText(l).width)
      })
      bw = Math.min(maxW, bw) + padX * 2
      const bh = lines.length * lh + padY * 2
      const bx = (W - bw) / 2
      const by = 1500 - bh / 2
      ctx.fillStyle = 'rgba(20,20,43,0.85)'
      roundRect(ctx, bx, by, bw, bh, 22)
      ctx.fill()
      ctx.fillStyle = '#F6F2EA'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      lines.forEach((l, i) => {
        ctx.fillText(l, W / 2, by + padY + lh / 2 + i * lh)
      })
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    }
    // fade-in first 0.4s
    if (now - start < 400) {
      ctx.fillStyle = 'rgba(48,48,120,' + (1 - (now - start) / 400) + ')'
      ctx.fillRect(0, 0, W, H)
    }
    if (now - start < DUR) {
      requestAnimationFrame(draw)
    } else {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    }
  }
  requestAnimationFrame(draw)

  await done
}

/** Copia texto para a área de transferência, com fallback para execCommand. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* cai no fallback */
    }
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
