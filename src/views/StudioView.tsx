import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreativeCard } from '../components/CreativeCard'
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
  uploadFile,
} from '../lib/api'
import type { StoryTarget } from '../lib/api'
import { pickFresh, postTextOf } from '../lib/creatives'
import { captureJpeg, captureJpegBlob, downloadImage, recordReels } from '../lib/export'
import type { Creative, CreativeFields, Filter, Format } from '../types'
import type { ImageMode } from '../lib/api'
import { RADIUS, UI, monoLabel } from '../ui/theme'
import { Badge, Button, Card, HighlightCard, LoadingOverlay, SectionHeader, SegmentedControl, Toast, useToast } from '../ui/components'

/** Converte um erro de chamada de IA numa mensagem curta para o toast. */
function aiError(err: unknown): string {
  const msg = String((err as Error)?.message || err || '')
  if (/OPENAI_API_KEY|401|api key/i.test(msg)) {
    return 'IA sem chave no servidor — configure OPENAI_API_KEY'
  }
  return 'A IA tropeçou — tente de novo'
}

export function StudioView({ client }: { client: ClientConfig }) {
  const [format, setFormat] = useState<Format>('square')
  const [filter, setFilter] = useState<Filter>('all')
  // gera sempre 1 criativo por vez
  const count = 1
  const [theme, setTheme] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [busyCardIdx, setBusyCardIdx] = useState<number | null>(null)
  const [postingIdx, setPostingIdx] = useState<number | null>(null)
  const [carouselMode, setCarouselMode] = useState(false)
  const [carouselPosting, setCarouselPosting] = useState(false)
  // abre sem nada: o usuário gera com IA (ou um tema) quando quiser
  const [creatives, setCreatives] = useState<Creative[]>([])
  const { toast, flash } = useToast()

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

  // ----- geração -----
  const generateAll = useCallback(
    (nextFilter = filter, nextCount = count) => {
      setCarouselMode(false)
      if (nextFilter === 'anuncio') {
        void generateAdsAI(nextCount, null)
        return
      }
      if (nextFilter === 'all') {
        void generateMixAI(nextCount, null)
        return
      }
      setCreatives(pickFresh(client.bank, nextCount, nextFilter, []))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, filter, count],
  )

  // Concatena textos já na tela pra IA não repetir na próxima leva.
  function existingText(): string {
    return creatives
      .map((c) => postTextOf(c))
      .join(' | ')
      .slice(0, 1200)
  }

  async function generateMixAI(n: number, replaceIdx: number | null) {
    if (generating) return
    setGenerating(true)
    setLoadingMsg(
      replaceIdx == null ? 'Criando ' + n + ' criativos com IA…' : 'Criando novo criativo…',
    )
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
      flash(replaceIdx == null ? fresh.length + ' criativos novos! 🎉' : 'Criativo novo no lugar! 🎉')
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
      setGenerating(false)
      setLoadingMsg('')
    }
  }

  async function generateAdsAI(n: number, replaceIdx: number | null) {
    if (generating) return
    setGenerating(true)
    setLoadingMsg(replaceIdx == null ? 'Criando ' + n + ' anúncios com IA…' : 'Criando novo anúncio…')
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
      flash(replaceIdx == null ? fresh.length + ' anúncios novos! 🎉' : 'Anúncio novo no lugar! 🎉')
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
      setLoadingMsg('')
    }
  }

  async function runTheme(t: string) {
    if (!t) {
      flash('Digite um tema primeiro')
      return
    }
    if (generating) return
    setGenerating(true)
    setLoadingMsg('Criando criativos sobre "' + t + '"…')
    try {
      const fresh = await generateByTheme(count, t, client.id)
      setCreatives(fresh)
      flash('Pronto! ' + fresh.length + ' criativos sobre "' + t + '" 🎉')
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
      setLoadingMsg('')
    }
  }

  const generateWithTheme = () => runTheme(theme.trim())
  const useChip = (t: string) => {
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
    if (filter === 'all') {
      void generateMixAI(1, idx)
      return
    }
    const used = creatives.map((c) => c._key)
    const fresh = pickFresh(client.bank, 1, filter, used)[0]
    if (!fresh || fresh._key === cur._key) {
      flash('Só existe este modelo no tema por enquanto 😉')
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
    setGenerating(true)
    setLoadingMsg('Criando ' + n + ' telas para o carrossel…')
    try {
      let slides = await generateMix(n, existingText(), client.id)
      if (slides.length < n) {
        const fill = pickFresh(client.bank, n - slides.length, 'all', slides.map((s) => s._key))
        slides = slides.concat(fill).slice(0, n)
      }
      setCreatives(slides.slice(0, n))
      setCarouselMode(true)
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
      setLoadingMsg('')
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
        const node = document.querySelector<HTMLElement>('[data-cap="' + i + '"]')
        if (!node) throw new Error('A tela ' + (i + 1) + ' não carregou')
        const blob = await captureJpegBlob(node)
        paths.push(await uploadFile(blob, client.id, 'jpg'))
      }
      const first = creatives[0]
      await publishCarousel(paths, fullCaption(first), metaOf(first, 'feed'))
      flash('Carrossel publicado! 🎉')
      setCarouselMode(false)
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
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

  const doPublish = async (idx: number) => {
    if (postingIdx !== null) return
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    setPostingIdx(idx)
    flash('Postando no Instagram…')
    try {
      const c = creatives[idx]
      const jpeg = await captureJpeg(node)
      await publishToInstagram(jpeg, fullCaption(c), metaOf(c, 'feed'))
      flash('Publicado no Instagram! 🎉')
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
    } finally {
      setPostingIdx(null)
    }
  }

  /** Baixa a imagem do criativo (PNG) e registra no histórico como "baixado". */
  const doDownloadImage = async (idx: number) => {
    if (postingIdx !== null || carouselPosting) return
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    flash('Gerando imagem…')
    try {
      await downloadImage(node, client.id + '-criativo-' + (idx + 1) + '.png')
      flash('Imagem baixada! 🐷')
      // registra no histórico (não bloqueia o download se falhar)
      void logDownload(idx, 'image')
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
    }
  }

  const doDownloadVideo = async (idx: number) => {
    if (postingIdx !== null) return
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    setPostingIdx(idx)
    flash('Gravando vídeo…')
    try {
      const { blob, ext } = await recordReels([{ node, vcap: '' }], false, 6000)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = client.id + '-video-' + (idx + 1) + '.' + ext
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      flash('Vídeo baixado! Poste no app e escolha o áudio 🎵')
      // registra no histórico subindo o vídeo ao bucket
      void logDownloadBlob(idx, blob, ext, 'video')
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
    } finally {
      setPostingIdx(null)
    }
  }

  /** Sobe a imagem do card ao bucket e registra como "baixado" no histórico. */
  async function logDownload(idx: number, kind: 'image' | 'video') {
    try {
      const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
      if (!node) return
      const blob = await captureJpegBlob(node)
      const path = await uploadFile(blob, client.id, 'jpg')
      await logCreative(path, metaOf(creatives[idx], format === 'story' ? 'story' : 'feed'), kind)
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
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
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
        flash('Publicado no ' + label + '! 🎉')
      } else if (failed.length < results.length) {
        const okTarget = results.find((r) => !r.error)?.target
        flash('Publicado só no ' + (okTarget === 'reels' ? 'Reels' : 'Story') + '. ' + failed[0].error)
      } else {
        flash('Falhou: ' + failed[0].error)
      }
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
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
      flash(mode === 'promo' ? 'Imagem de propaganda aplicada! 📣' : 'Imagem aplicada! 🎨')
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
  const preferredFrameW = square ? 400 : 330
  const maxFrameW = Math.max(220, Math.min(preferredFrameW, vw - (14 + 20) * 2))
  const frameW = maxFrameW
  const scale = frameW / innerW
  const frameH = Math.round(innerH * scale)
  const scaleStr = scale.toFixed(4)

  return (
    <div className="app-container app-pad" style={{ paddingTop: 26, paddingBottom: 96 }}>
      <SectionHeader
        title="Estúdio"
        subtitle="A IA cria posts originais e publica direto no Instagram — feed, Story, Reels e carrossel."
        right={
          <div className="stack-sm" style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost"
              disabled={generating || carouselPosting}
              onClick={() => void doGenerateCarousel(3)}
              title="Gera 3 telas coesas para postar como um carrossel único no feed"
            >
              📚 Carrossel
            </Button>
            <Button size="lg" loading={generating} disabled={carouselPosting} onClick={() => generateAll()}>
              {!generating && <span style={{ fontSize: 18 }}>🎲</span>}
              {generating ? 'Criando…' : 'Gerar com IA'}
            </Button>
          </div>
        }
      />

      {/* tema / newsjacking */}
      <HighlightCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17 }}>✨</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: UI.ink, letterSpacing: '-0.02em' }}>
            Criar em cima de um tema em alta
          </span>
          <Badge tone="accent" mono>
            newsjacking
          </Badge>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: UI.inkMuted, maxWidth: 640, lineHeight: 1.5 }}>
          Digite um assunto do momento (copie do Google Trends ou da aba de buscas do TikTok) e a IA
          cria criativos amarrando o tema a {client.name}.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void generateWithTheme()}
            placeholder="Ex: Copa do Mundo, BBB, alta do dólar, novela das 9…"
            style={{ flex: 1, minWidth: 240 }}
          />
          <Button loading={generating} onClick={() => void generateWithTheme()}>
            ✨ Gerar com esse tema
          </Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={monoLabel()}>Quentes agora:</span>
          {client.themes.map((chip) => (
            <button key={chip.theme} className="chip" onClick={() => useChip(chip.theme)}>
              {chip.label}
            </button>
          ))}
        </div>
      </HighlightCard>

      {/* toolbar */}
      <Card style={{ marginTop: 16 }} pad="14px 18px">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 26px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel()}>Formato</span>
            <SegmentedControl<Format>
              value={format}
              onChange={setFormat}
              options={[
                { value: 'square', label: 'Feed 1:1' },
                { value: 'story', label: 'Story 9:16' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel()}>Ângulo</span>
            <select
              className="select"
              value={filter}
              onChange={(e) => {
                const v = e.target.value as Filter
                setFilter(v)
                generateAll(v, count)
              }}
              style={{ borderRadius: RADIUS.pill, fontWeight: 600, minWidth: 190, cursor: 'pointer' }}
            >
              <option value="all">Todos os ângulos</option>
              {availableAngles.map((angle) => (
                <option key={angle} value={angle}>
                  {ANGLE_LABELS[angle]}
                </option>
              ))}
              <option value="anuncio">📣 Anúncio (propaganda)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* barra do carrossel */}
      {carouselMode && (
        <div
          style={{
            marginTop: 18,
            background: 'linear-gradient(180deg, var(--surface-3), var(--surface))',
            border: '1px solid var(--border-2)',
            color: UI.darkText,
            borderRadius: RADIUS.lg,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 15 }}>📚 Carrossel de {creatives.length} telas</span>
          <span style={{ fontSize: 12, color: UI.darkTextMuted }}>
            Usa a legenda da 1ª tela · arraste no Instagram
          </span>
          <div style={{ flex: 1 }} />
          <button
            className="ui-btn"
            onClick={() => setCarouselMode(false)}
            disabled={carouselPosting}
            style={{
              background: 'var(--surface-2)',
              color: UI.darkTextMuted,
              border: '1px solid ' + UI.darkBorder,
              borderRadius: RADIUS.pill,
              padding: '9px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✕ Sair
          </button>
          <button
            className="ui-btn"
            onClick={() => void doPublishCarousel()}
            disabled={carouselPosting}
            style={{
              background: 'linear-gradient(95deg,#833AB4 0%,#E1306C 50%,#F77737 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.pill,
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {carouselPosting ? '⏳ Publicando…' : '📤 Postar carrossel no feed'}
          </button>
        </div>
      )}

      {/* estado vazio — nada mocado na abertura */}
      {creatives.length === 0 && !generating && (
        <Card style={{ marginTop: 22 }} pad="48px 24px">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 42, lineHeight: 1 }}>🎨</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: UI.ink, letterSpacing: '-0.02em' }}>
              Nada por aqui ainda
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: UI.inkMuted, maxWidth: 380, lineHeight: 1.5 }}>
              Clique em <strong>Gerar com IA</strong> ou escreva um tema em alta lá em cima — a IA cria
              um post original na hora.
            </p>
            <Button size="lg" loading={generating} disabled={carouselPosting} onClick={() => generateAll()}>
              <span style={{ fontSize: 18 }}>🎲</span> Gerar com IA
            </Button>
          </div>
        </Card>
      )}

      {/* grid */}
      <div className="creatives-grid" style={{ marginTop: 22 }}>
        {creatives.map((c, i) => (
          <CreativeCard
            key={c._key + '-' + i}
            carouselMode={carouselMode}
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
            onDownloadVideo={(cardIdx) => void doDownloadVideo(cardIdx)}
            onDownloadImage={(cardIdx) => void doDownloadImage(cardIdx)}
            onGenImage={(cardIdx, mode) => void genImage(cardIdx, mode)}
            onClearImage={clearImage}
            busy={generating}
            busyImage={busyCardIdx === i}
            posting={postingIdx === i}
          />
        ))}
      </div>

      {generating && loadingMsg && (
        <LoadingOverlay message={loadingMsg} hint="A IA está trabalhando — pode levar alguns segundos." />
      )}
      <Toast message={toast} />
    </div>
  )
}
