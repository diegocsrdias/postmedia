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

/** Um slide do vídeo: o nó a capturar e a legenda animada daquele trecho. */
export interface ReelsSlide {
  node: HTMLElement
  vcap: string
}

/** Desenha um único slide no contexto, com Ken Burns + shimmer + legenda + fades.
 *  `p` é o progresso 0..1 DENTRO do slide; `first`/`last` controlam os fades
 *  de entrada/saída (para emendar slides sem piscar preto). */
function drawSlide(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  W: number,
  H: number,
  p: number,
  cap: string,
  captionOn: boolean,
  first: boolean,
  last: boolean,
): void {
  ctx.clearRect(0, 0, W, H)
  // Ken Burns zoom 1.0 -> 1.07
  const zoom = 1 + 0.07 * p
  const dw = W * zoom
  const dh = H * zoom
  const dx = (W - dw) / 2
  const dy = (H - dh) * 0.35
  ctx.drawImage(base, dx, dy, dw, dh)
  // shimmer sweep (first 45% of the slide)
  if (p < 0.45) {
    const sp = p / 0.45
    const cx = -0.4 + 1.8 * sp
    const gx = cx * W
    const grd = ctx.createLinearGradient(gx - 220, 0, gx + 220, H)
    grd.addColorStop(0, 'rgba(255,255,255,0)')
    grd.addColorStop(0.5, 'rgba(224,238,133,0.28)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  // animated caption band (word-by-word), revelada ao longo dos primeiros 55%
  if (captionOn && cap) {
    ctx.font = '800 60px Inter, sans-serif'
    const maxW = 880
    const revealP = Math.min(1, p / 0.55)
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
  // fade de entrada (primeiros 12% do slide) e de saída (últimos 12%)
  const fadeFrac = 0.12
  let veil = 0
  if (p < fadeFrac) veil = 1 - p / fadeFrac
  else if (!last && p > 1 - fadeFrac) veil = (p - (1 - fadeFrac)) / fadeFrac
  // o primeiro slide entra a partir do preto; os demais fazem crossfade suave
  if (veil > 0) {
    ctx.fillStyle = 'rgba(48,48,120,' + (first ? veil : veil * 0.9) + ')'
    ctx.fillRect(0, 0, W, H)
  }
}

/**
 * Gera um Reels (1080×1920) a partir de um ou mais slides:
 * Ken Burns + shimmer + legenda animada palavra a palavra. Baixa mp4/webm.
 *
 * - Um único slide → vídeo simples de `durationMs`.
 * - Vários slides → carrossel: o tempo total é dividido igualmente entre eles.
 *
 * O timing é cravado num relógio de parede real (setTimeout) — NÃO depende de
 * quantos frames o requestAnimationFrame entrega — por isso a duração final é
 * sempre a pedida (corrige o bug do vídeo que saía com ~metade do tempo quando
 * o navegador dava throttling no rAF).
 */
export async function downloadReels(
  slides: ReelsSlide[],
  idx: number,
  captionOn: boolean,
  durationMs: number,
  clientSlug: string = 'dindin',
): Promise<void> {
  // Captura cada slide em bitmap nativo (resetando o scale de preview).
  const bases: HTMLCanvasElement[] = []
  for (const s of slides) {
    const prev = s.node.style.transform
    s.node.style.transform = 'none'
    try {
      bases.push(
        await html2canvas(s.node, {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        }),
      )
    } finally {
      s.node.style.transform = prev
    }
  }
  if (!bases.length) throw new Error('Nada para gravar')

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

  const DUR = Math.max(1000, durationMs)
  const perSlide = DUR / bases.length
  const start = performance.now()
  // requestData a cada 250ms garante que os chunks cheguem mesmo em vídeos longos
  rec.start(250)

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    // desenha o último quadro cheio antes de parar
    const li = bases.length - 1
    drawSlide(ctx, bases[li], W, H, 1, slides[li].vcap.trim(), captionOn, li === 0, true)
    try {
      rec.stop()
    } catch {
      /* noop */
    }
  }

  const draw = () => {
    if (stopped) return
    const elapsed = performance.now() - start
    // índice do slide atual e progresso dentro dele
    let si = Math.floor(elapsed / perSlide)
    if (si >= bases.length) si = bases.length - 1
    const p = Math.min(1, (elapsed - si * perSlide) / perSlide)
    drawSlide(
      ctx,
      bases[si],
      W,
      H,
      p,
      slides[si].vcap.trim(),
      captionOn,
      si === 0,
      si === bases.length - 1,
    )
    requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)
  // A PARADA é cravada no relógio de parede — independe do rAF.
  const timer = setTimeout(stop, DUR)

  try {
    await done
  } finally {
    clearTimeout(timer)
  }
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
