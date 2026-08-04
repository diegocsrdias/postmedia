import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreativeCard } from './components/CreativeCard'
import { CLIENT_LIST, DEFAULT_CLIENT, getClient } from './clients'
import type { ClientId } from './clients'
import { ANGLE_LABELS, ANGLE_ORDER } from './data/shared'
import {
  generateAds,
  generateByTheme,
  generateImage,
  generateMix,
  publishToInstagram,
  publishVideoToInstagram,
  uploadVideo,
} from './lib/api'
import type { StoryTarget } from './lib/api'
import { pickFresh, postTextOf } from './lib/creatives'
import { captureJpeg, recordReels } from './lib/export'
import type { Creative, CreativeFields, Filter, Format } from './types'
import type { ImageMode } from './lib/api'
import { FONT, RADIUS, SHADOW, UI, monoLabel, segButton, segGroup } from './ui/theme'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function getInitialClientId(): ClientId {
  if (typeof window === 'undefined') return DEFAULT_CLIENT
  const stored = localStorage.getItem('creativeClientId')
  return CLIENT_LIST.some((item) => item.id === stored) ? (stored as ClientId) : DEFAULT_CLIENT
}

/** Converte um erro de chamada de IA numa mensagem curta para o toast. */
function aiError(err: unknown): string {
  const msg = String((err as Error)?.message || err || '')
  if (/OPENAI_API_KEY|401|api key/i.test(msg)) {
    return 'IA sem chave no servidor — configure OPENAI_API_KEY'
  }
  return 'A IA tropeçou — tente de novo'
}

