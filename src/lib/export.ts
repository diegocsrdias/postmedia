import html2canvas from 'html2canvas'

/**
 * Opções comuns do html2canvas. Tudo é ajustado NO CLONE, nunca no nó da
 * tela (senão o preview "estoura" pra 1080px enquanto a captura roda):
 * - reseta o `transform: scale()` do preview → captura em tamanho nativo;
 * - traz o palco fora da tela (`.export-stage`, onde ficam variantes como
 *   "sem foto IA") para 0,0, para a captura enxergá-lo como visível.
 */
const H2C_OPTS = {
  scale: 2,
  backgroundColor: null,
  useCORS: true,
  logging: false,
  onclone: (_doc: Document, el: HTMLElement) => {
    el.style.transform = 'none'
    const stage = el.closest<HTMLElement>('.export-stage')
    if (stage) stage.style.left = '0px'
  },
}

/** Renderiza o nó em canvas nativo (tamanho real, sem o scale do preview). */
function snapshot(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, H2C_OPTS)
}

/** Dispara o download de um Blob com o nome dado. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Renderiza o nó num canvas com fundo branco (base para JPEG). */
async function flatten(node: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await snapshot(node)
  // fundo branco: JPEG não tem transparência, senão o alpha vira preto
  const flat = document.createElement('canvas')
  flat.width = canvas.width
  flat.height = canvas.height
  const ctx = flat.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, flat.width, flat.height)
  ctx.drawImage(canvas, 0, 0)
  return flat
}

/** Captura o nó do criativo como data URL JPEG — leve, para enviar ao backend. */
export async function captureJpeg(node: HTMLElement, quality = 0.92): Promise<string> {
  return (await flatten(node)).toDataURL('image/jpeg', quality)
}

/** Baixa o criativo como PNG (para postar manualmente com áudio em alta). */
export async function downloadImage(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await snapshot(node)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG'))), 'image/png'),
  )
  saveBlob(blob, filename)
}

/** Captura o nó como Blob JPEG — para subir via URL assinada (carrossel). */
export async function captureJpegBlob(node: HTMLElement, quality = 0.92): Promise<Blob> {
  const flat = await flatten(node)
  return new Promise<Blob>((resolve, reject) =>
    flat.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar JPEG'))), 'image/jpeg', quality),
  )
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

/** Resultado da gravação: o vídeo e a extensão real (mp4 preferido). */
export interface RecordedVideo {
  blob: Blob
  ext: 'mp4' | 'webm'
}

/**
 * Adiciona uma faixa de áudio silenciosa ao stream. O Instagram aceita melhor
 * um Reels/Story de vídeo que tenha trilha de áudio (mesmo mudo) — sem ela, a
 * publicação às vezes é recusada. Devolve uma função de limpeza.
 */
function attachSilentAudio(stream: MediaStream): () => void {
  try {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ac = new AC()
    const dst = ac.createMediaStreamDestination()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    gain.gain.value = 0 // mudo
    osc.connect(gain).connect(dst)
    osc.start()
    for (const t of dst.stream.getAudioTracks()) stream.addTrack(t)
    return () => {
      try {
        osc.stop()
        void ac.close()
      } catch {
        /* noop */
      }
    }
  } catch {
    return () => {}
  }
}

/**
 * Grava um Reels (1080×1920) a partir de um ou mais slides:
 * Ken Burns + shimmer + legenda animada palavra a palavra. Devolve o Blob.
 *
 * - Um único slide → vídeo simples de `durationMs`.
 * - Vários slides → carrossel: o tempo total é dividido igualmente entre eles.
 *
 * O timing é cravado num relógio de parede real (setTimeout) — NÃO depende de
 * quantos frames o requestAnimationFrame entrega — por isso a duração final é
 * sempre a pedida (corrige o bug do vídeo que saía com ~metade do tempo quando
 * o navegador dava throttling no rAF).
 */
export async function recordReels(
  slides: ReelsSlide[],
  captionOn: boolean,
  durationMs: number,
): Promise<RecordedVideo> {
  // Captura cada slide em bitmap nativo (resetando o scale de preview).
  const bases: HTMLCanvasElement[] = []
  for (const s of slides) bases.push(await snapshot(s.node))
  if (!bases.length) throw new Error('Nada para gravar')

  const W = 1080
  const H = 1920
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!

  const tryTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
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
  const ext: 'mp4' | 'webm' = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm'

  const stream = cv.captureStream(30)
  const cleanupAudio = attachSilentAudio(stream)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []

  const done = new Promise<RecordedVideo>((resolve) => {
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data)
    }
    rec.onstop = () => {
      cleanupAudio()
      resolve({ blob: new Blob(chunks, { type: mime }), ext })
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
    return await done
  } finally {
    clearTimeout(timer)
  }
}
