import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Creative, CreativeFields, Filter, Format } from './types'
import { THEMES } from './data/bank'
import { pickFresh, postTextOf } from './lib/creatives'
import { generateAds, generateByTheme, generateImage } from './lib/api'
import { copyText, downloadPng, downloadReels } from './lib/export'
import { CreativeCard } from './components/CreativeCard'
import logo from './assets/logo-dindin.png'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function segStyle(on: boolean): CSSProperties {
  return {
    border: 'none',
    borderRadius: 999,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    background: on ? '#303078' : 'transparent',
    color: on ? '#F6F2EA' : '#4A4A6A',
  }
}

const monoLabel: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#8B8BA8',
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
  const [format, setFormat] = useState<Format>('square')
  const [filter, setFilter] = useState<Filter>('all')
  const [count, setCount] = useState(4)
  const [videoCaptionOn, setVideoCaptionOn] = useState(true)
  const [theme, setTheme] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creatives, setCreatives] = useState<Creative[]>(() => pickFresh(4, 'all', []))
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)
  const recording = useRef(false)

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
      setCreatives(pickFresh(nextCount, nextFilter, []))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, count],
  )

  async function generateAdsAI(n: number, replaceIdx: number | null) {
    if (generating) return
    setGenerating(true)
    flash(replaceIdx == null ? 'Criando ' + n + ' anúncios com IA… ⏳' : 'Criando novo anúncio… ⏳')
    const existing = creatives
      .filter((c) => c.layout === 'ad')
      .map((c) => c.f.headline + ' ' + c.f.highlight)
      .join(' | ')
    try {
      const fresh = await generateAds(n, existing)
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
    }
  }

  async function runTheme(t: string) {
    if (!t) {
      flash('Digite um tema primeiro')
      return
    }
    if (generating) return
    setGenerating(true)
    flash('Criando com IA… ⏳')
    try {
      const fresh = await generateByTheme(count, t)
      setCreatives(fresh)
      flash('Pronto! ' + fresh.length + ' criativos sobre "' + t + '" 🎉')
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
    }
  }

  const generateWithTheme = () => runTheme(theme.trim())

  const useChip = (t: string) => {
    setTheme(t)
    void runTheme(t)
  }

  const regenerateOne = (idx: number) => {
    const cur = creatives[idx]
    if (cur && cur.layout === 'ad') {
      void generateAdsAI(1, idx)
      return
    }
    const used = creatives.map((c) => c._key)
    const fresh = pickFresh(1, filter, used)[0]
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

  const editVcap = (idx: number, val: string) =>
    setCreatives((prev) => {
      const a = prev.slice()
      a[idx] = { ...a[idx], vcap: val }
      return a
    })

  // ----- ações -----
  const copyCaption = async (idx: number) => {
    const c = creatives[idx]
    const ok = await copyText(c.caption + '\n\n' + c.hashtags)
    flash(ok ? 'Legenda copiada!' : 'Não consegui copiar 😕')
  }

  const doDownload = async (idx: number) => {
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    flash('Gerando PNG…')
    try {
      await downloadPng(node, idx)
      flash('PNG baixado! 🐷')
    } catch {
      flash('Erro ao gerar imagem')
    }
  }

  const doVideo = async (idx: number) => {
    const node = document.querySelector<HTMLElement>('[data-cap="' + idx + '"]')
    if (!node) {
      flash('Aguarde carregar…')
      return
    }
    if (recording.current) return
    recording.current = true
    flash('Gravando vídeo… ~6s')
    try {
      await downloadReels(node, idx, creatives[idx].vcap, videoCaptionOn)
      flash('Vídeo baixado! 🎬')
    } catch {
      flash('Erro ao gerar vídeo')
    } finally {
      recording.current = false
    }
  }

  const genImage = async (idx: number) => {
    if (generating) return
    setGenerating(true)
    flash('Gerando imagem com IA… ⏳ (pode levar ~15s)')
    try {
      const cur = creatives[idx]
      const postText = postTextOf(cur)
      const { image: img, idea } = await generateImage(postText, format)
      setCreatives((prev) => {
        const a = prev.slice()
        a[idx] = { ...a[idx], bgImage: img, bgPrompt: idea }
        return a
      })
      flash('Imagem aplicada! 🎨')
    } catch (err) {
      flash(aiError(err))
    } finally {
      setGenerating(false)
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
    <div style={{ minHeight: '100vh', background: '#EEE7D8' }}>
      {/* ===== Top bar ===== */}
      <header
        className="app-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#303078',
          color: '#F6F2EA',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: '0 4px 12px rgba(20,20,43,.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="DinDin"
            style={{ width: 44, height: 44, objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em' }}>
              Gerador de Criativos
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#C0D830',
              }}
            >
              Controle DinDin
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#B8B8D8',
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
                color: '#14142B',
              }}
            >
              Criativos de hoje
            </h1>
            <p style={{ margin: 0, color: '#4A4A6A', fontSize: 15, maxWidth: 560 }}>
              Gere posts prontos pra Facebook, Instagram e TikTok. Ajuste o texto, copie a legenda e
              baixe a arte em PNG.
            </p>
          </div>
          <button
            onClick={() => generateAll()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#C0D830',
              color: '#303078',
              border: 'none',
              borderRadius: 999,
              padding: '15px 28px',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(157,179,32,.35)',
            }}
          >
            <span style={{ fontSize: 19 }}>🎲</span> Gerar {count} criativos
          </button>
        </div>

        {/* theme / newsjacking */}
        <div
          style={{
            marginTop: 22,
            background: '#F6F2EA',
            border: '2px solid #C0D830',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 17 }}>✨</span>
            <span
              style={{ fontWeight: 800, fontSize: 16, color: '#14142B', letterSpacing: '-0.02em' }}
            >
              Criar em cima de um tema em alta
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: '#303078',
                color: '#C0D830',
                padding: '3px 8px',
                borderRadius: 999,
              }}
            >
              com IA
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4A4A6A', maxWidth: 640 }}>
            Digite um assunto do momento (copie do Google Trends ou da aba de buscas do TikTok) e a
            IA cria criativos amarrando o tema ao Controle DinDin.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Copa do Mundo, BBB, alta do dólar, novela das 9…"
              style={{
                flex: 1,
                minWidth: 240,
                border: '1px solid #DCD3BD',
                background: '#fff',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: '#14142B',
              }}
            />
            <button
              onClick={() => void generateWithTheme()}
              disabled={generating}
              style={{
                background: '#303078',
                color: '#C0D830',
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
              {generating ? 'Criando… ⏳' : '✨ Gerar com esse tema'}
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
            <span style={monoLabel}>Quentes agora:</span>
            {THEMES.map((chip) => (
              <button
                key={chip.theme}
                onClick={() => useChip(chip.theme)}
                style={{
                  background: '#fff',
                  border: '1px solid #DCD3BD',
                  borderRadius: 999,
                  padding: '6px 13px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#303078',
                  cursor: 'pointer',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#8B8BA8' }}>
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
            background: '#F6F2EA',
            border: '1px solid #DCD3BD',
            borderRadius: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel}>Formato</span>
            <div style={{ display: 'flex', background: '#EEE7D8', borderRadius: 999, padding: 3 }}>
              <button onClick={() => setFormat('square')} style={segStyle(square)}>
                Feed 1:1
              </button>
              <button onClick={() => setFormat('story')} style={segStyle(!square)}>
                Story 9:16
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel}>Tema</span>
            <select
              value={filter}
              onChange={(e) => {
                const v = e.target.value as Filter
                setFilter(v)
                generateAll(v, count)
              }}
              style={{
                border: '1px solid #DCD3BD',
                background: '#fff',
                borderRadius: 999,
                padding: '9px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: '#14142B',
                cursor: 'pointer',
                minWidth: 170,
              }}
            >
              <option value="all">Todos os temas</option>
              <option value="dica">Dicas rápidas</option>
              <option value="recurso">Recursos do app</option>
              <option value="pergunta">Perguntas p/ comentários</option>
              <option value="frase">Frases motivacionais</option>
              <option value="mito">Mitos vs verdades</option>
              <option value="antibet">🚫 Anti-bet (posicionamento)</option>
              <option value="anuncio">📣 Anúncio (propaganda)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={monoLabel}>Quantidade</span>
            <div style={{ display: 'flex', background: '#EEE7D8', borderRadius: 999, padding: 3 }}>
              {[3, 4, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setCount(n)
                    generateAll(filter, n)
                  }}
                  style={segStyle(count === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Estratégia de hoje ===== */}
        <div
          style={{
            marginTop: 16,
            background: '#303078',
            borderRadius: 16,
            padding: '22px 24px',
            color: '#F6F2EA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
              Estratégia de hoje
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
              gap: '18px 26px',
            }}
          >
            <StrategyCol
              title="1 · Ache o áudio (2 min)"
              items={[
                <>
                  Abra o Reels e procure a <strong>setinha ⬆</strong> (áudio em alta).
                </>,
                <>
                  Toque no som e cheque o nº de vídeos:{' '}
                  <strong>menos de 50 mil = entre agora.</strong>
                </>,
                <>Salve 3–5 áudios favoritos e reuse a semana toda.</>,
              ]}
            />
            <StrategyCol
              title="2 · Monte o vídeo"
              items={[
                <>
                  Gancho nos <strong>2 primeiros segundos</strong> — ou o vídeo morre.
                </>,
                <>Corte na batida do som (retenção +25–40%).</>,
                <>
                  Baixe o vídeo, suba e <strong>troque o áudio pelo em alta</strong> na plataforma.
                </>,
              ]}
            />
            <StrategyCol
              title="3 · Faça viralizar"
              items={[
                <>
                  Poste <strong>na mesma cadência toda semana</strong> (consistência &gt; volume).
                </>,
                <>Responda todo comentário nas primeiras 2h.</>,
                <>Reposte nos Stories pra reativar o ciclo de 24–72h.</>,
              ]}
            />
          </div>
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid #4848A0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#B8B8D8',
              }}
            >
              Legenda no vídeo
            </span>
            <div style={{ display: 'flex', background: '#1F1F4F', borderRadius: 999, padding: 3 }}>
              <button onClick={() => setVideoCaptionOn(true)} style={segStyle(videoCaptionOn)}>
                Ligada
              </button>
              <button onClick={() => setVideoCaptionOn(false)} style={segStyle(!videoCaptionOn)}>
                Desligada
              </button>
            </div>
            <span style={{ fontSize: 12, color: '#B8B8D8' }}>
              Grava o texto principal na tela do Reels, palavra por palavra — quem assiste não
              precisa abrir a descrição.
            </span>
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
              isStory={!square}
              frameW={frameW}
              frameH={frameH}
              scaleStr={scaleStr}
              innerW={innerW}
              innerH={innerH}
              onEditField={editField}
              onEditCaption={editCaption}
              onEditVcap={editVcap}
              onRegen={regenerateOne}
              onCopy={(idx) => void copyCaption(idx)}
              onDownload={(idx) => void doDownload(idx)}
              onVideo={(idx) => void doVideo(idx)}
              onGenImage={(idx) => void genImage(idx)}
              onClearImage={clearImage}
              busy={generating}
            />
          ))}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#14142B',
            color: '#F6F2EA',
            padding: '13px 24px',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 12px 32px rgba(20,20,43,.3)',
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function StrategyCol({ title, items }: { title: string; items: ReactNode[] }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#C0D830',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          fontSize: 13,
          lineHeight: 1.55,
          color: '#D5D5EC',
        }}
      >
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