export default function App() {
  const [clientId, setClientId] = useState<ClientId>(getInitialClientId)
  const client = useMemo(() => getClient(clientId), [clientId])

  const [format, setFormat] = useState<Format>('square')
  const [filter, setFilter] = useState<Filter>('all')
  // gera sempre 1 criativo por vez
  const count = 1
  const [theme, setTheme] = useState('')
  const [generating, setGenerating] = useState(false)
  // mensagem exibida no overlay de carregamento (tela cheia)
  const [loadingMsg, setLoadingMsg] = useState('')
  // índice do card cuja imagem está sendo gerada (overlay só naquele card)
  const [busyCardIdx, setBusyCardIdx] = useState<number | null>(null)
  // índice do card que está sendo postado no Instagram (trava só aquele botão)
  const [postingIdx, setPostingIdx] = useState<number | null>(null)
  const [creatives, setCreatives] = useState<Creative[]>(() =>
    pickFresh(getClient(getInitialClientId()).bank, 1, 'all', []),
  )
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  const availableAngles = useMemo(() => {
    const angleSet = new Set(client.bank.map((item) => item.angle))
    return ANGLE_ORDER.filter((angle) => angle !== 'anuncio' && angleSet.has(angle))
  }, [client])

  useEffect(() => {
    localStorage.setItem('creativeClientId', clientId)
  }, [clientId])

  // largura da viewport — usada para dimensionar o preview no mobile
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const square = format === 'square'

  const todayLabel = useMemo(() => {
    const d = new Date()
    return d.getDate() + ' de ' + MONTHS[d.getMonth()] + '. ' + d.getFullYear()
  }, [])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 1800)
  }, [])

  // ----- geração -----
  const generateAll = useCallback(
    (nextFilter = filter, nextCount = count) => {
      if (nextFilter === 'anuncio') {
        void generateAdsAI(nextCount, null)
        return
      }
      // "Todos os temas" (padrão) gera com IA — textos variados e originais.
      // Um ângulo específico continua vindo do banco curado por ângulo.
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
      // a IA às vezes devolve menos itens que o pedido — completa com o banco
      // (offline) pra a grade sempre ficar cheia.
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
      // fallback: se a IA falhar, cai pro banco offline pra não deixar a tela vazia
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
    setLoadingMsg(
      replaceIdx == null ? 'Criando ' + n + ' anúncios com IA…' : 'Criando novo anúncio…',
    )
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

  useEffect(() => {
    const angleSet = new Set(client.bank.map((item) => item.angle))
    if (filter !== 'all' && filter !== 'anuncio' && !angleSet.has(filter)) {
      setFilter('all')
      setCreatives(pickFresh(client.bank, count, 'all', []))
      return
    }
    if (filter === 'anuncio') {
      void generateAdsAI(count, null)
      return
    }
    setCreatives(pickFresh(client.bank, count, filter, []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const regenerateOne = (idx: number) => {
    const cur = creatives[idx]
    if (cur && cur.layout === 'ad') {
      void generateAdsAI(1, idx)
      return
    }
    // Em "Todos os temas", trocar um card gera um novo com IA.
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

  // ----- ações -----
  /** Dados do criativo guardados no banco (o "DNA" para o aprendizado). */
  const metaOf = (c: Creative, fmt: 'feed' | 'story') => ({
    client: client.id,
    format: fmt,
    layout: c.layout,
    angle: c.angle,
    headline: c.f.headline || c.f.title || c.f.line1 || '',
    fields: c.f,
  })

  /** Posta o criativo (imagem) no feed do Instagram — sem legenda. */
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
      const jpeg = await captureJpeg(node)
      await publishToInstagram(jpeg, '', metaOf(creatives[idx], 'feed'))
      flash('Publicado no Instagram! 🎉')
    } catch (err) {
      flash('Falhou: ' + String((err as Error)?.message || err))
    } finally {
      setPostingIdx(null)
    }
  }

  /**
   * Grava o vídeo animado (~6s) do card e publica no Story e/ou nos Reels.
   * O vídeo é enviado direto ao bucket (URL assinada) e publicado via backend.
   */
  const doPublishStory = async (idx: number, targets: StoryTarget[]) => {
    if (postingIdx !== null) return
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    const label = targets.length > 1 ? 'Story + Reels' : targets[0] === 'reels' ? 'Reels' : 'Story'
    setPostingIdx(idx)
    flash('Gravando e publicando (' + label + ')…')
    try {
      // sem texto queimado no vídeo (tudo sem legenda) — Ken Burns do card puro
      const { blob, ext } = await recordReels([{ node, vcap: '' }], false, 6000)
      if (ext === 'webm') {
        throw new Error(
          'Seu navegador gravou o vídeo em WebM, que o Instagram não aceita. ' +
            'Use o Chrome/Edge atualizado (que grava em MP4).',
        )
      }
      const path = await uploadVideo(blob, client.id, ext)
      const { results } = await publishVideoToInstagram(
        path,
        targets,
        '',
        metaOf(creatives[idx], 'story'),
      )
      const failed = results.filter((r) => r.error)
      if (!failed.length) {
        flash('Publicado no ' + label + '! 🎉')
      } else if (failed.length < results.length) {
        // sucesso parcial (ex.: Reels foi, Story não)
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
    // overlay só no card alvo (não na tela inteira) — o usuário sabe onde a foto vai cair
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
  const preferredFrameW = square ? 340 : 300
  // no mobile, o card tem ~viewport de largura; o preview não pode estourar.
  // desconta paddings da página (14) e do card (20) de cada lado.
  const maxFrameW = Math.max(220, Math.min(preferredFrameW, vw - (14 + 20) * 2))
  const frameW = maxFrameW
  const scale = frameW / innerW
  const frameH = Math.round(innerH * scale)
  const scaleStr = scale.toFixed(4)

  return (
    <div style={{ minHeight: '100vh', background: UI.bg }}>
      {/* ===== Top bar ===== */}
      <header
        className="app-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: UI.dark,
          color: UI.darkText,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: '0 4px 12px rgba(0,0,0,.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={client.images.logo}
            alt={client.name}
            style={{ width: 44, height: 44, objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em' }}>
              Gerador de Criativos
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: UI.darkTextMuted2,
              }}
            >
              {client.name}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: UI.darkTextMuted,
            }}
          >
            Cliente
          </span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value as ClientId)}
            style={{
              border: '1px solid rgba(255,255,255,0.14)',
              background: UI.darkAlt,
              color: UI.darkText,
              borderRadius: RADIUS.pill,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {CLIENT_LIST.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            color: UI.darkTextMuted,
            letterSpacing: '0.08em',
          }}
        >
          {todayLabel}
        </span>
      </header>

      {/* ===== Controls ===== */}
      <div className="app-container app-pad" style={{ paddingTop: 26, paddingBottom: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '22px 30px' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: UI.ink,
              }}
            >
              Criativos de hoje
            </h1>
            <p style={{ margin: 0, color: UI.inkMuted, fontSize: 15, maxWidth: 560 }}>
              A IA cria posts originais pra Facebook, Instagram e TikTok. Ajuste o texto, copie a
              legenda e baixe a arte em PNG.
            </p>
          </div>
          <button
            onClick={() => generateAll()}
            disabled={generating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: UI.dark,
              color: UI.darkText,
              border: 'none',
              borderRadius: RADIUS.pill,
              padding: '15px 28px',
              fontWeight: 800,
              fontSize: 16,
              cursor: generating ? 'default' : 'pointer',
              opacity: generating ? 0.7 : 1,
              boxShadow: SHADOW.raised,
            }}
          >
            {generating ? (
              <span
                className="spinner"
                style={{ width: 18, height: 18, borderWidth: 2.5, color: UI.darkText }}
              />
            ) : (
              <span style={{ fontSize: 19 }}>🎲</span>
            )}{' '}
            {generating ? 'Criando…' : 'Gerar criativo com IA'}
          </button>
        </div>

        {/* theme / newsjacking */}
        <div
          style={{
            marginTop: 22,
            background: UI.surface,
            border: '2px solid ' + UI.border,
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 17 }}>✨</span>
            <span
              style={{ fontWeight: 800, fontSize: 16, color: UI.ink, letterSpacing: '-0.02em' }}
            >
              Criar em cima de um tema em alta
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: UI.dark,
                color: UI.darkText,
                padding: '3px 8px',
                borderRadius: RADIUS.pill,
              }}
            >
              com IA
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: UI.inkMuted, maxWidth: 640 }}>
            Digite um assunto do momento (copie do Google Trends ou da aba de buscas do TikTok) e a
            IA cria criativos amarrando o tema a {client.name}.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Copa do Mundo, BBB, alta do dólar, novela das 9…"
              style={{
                flex: 1,
                minWidth: 240,
                border: '1px solid ' + UI.border,
                background: '#fff',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: UI.ink,
              }}
            />
            <button
              onClick={() => void generateWithTheme()}
              disabled={generating}
              style={{
                background: UI.dark,
                color: UI.darkText,
                border: 'none',
                borderRadius: 10,
                padding: '12px 22px',
                fontWeight: 800,
                fontSize: 14,
                cursor: generating ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <span
                    className="spinner"
                    style={{ width: 15, height: 15, borderWidth: 2, color: UI.darkText }}
                  />
                  Criando…
                </span>
              ) : (
                '✨ Gerar com esse tema'
              )}
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 14,
            }}
          >
            <span style={monoLabel()}>Quentes agora:</span>
            {client.themes.map((chip) => (
              <button
                key={chip.theme}
                onClick={() => useChip(chip.theme)}
                style={{
                  background: '#fff',
                  border: '1px solid ' + UI.border,
                  borderRadius: RADIUS.pill,
                  padding: '6px 13px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: UI.ink,
                  cursor: 'pointer',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: UI.inkMuted2 }}>
            💡 Trends mudam todo dia — confira o Google Trends / TikTok do dia e cole o assunto aqui
            pra sempre pegar o hype fresco.
          </p>
        </div>

        {/* toolbar */}
        <div
          className="toolbar"
          style={{
            marginTop: 22,
            padding: '14px 18px',
            background: UI.surface,
            border: '1px solid ' + UI.border,
            borderRadius: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel()}>Formato</span>
            <div style={segGroup}>
              <button onClick={() => setFormat('square')} style={segButton(square)}>
                Feed 1:1
              </button>
              <button onClick={() => setFormat('story')} style={segButton(!square)}>
                Story 9:16
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel()}>Tema</span>
            <select
              value={filter}
              onChange={(e) => {
                const v = e.target.value as Filter
                setFilter(v)
                generateAll(v, count)
              }}
              style={{
                border: '1px solid ' + UI.border,
                background: '#fff',
                borderRadius: RADIUS.pill,
                padding: '9px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: UI.ink,
                cursor: 'pointer',
                minWidth: 170,
              }}
            >
              <option value="all">Todos os temas</option>
              {availableAngles.map((angle) => (
                <option key={angle} value={angle}>
                  {ANGLE_LABELS[angle]}
                </option>
              ))}
              <option value="anuncio">📣 Anúncio (propaganda)</option>
            </select>
          </div>
        </div>

      </div>

      {/* ===== Grid ===== */}
      <div className="app-container app-pad" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <div className="creatives-grid">
          {creatives.map((c, i) => (
            <CreativeCard
              key={c._key + '-' + i}
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
              onRegen={regenerateOne}
              onPublish={(cardIdx) => void doPublish(cardIdx)}
              onPublishStory={(cardIdx, targets) => void doPublishStory(cardIdx, targets)}
              onGenImage={(cardIdx, mode) => void genImage(cardIdx, mode)}
              onClearImage={clearImage}
              busy={generating}
              busyImage={busyCardIdx === i}
              posting={postingIdx === i}
            />
          ))}
        </div>
      </div>

      {/* overlay de carregamento em tela cheia — geração de lote/tema.
          Grande e centralizado, funciona bem no celular (a toast passava batido). */}
      {generating && loadingMsg && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <span
            className="spinner"
            style={{ width: 52, height: 52, borderWidth: 5, color: '#fff' }}
          />
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
            {loadingMsg}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            A IA está trabalhando — pode levar alguns segundos.
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: UI.dark,
            color: UI.darkText,
            padding: '13px 24px',
            borderRadius: RADIUS.pill,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: SHADOW.toast,
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

