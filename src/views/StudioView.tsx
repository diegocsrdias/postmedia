import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreativeCard, plainCapId } from '../components/CreativeCard'
import type { DownloadKind, DownloadVariant } from '../components/CreativeCard'
import type { ClientConfig } from '../clients'
import { ANGLE_LABELS, ANGLE_ORDER } from '../data/shared'
import {
  generateAds,
  generateByTheme,
  generateImage,
  generateMix,
  logCreative,
  publishCarousel,
  publishToInstagram,
  publishVideoToInstagram,
  suggestThemes,
  uploadFile,
} from '../lib/api'
import type { StoryTarget } from '../lib/api'
import type { ThemeChip } from '../data/shared'
import { pickFresh, postTextOf } from '../lib/creatives'
import { captureJpeg, captureJpegBlob, downloadImage, recordReels, saveBlob } from '../lib/export'
import type { Creative, CreativeFields, Filter, Format } from '../types'
import type { ImageMode } from '../lib/api'
import {
  Button,
  Dropdown,
  EmptyState,
  Field,
  MenuItem,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Spinner,
  Toast,
  useToast,
} from '../ui/components'
import { Icon } from '../ui/icons'
import { UI } from '../ui/theme'

/** Converte um erro de chamada de IA numa mensagem curta para o toast. */
function aiError(err: unknown): string {
  const msg = String((err as Error)?.message || err || '')
  if (/OPENAI_API_KEY|401|api key/i.test(msg)) {
    return 'IA sem chave no servidor — configure OPENAI_API_KEY'
  }
  return 'A IA tropeçou — tente de novo'
}

const errMsg = (err: unknown) => 'Falhou: ' + String((err as Error)?.message || err)
const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Opção do seletor de formato (a UI unifica feed/carrossel/story num só lugar). */
type FormatChoice = 'feed' | 'carousel' | 'story'

/** O que está sendo gerado: a leva inteira ou só um card (índice). */
type LoadingTarget = 'all' | number | null

export function StudioView({ client }: { client: ClientConfig }) {
  const [format, setFormat] = useState<Format>('square')
  const [filter, setFilter] = useState<Filter>('all')
  // gera sempre 1 criativo por vez
  const count = 1
  const [theme, setTheme] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [loadingTarget, setLoadingTarget] = useState<LoadingTarget>(null)
  const [busyCardIdx, setBusyCardIdx] = useState<number | null>(null)
  const [postingIdx, setPostingIdx] = useState<number | null>(null)
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null)
  const [carouselMode, setCarouselMode] = useState(false)
  const [carouselPosting, setCarouselPosting] = useState(false)
  const [carouselDownloading, setCarouselDownloading] = useState(false)
  const [slides, setSlides] = useState(3) // nº de telas quando o formato é carrossel
  // abre sem nada: o usuário gera com IA (ou um tema) quando quiser
  const [creatives, setCreatives] = useState<Creative[]>([])
  const { toast, flash } = useToast()
  const promptRef = useRef<HTMLInputElement>(null)

  // "Em alta": sugestões de tema geradas por IA (cientes da data e da
  // marca). Começa com a lista do cliente como fallback e busca as da IA no
  // load. Cache por dia (sessionStorage) pra não refazer a chamada a cada visita.
  const [themes, setThemes] = useState<ThemeChip[]>(() => client.themes)
  const [themesLoading, setThemesLoading] = useState(false)

  const loadThemes = useCallback(
    async (force = false) => {
      const key = 'themes:' + client.id + ':' + new Date().toISOString().slice(0, 10)
      if (!force && typeof sessionStorage !== 'undefined') {
        const cached = sessionStorage.getItem(key)
        if (cached) {
          try {
            const arr = JSON.parse(cached) as ThemeChip[]
            if (arr.length) {
              setThemes(arr)
              return
            }
          } catch {
            /* cache inválido: segue e busca de novo */
          }
        }
      }
      setThemesLoading(true)
      try {
        const items = await suggestThemes(client.id)
        if (items.length) {
          setThemes(items)
          if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, JSON.stringify(items))
        }
      } finally {
        setThemesLoading(false)
      }
    },
    [client.id],
  )

  // troca de cliente: volta pro fallback e busca as sugestões daquele cliente
  useEffect(() => {
    setThemes(client.themes)
    void loadThemes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadThemes])

  const availableAngles = useMemo(() => {
    const angleSet = new Set(client.bank.map((item) => item.angle))
    return ANGLE_ORDER.filter((angle) => angle !== 'anuncio' && angleSet.has(angle))
  }, [client])

  // largura da viewport — usada para dimensionar o preview no mobile
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const square = format === 'square'
  const locked = generating || carouselPosting || carouselDownloading

  // ----- formato (Feed / Carrossel / Story num só seletor) -----
  // O carrossel é um formato como os outros, não um botão à parte: internamente
  // ele é "quadrado + modo carrossel". `formatChoice` traduz o estado interno
  // (format + carouselMode) no valor do seletor, e `pickFormat` faz o inverso.
  const formatChoice: FormatChoice = carouselMode ? 'carousel' : format === 'story' ? 'story' : 'feed'
  const pickFormat = (choice: FormatChoice) => {
    if (locked) return
    const wantCarousel = choice === 'carousel'
    // trocar de/para carrossel limpa a grade (as telas eram uma unidade)
    if (wantCarousel !== carouselMode) setCreatives([])
    setCarouselMode(wantCarousel)
    setFormat(choice === 'story' ? 'story' : 'square')
  }

  // ----- geração -----
  const startLoading = (msg: string, target: LoadingTarget) => {
    setGenerating(true)
    setLoadingMsg(msg)
    setLoadingTarget(target)
  }
  const stopLoading = () => {
    setGenerating(false)
    setLoadingMsg('')
    setLoadingTarget(null)
  }

  /** Botão principal: com tema escrito gera sobre o tema; sem tema, gera livre. */
  const generate = () => {
    if (locked) return
    const t = theme.trim()
    if (t) {
      void runTheme(t)
      return
    }
    if (carouselMode) {
      void doGenerateCarousel(slides)
      return
    }
    if (filter === 'anuncio') {
      void generateAdsAI(count, null)
      return
    }
    if (filter === 'all') {
      void generateMixAI(count, null)
      return
    }
    setCreatives(pickFresh(client.bank, count, filter, []))
  }

  // Concatena textos já na tela pra IA não repetir na próxima leva.
  function existingText(): string {
    return creatives
      .map((c) => postTextOf(c))
      .join(' | ')
      .slice(0, 1200)
  }

  async function generateMixAI(n: number, replaceIdx: number | null) {
    if (generating) return
    startLoading(replaceIdx == null ? 'Escrevendo um post original…' : 'Escrevendo um novo criativo…', replaceIdx ?? 'all')
    try {
      let fresh = await generateMix(n, existingText(), client.id)
      if (replaceIdx == null && fresh.length < n) {
        const usedKeys = fresh.map((c) => c._key)
        const fill = pickFresh(client.bank, n - fresh.length, 'all', usedKeys)
        fresh = fresh.concat(fill).slice(0, n)
      }
      setCreatives((prev) => {
        if (replaceIdx != null) {
          const a = prev.slice()
          a[replaceIdx] = fresh[0]
          return a
        }
        return fresh
      })
      flash(replaceIdx == null ? 'Criativo novo pronto' : 'Criativo trocado')
    } catch (err) {
      const used = replaceIdx == null ? [] : creatives.map((c) => c._key)
      const fresh = pickFresh(client.bank, n, 'all', used)
      if (fresh.length) {
        setCreatives((prev) => {
          if (replaceIdx != null && fresh[0]) {
            const a = prev.slice()
            a[replaceIdx] = fresh[0]
            return a
          }
          return fresh
        })
      }
      flash(aiError(err))
    } finally {
      stopLoading()
    }
  }

  async function generateAdsAI(n: number, replaceIdx: number | null) {
    if (generating) return
    startLoading(replaceIdx == null ? 'Escrevendo um anúncio…' : 'Escrevendo um novo anúncio…', replaceIdx ?? 'all')
    const existing = creatives
      .filter((c) => c.layout === 'ad')
      .map((c) => c.f.headline + ' ' + c.f.highlight)
      .join(' | ')
    try {
      const fresh = await generateAds(n, existing, client.id)
      setCreatives((prev) => {
        if (replaceIdx != null) {
          const a = prev.slice()
          a[replaceIdx] = fresh[0]
          return a
        }
        return fresh
      })
      flash(replaceIdx == null ? 'Anúncio novo pronto' : 'Anúncio trocado')
    } catch (err) {
      flash(aiError(err))
    } finally {
      stopLoading()
    }
  }

  async function runTheme(t: string) {
    if (generating) return
    const n = carouselMode ? slides : count
    startLoading(
      carouselMode ? 'Criando ' + n + ' telas sobre "' + t + '"…' : 'Criando um post sobre "' + t + '"…',
      'all',
    )
    try {
      const fresh = await generateByTheme(n, t, client.id)
      setCreatives(fresh)
      if (carouselMode) setFormat('square')
      flash('Pronto: ' + (carouselMode ? fresh.length + ' telas' : 'criativo') + ' sobre "' + t + '"')
    } catch (err) {
      flash(aiError(err))
    } finally {
      stopLoading()
    }
  }

  const useChip = (t: string) => {
    if (locked) return
    setTheme(t)
    void runTheme(t)
  }

  // troca de cliente: reinicia a grade de acordo com o filtro atual
  useEffect(() => {
    const angleSet = new Set(client.bank.map((item) => item.angle))
    if (filter !== 'all' && filter !== 'anuncio' && !angleSet.has(filter)) {
      setFilter('all')
      setCreatives([])
      return
    }
    if (filter === 'anuncio') {
      void generateAdsAI(count, null)
      return
    }
    // "Todos os ângulos" abre vazio; um ângulo específico mostra o banco daquele tema
    setCreatives(filter === 'all' ? [] : pickFresh(client.bank, count, filter, []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id])

  const regenerateOne = (idx: number) => {
    const cur = creatives[idx]
    if (cur && cur.layout === 'ad') {
      void generateAdsAI(1, idx)
      return
    }
    if (filter === 'all' || carouselMode) {
      void generateMixAI(1, idx)
      return
    }
    const used = creatives.map((c) => c._key)
    const fresh = pickFresh(client.bank, 1, filter, used)[0]
    if (!fresh || fresh._key === cur._key) {
      flash('Só existe este modelo nesse ângulo por enquanto')
      return
    }
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = fresh
      return a
    })
  }

  // ----- edição -----
  const editField = (idx: number, key: keyof CreativeFields, val: string) =>
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = { ...a[idx], f: { ...a[idx].f, [key]: val } }
      return a
    })
  const editCaption = (idx: number, val: string) =>
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = { ...a[idx], caption: val }
      return a
    })
  const editHashtags = (idx: number, val: string) =>
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = { ...a[idx], hashtags: val }
      return a
    })

  // ----- ações -----
  const fullCaption = (c: Creative) => (c.caption + (c.hashtags ? '\n\n' + c.hashtags : '')).trim()

  const doGenerateCarousel = async (n = 3) => {
    if (generating || carouselPosting) return
    setFormat('square')
    startLoading('Criando ' + n + ' telas para o carrossel…', 'all')
    try {
      let fresh = await generateMix(n, existingText(), client.id)
      if (fresh.length < n) {
        const fill = pickFresh(client.bank, n - fresh.length, 'all', fresh.map((s) => s._key))
        fresh = fresh.concat(fill).slice(0, n)
      }
      setCreatives(fresh.slice(0, n))
      setCarouselMode(true)
      flash('Carrossel de ' + n + ' telas pronto')
    } catch (err) {
      flash(aiError(err))
    } finally {
      stopLoading()
    }
  }

  const doPublishCarousel = async () => {
    if (carouselPosting) return
    const n = creatives.length
    if (n < 2) {
      flash('Carrossel precisa de ao menos 2 telas')
      return
    }
    setCarouselPosting(true)
    flash('Publicando carrossel…')
    try {
      const paths: string[] = []
      for (let i = 0; i < n; i++) {
        const node = capNode(String(i))
        if (!node) throw new Error('A tela ' + (i + 1) + ' não carregou')
        const blob = await captureJpegBlob(node)
        paths.push(await uploadFile(blob, client.id, 'jpg'))
      }
      const first = creatives[0]
      await publishCarousel(paths, fullCaption(first), metaOf(first, 'feed'))
      flash('Carrossel publicado no Instagram')
    } catch (err) {
      flash(errMsg(err))
    } finally {
      setCarouselPosting(false)
    }
  }

  /** Dados do criativo guardados no banco (o "DNA" para o aprendizado). */
  const metaOf = (c: Creative, fmt: 'feed' | 'story') => ({
    client: client.id,
    format: fmt,
    layout: c.layout,
    angle: c.angle,
    headline: c.f.headline || c.f.title || c.f.line1 || '',
    caption: c.caption,
    hashtags: c.hashtags,
    fields: c.f,
  })

  /** Nó capturável: o preview (`"0"`, `"1"`…) ou a variante sem foto (`plain-N`). */
  const capNode = (id: string) => document.querySelector<HTMLElement>('[data-cap="' + id + '"]')

  /** Nó da versão pedida. Sem foto IA no card, as duas versões são o próprio preview. */
  const nodeFor = (idx: number, variant: 'ai' | 'plain') =>
    capNode(variant === 'plain' && creatives[idx]?.bgImage ? plainCapId(idx) : String(idx))

  const doPublish = async (idx: number) => {
    if (postingIdx !== null) return
    const node = capNode(String(idx))
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    setPostingIdx(idx)
    flash('Publicando no Instagram…')
    try {
      const c = creatives[idx]
      const jpeg = await captureJpeg(node)
      await publishToInstagram(jpeg, fullCaption(c), metaOf(c, 'feed'))
      flash('Publicado no Instagram')
    } catch (err) {
      flash(errMsg(err))
    } finally {
      setPostingIdx(null)
    }
  }

  /** Nome do arquivo baixado, com a versão (com/sem foto da OpenAI) no nome. */
  const fileName = (idx: number, variant: 'ai' | 'plain', ext: string) => {
    const kind = carouselMode ? 'carrossel-tela' : square ? 'feed' : 'story'
    const suffix = creatives[idx]?.bgImage ? (variant === 'ai' ? '-com-foto-ia' : '-sem-foto-ia') : ''
    return client.id + '-' + kind + '-' + (idx + 1) + suffix + '.' + ext
  }

  /**
   * Baixa a imagem (PNG) ou o vídeo de um card, na versão pedida:
   * com a foto da OpenAI (igual ao preview), sem ela (layout puro da marca)
   * ou as duas. Registra no histórico como "baixado".
   */
  const doDownload = async (idx: number, kind: DownloadKind, variant: DownloadVariant) => {
    if (downloadingIdx !== null || postingIdx !== null) return
    const variants: ('ai' | 'plain')[] = variant === 'both' ? ['ai', 'plain'] : [variant]
    setDownloadingIdx(idx)
    try {
      if (kind === 'image') {
        flash(variants.length > 1 ? 'Gerando as duas imagens…' : 'Gerando imagem…')
        for (const v of variants) {
          const node = nodeFor(idx, v)
          if (!node) throw new Error('A arte ainda não carregou')
          await downloadImage(node, fileName(idx, v, 'png'))
          if (variants.length > 1) await pause(350)
        }
        flash(variants.length > 1 ? 'As duas imagens foram baixadas' : 'Imagem baixada')
        void logDownload(idx, nodeFor(idx, variants[0]))
      } else {
        const v = variants[0]
        const node = nodeFor(idx, v)
        if (!node) throw new Error('A arte ainda não carregou')
        flash('Gravando vídeo (~6s)…')
        const { blob, ext } = await recordReels([{ node, vcap: '' }], false, 6000)
        saveBlob(blob, fileName(idx, v, ext))
        flash('Vídeo baixado — poste no app e escolha o áudio')
        void logDownloadBlob(idx, blob, ext, 'video')
      }
    } catch (err) {
      flash(errMsg(err))
    } finally {
      setDownloadingIdx(null)
    }
  }

  /** Baixa todas as telas do carrossel na versão pedida. */
  const doDownloadCarousel = async (variant: DownloadVariant) => {
    if (carouselDownloading || !creatives.length) return
    const variants: ('ai' | 'plain')[] = variant === 'both' ? ['ai', 'plain'] : [variant]
    setCarouselDownloading(true)
    try {
      let files = 0
      for (let i = 0; i < creatives.length; i++) {
        // tela sem foto IA: as duas versões são iguais — baixa uma só
        const vs = creatives[i].bgImage ? variants : variants.slice(0, 1)
        for (const v of vs) {
          flash('Baixando tela ' + (i + 1) + ' de ' + creatives.length + '…')
          const node = nodeFor(i, v)
          if (!node) throw new Error('A tela ' + (i + 1) + ' não carregou')
          await downloadImage(node, fileName(i, v, 'png'))
          files++
          await pause(350)
        }
      }
      flash(files + ' imagens baixadas')
      void logDownload(0, nodeFor(0, variants[0]))
    } catch (err) {
      flash(errMsg(err))
    } finally {
      setCarouselDownloading(false)
    }
  }

  /** Sobe a imagem do card ao bucket e registra como "baixado" no histórico. */
  async function logDownload(idx: number, node: HTMLElement | null) {
    try {
      if (!node) return
      const blob = await captureJpegBlob(node)
      const path = await uploadFile(blob, client.id, 'jpg')
      await logCreative(path, metaOf(creatives[idx], format === 'story' ? 'story' : 'feed'), 'image')
    } catch {
      /* histórico é best-effort; não atrapalha o download */
    }
  }

  /** Registra um blob de mídia (ex.: vídeo) já gravado como "baixado". */
  async function logDownloadBlob(idx: number, blob: Blob, ext: string, kind: 'image' | 'video') {
    try {
      const path = await uploadFile(blob, client.id, ext)
      await logCreative(path, metaOf(creatives[idx], 'story'), kind)
    } catch {
      /* best-effort */
    }
  }

  const doPublishStory = async (idx: number, targets: StoryTarget[], trial = false) => {
    if (postingIdx !== null) return
    const node = capNode(String(idx))
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    const label = trial
      ? 'Trial Reels'
      : targets.length > 1
        ? 'Story + Reels'
        : targets[0] === 'reels'
          ? 'Reels'
          : 'Story'
    setPostingIdx(idx)
    flash('Gravando e publicando (' + label + ')…')
    try {
      const cover = targets.includes('reels') ? await captureJpeg(node) : undefined
      const { blob, ext } = await recordReels([{ node, vcap: '' }], false, 6000)
      if (ext === 'webm') {
        throw new Error(
          'Seu navegador gravou o vídeo em WebM, que o Instagram não aceita. ' +
            'Use o Chrome/Edge atualizado (que grava em MP4).',
        )
      }
      const path = await uploadFile(blob, client.id, ext)
      const { results } = await publishVideoToInstagram(
        path,
        targets,
        fullCaption(creatives[idx]),
        metaOf(creatives[idx], 'story'),
        { coverBase64: cover, trial },
      )
      const failed = results.filter((r) => r.error)
      if (!failed.length) {
        flash('Publicado no ' + label)
      } else if (failed.length < results.length) {
        const okTarget = results.find((r) => !r.error)?.target
        flash('Publicado só no ' + (okTarget === 'reels' ? 'Reels' : 'Story') + '. ' + failed[0].error)
      } else {
        flash('Falhou: ' + failed[0].error)
      }
    } catch (err) {
      flash(errMsg(err))
    } finally {
      setPostingIdx(null)
    }
  }

  const genImage = async (idx: number, mode: ImageMode = 'editorial') => {
    if (generating) return
    setGenerating(true)
    setBusyCardIdx(idx)
    try {
      const cur = creatives[idx]
      const postText = postTextOf(cur)
      const { image: img, idea } = await generateImage(postText, format, client.id, mode)
      setCreatives((prev) => {
        const a = prev.slice()
        a[idx] = { ...a[idx], bgImage: img, bgPrompt: idea }
        return a
      })
      flash(mode === 'promo' ? 'Imagem de propaganda aplicada' : 'Foto aplicada')
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
      setBusyCardIdx(null)
    }
  }

  const clearImage = (idx: number) =>
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = { ...a[idx], bgImage: undefined }
      return a
    })

  // ----- métricas de layout -----
  const innerW = 1080
  const innerH = square ? 1080 : 1920
  const preferredFrameW = square ? 400 : 320
  const maxFrameW = Math.max(220, Math.min(preferredFrameW, vw - (16 + 18) * 2))
  const frameW = maxFrameW
  const scale = frameW / innerW
  const frameH = Math.round(innerH * scale)
  const scaleStr = scale.toFixed(4)

  const hasTheme = theme.trim().length > 0
  const genLabel = hasTheme
    ? carouselMode
      ? 'Gerar carrossel sobre o tema'
      : 'Gerar sobre o tema'
    : carouselMode
      ? 'Gerar carrossel'
      : 'Gerar com IA'
  const anyAI = creatives.some((c) => c.bgImage)
  const showSkeleton = generating && loadingTarget === 'all'

  return (
    <div className="app-container app-pad" style={{ paddingTop: 28, paddingBottom: 96 }}>
      <SectionHeader
        title="Estúdio"
        subtitle={
          <>
            Escreva um tema ou deixe a IA escolher. Ela cria o post de {client.name} e você publica no
            Instagram ou baixa, com ou sem a foto da OpenAI.
          </>
        }
      />

      {/* ===== painel de criação ===== */}
      <section className="composer" aria-label="Criar criativo">
        <div className="composer-prompt">
          <Icon name="sparkles" size={20} style={{ color: 'var(--accent-hover)' }} />
          <input
            ref={promptRef}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder={
              vw < 640 ? 'Tema (opcional)' : 'Sobre o que é o post? Ex.: Copa do Mundo, alta do dólar… (opcional)'
            }
            aria-label="Tema do post (opcional)"
            disabled={locked}
          />
          {hasTheme && !generating && (
            <button
              className="icon-btn"
              onClick={() => {
                setTheme('')
                promptRef.current?.focus()
              }}
              title="Limpar tema"
              aria-label="Limpar tema"
              style={{ border: 'none', background: 'transparent' }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
          <Button
            size="lg"
            icon={carouselMode ? 'layers' : 'wand'}
            loading={generating && loadingTarget !== null}
            disabled={locked}
            onClick={generate}
            style={{ flex: 'none' }}
          >
            <span className="hide-mobile">{generating && loadingTarget !== null ? 'Criando…' : genLabel}</span>
            <span className="show-mobile" style={{ display: 'none' }}>
              {generating && loadingTarget !== null ? 'Criando…' : 'Gerar'}
            </span>
          </Button>
        </div>

        <div className="composer-chips">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: UI.inkMuted2, flex: 'none' }}>
            <Icon name="flame" size={14} style={{ color: 'var(--warn)' }} />
            Em alta
          </span>
          {themes.map((chip) => (
            <button
              key={chip.theme}
              className={'chip' + (theme === chip.theme ? ' on' : '')}
              onClick={() => useChip(chip.theme)}
              disabled={locked}
              title={'Gerar sobre: ' + chip.theme}
            >
              {chip.label}
            </button>
          ))}
          <button
            className="chip"
            onClick={() => void loadThemes(true)}
            disabled={themesLoading}
            title="Buscar novas sugestões de tema"
            aria-label="Buscar novas sugestões de tema"
            style={{ padding: '6px 9px' }}
          >
            {themesLoading ? <Spinner size={13} /> : <Icon name="refresh" size={14} />}
          </button>
        </div>

        <div className="composer-bar">
          <Field label="Formato">
            <SegmentedControl<FormatChoice>
              value={formatChoice}
              onChange={pickFormat}
              disabled={locked}
              ariaLabel="Formato"
              options={[
                { value: 'feed', label: 'Feed', icon: 'square', title: 'Imagem 1:1 no feed' },
                { value: 'carousel', label: 'Carrossel', icon: 'layers', title: 'Várias telas 1:1 num post só' },
                { value: 'story', label: 'Story / Reels', icon: 'portrait', title: 'Vídeo vertical 9:16' },
              ]}
            />
          </Field>

          {/* nº de telas — só relevante no carrossel */}
          {carouselMode ? (
            <Field label="Telas">
              <SegmentedControl<string>
                value={String(slides)}
                onChange={(v) => setSlides(Number(v))}
                disabled={locked}
                ariaLabel="Número de telas"
                options={[
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                ]}
              />
            </Field>
          ) : (
            <Field label="Ângulo">
              <select
                className="select"
                value={filter}
                disabled={locked || hasTheme}
                title={hasTheme ? 'Com um tema escrito, a IA escolhe o ângulo' : undefined}
                onChange={(e) => setFilter(e.target.value as Filter)}
                style={{ minWidth: 210, fontWeight: 600, padding: '8px 34px 8px 12px' }}
              >
                <option value="all">Livre (a IA escolhe)</option>
                {availableAngles.map((angle) => (
                  <option key={angle} value={angle}>
                    {ANGLE_LABELS[angle]}
                  </option>
                ))}
                <option value="anuncio">Anúncio (propaganda)</option>
              </select>
            </Field>
          )}
        </div>
      </section>

      {/* ===== barra do carrossel — só quando já existem telas ===== */}
      {carouselMode && creatives.length > 0 && !showSkeleton && (
        <div
          className="card stack-sm"
          style={{
            marginTop: 20,
            padding: '12px 14px 12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            borderColor: 'var(--border-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 240px' }}>
            <Icon name="layers" size={18} style={{ color: 'var(--accent-hover)' }} />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Carrossel · {creatives.length} telas</div>
              <div style={{ fontSize: 12, color: UI.inkMuted2 }}>Vai com a legenda da 1ª tela</div>
            </div>
          </div>

          <Dropdown
            align="right"
            width={310}
            trigger={({ open, toggle }) => (
              <Button variant="ghost" icon="download" loading={carouselDownloading} disabled={carouselPosting} onClick={toggle}>
                {carouselDownloading ? 'Baixando…' : 'Baixar todas'}
                {!carouselDownloading && (
                  <Icon name="chevronDown" size={15} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
                )}
              </Button>
            )}
          >
            {(close) => {
              const pick = (v: DownloadVariant) => {
                close()
                void doDownloadCarousel(v)
              }
              return (
                <>
                  <div className="menu-label">Todas as telas · PNG</div>
                  <MenuItem
                    icon="sparkles"
                    accent
                    title="Com foto da OpenAI"
                    sub={anyAI ? 'Igual ao preview (telas sem foto saem como estão)' : 'Gere uma Foto IA em alguma tela primeiro'}
                    disabled={!anyAI}
                    onClick={() => pick('ai')}
                  />
                  <MenuItem icon="imageOff" title="Sem foto da OpenAI" sub="Só o layout e as cores da marca" onClick={() => pick('plain')} />
                  {anyAI && <MenuItem icon="layers" title="As duas versões" sub="Com e sem foto, de cada tela" onClick={() => pick('both')} />}
                </>
              )
            }}
          </Dropdown>

          <Button variant="ig" icon="send" loading={carouselPosting} disabled={carouselDownloading || generating} onClick={() => void doPublishCarousel()}>
            {carouselPosting ? 'Publicando…' : 'Publicar carrossel'}
          </Button>
        </div>
      )}

      {/* ===== gerando a leva: esqueleto no lugar dos cards ===== */}
      {showSkeleton && <GeneratingCard message={loadingMsg} square={square} frameW={frameW} frameH={frameH} />}

      {/* ===== estado vazio — nada mocado na abertura ===== */}
      {creatives.length === 0 && !generating && (
        <div className="card" style={{ marginTop: 22, borderStyle: 'dashed', background: 'transparent' }}>
          <EmptyState
            icon={carouselMode ? 'layers' : 'wand'}
            title={carouselMode ? 'Monte um carrossel' : 'Crie o primeiro post'}
            hint={
              carouselMode ? (
                <>A IA escreve {slides} telas que se completam, para postar como um carrossel só.</>
              ) : (
                <>
                  Clique em <strong style={{ color: UI.ink }}>Gerar com IA</strong> ou escolha um tema em alta
                  acima. Depois dá para editar o texto, pôr uma foto da OpenAI e publicar ou baixar.
                </>
              )
            }
            action={
              <Button icon={carouselMode ? 'layers' : 'wand'} onClick={generate} disabled={locked}>
                {genLabel}
              </Button>
            }
          />
        </div>
      )}

      {/* ===== grid ===== */}
      {!showSkeleton && creatives.length > 0 && (
        <div className="creatives-grid" style={{ marginTop: 20 }}>
          {creatives.map((c, i) => (
            <CreativeCard
              key={c._key + '-' + i}
              carouselMode={carouselMode}
              total={creatives.length}
              c={c}
              idx={i}
              square={square}
              frameW={frameW}
              frameH={frameH}
              scaleStr={scaleStr}
              innerW={innerW}
              innerH={innerH}
              client={client}
              onEditField={editField}
              onEditCaption={editCaption}
              onEditHashtags={editHashtags}
              onRegen={regenerateOne}
              onPublish={(cardIdx) => void doPublish(cardIdx)}
              onPublishStory={(cardIdx, targets, trial) => void doPublishStory(cardIdx, targets, trial)}
              onDownload={(cardIdx, kind, variant) => void doDownload(cardIdx, kind, variant)}
              onGenImage={(cardIdx, mode) => void genImage(cardIdx, mode)}
              onClearImage={clearImage}
              busy={generating || carouselPosting}
              busyLabel={
                busyCardIdx === i ? 'Gerando foto… ~15s' : loadingTarget === i ? 'Escrevendo um novo…' : undefined
              }
              posting={postingIdx === i}
              downloading={downloadingIdx === i || carouselDownloading}
            />
          ))}
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}

/** Placeholder enquanto a IA escreve a leva: mesmo formato do card final. */
function GeneratingCard({
  message,
  square,
  frameW,
  frameH,
}: {
  message: string
  square: boolean
  frameW: number
  frameH: number
}) {
  return (
    <div className="card card-work" style={{ marginTop: 20, borderRadius: 18 }} role="status" aria-live="polite">
      <div className="work-preview">
        <div style={{ position: 'relative', width: frameW, height: frameH }}>
          <Skeleton width={frameW} height={frameH} radius={12} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <Spinner size={32} color="var(--accent)" />
            <div style={{ fontWeight: 600, fontSize: 14, color: UI.ink }}>{message}</div>
            <div style={{ fontSize: 12.5, color: UI.inkMuted2 }}>Leva alguns segundos</div>
          </div>
        </div>
      </div>
      <div className="work-editor" style={{ padding: 20, gap: 14 }}>
        <Skeleton width={110} height={22} radius={999} />
        <Skeleton height={14} width="30%" style={{ marginTop: 10 }} />
        <Skeleton height={56} />
        <Skeleton height={14} width="25%" />
        <Skeleton height={56} />
        {!square && <Skeleton height={56} />}
      </div>
    </div>
  )
}
