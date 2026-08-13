import type { ClientConfig } from '../clients/types'
import type { Creative, CreativeFields } from '../types'
import type { ImageMode, StoryTarget } from '../lib/api'
import { ANGLE_LABELS, EDIT_FIELDS } from '../data/shared'
import { FONT, RADIUS, SHADOW, UI, button, fieldLabel, textarea } from '../ui/theme'
import { CreativeCanvas } from './CreativeCanvas'
import type { CSSProperties } from 'react'

interface Props {
  c: Creative
  idx: number
  square: boolean
  frameW: number
  frameH: number
  scaleStr: string
  innerW: number
  innerH: number
  client: ClientConfig
  onEditField: (idx: number, key: keyof CreativeFields, val: string) => void
  onEditCaption: (idx: number, val: string) => void
  onEditHashtags: (idx: number, val: string) => void
  onRegen: (idx: number) => void
  /** Publica a imagem no feed (formato 1:1). */
  onPublish: (idx: number) => void
  /** Publica o vídeo vertical no Story e/ou nos Reels (formato 9:16).
   *  `trial` publica um Trial Reel (só para não-seguidores, por 72h). */
  onPublishStory: (idx: number, targets: StoryTarget[], trial?: boolean) => void
  /** Baixa o vídeo para postar manualmente no app (com áudio em alta). */
  onDownloadVideo: (idx: number) => void
  /** Baixa a imagem (PNG) para postar manualmente. */
  onDownloadImage: (idx: number) => void
  onGenImage: (idx: number, mode: ImageMode) => void
  onClearImage: (idx: number) => void
  busy: boolean
  /** true quando a imagem DESTE card está sendo gerada pela IA */
  busyImage?: boolean
  /** true quando ESTE card está sendo publicado no Instagram */
  posting?: boolean
  /** no modo carrossel os botões de publicar do card somem (posta pela barra) */
  carouselMode?: boolean
}

// Cor da marca do Instagram, usada nos botões de publicar.
const IG_GRADIENT = 'linear-gradient(95deg,#833AB4 0%,#E1306C 50%,#F77737 100%)'

export function CreativeCard(props: Props) {
  const { c, idx, square, frameW, frameH, scaleStr, innerW, innerH, client } = props
  const editFields = EDIT_FIELDS[c.layout] ?? []
  // Marcas editoriais (saúde) não geram imagem de propaganda — ver ClientVoice.
  const editorial = client.voice === 'editorial'
  const posting = !!props.posting

  // Botão flutuante sobre o preview (gerar/remover fundo por IA).
  const floatBtn: CSSProperties = {
    height: 30,
    padding: '0 12px',
    borderRadius: RADIUS.pill,
    border: 'none',
    background: 'rgba(0,0,0,0.62)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: props.busy ? 'default' : 'pointer',
    opacity: props.busy ? 0.7 : 1,
    whiteSpace: 'nowrap',
  }

  // Botão de publicar (gradiente do Instagram), reaproveitado no feed e no story.
  const igBtn = (extra: CSSProperties = {}): CSSProperties => ({
    ...button('primary'),
    background: IG_GRADIENT,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: posting ? 'default' : 'pointer',
    opacity: posting ? 0.85 : 1,
    boxShadow: '0 6px 18px -6px rgba(225,48,108,0.5)',
    ...extra,
  })

  const spinner = <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />

  return (
    <div
      className="card card-work"
      style={{ borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.card }}
    >
      {/* ===== painel do preview ===== */}
      <div className="work-preview">
        <div
          style={{
            width: frameW,
            height: frameH,
            overflow: 'hidden',
            borderRadius: 12,
            boxShadow: '0 12px 34px -8px rgba(0,0,0,.6)',
            flex: 'none',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 22,
          }}
        >
          <CreativeCanvas
            c={c}
            idx={idx}
            square={square}
            scaleStr={scaleStr}
            innerW={innerW}
            innerH={innerH}
            client={client}
          />

          {/* botões flutuantes: fundo por IA (aparece em todo post, feed ou story). */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 5 }}>
            {c.bgImage && (
              <button
                onClick={() => props.onClearImage(idx)}
                title="Remover imagem de fundo"
                style={{ ...floatBtn, width: 30, padding: 0, borderRadius: '50%', fontSize: 14 }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => props.onGenImage(idx, 'editorial')}
              disabled={props.busy}
              title={c.bgImage ? 'Gerar outra foto editorial por IA' : 'Gerar foto editorial por IA'}
              style={floatBtn}
            >
              🎨 {c.bgImage ? 'Foto' : 'Foto IA'}
            </button>
            {!editorial && (
              <button
                onClick={() => props.onGenImage(idx, 'promo')}
                disabled={props.busy}
                title="Gerar imagem de propaganda (vibrante e chamativa) por IA"
                style={{ ...floatBtn, background: UI.accent }}
              >
                📣 Propaganda
              </button>
            )}
          </div>

          {/* overlay enquanto a IA gera a imagem deste card */}
          {props.busyImage && (
            <div className="card-loading-overlay" role="status" aria-live="polite">
              <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4, color: 'var(--accent)' }} />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, padding: '0 16px' }}>
                Gerando imagem… ~15s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== painel do editor ===== */}
      <div className="work-editor">
        {/* cabeçalho: ângulo + trocar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: 'var(--accent-soft)',
              color: 'var(--accent-hover)',
              padding: '5px 11px',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            {ANGLE_LABELS[c.angle] ?? c.angle}
          </span>
          <div style={{ flex: 1 }} />
          <button
            className="ui-btn"
            onClick={() => props.onRegen(idx)}
            title="Trocar por outro"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid ' + UI.border,
              borderRadius: RADIUS.pill,
              padding: '7px 13px',
              fontSize: 13,
              fontWeight: 700,
              color: UI.inkMuted,
              cursor: 'pointer',
            }}
          >
            🔄 Trocar
          </button>
        </div>

        {/* campos editáveis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {editFields.map(([key, label]) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabel}>{label}</span>
              <textarea
                className="textarea"
                value={c.f[key] ?? ''}
                onChange={(e) => props.onEditField(idx, key, e.target.value)}
                rows={2}
                style={textarea}
              />
            </label>
          ))}
        </div>

        {/* legenda + hashtags — vão na descrição (feed e Reels); Story ignora. */}
        <div
          style={{
            borderTop: '1px solid ' + UI.border,
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Legenda {!square && <span style={{ opacity: 0.6 }}>(feed/Reels)</span>}</span>
            <textarea
              className="textarea"
              value={c.caption}
              onChange={(e) => props.onEditCaption(idx, e.target.value)}
              rows={4}
              style={{ ...textarea, lineHeight: 1.5 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}># Hashtags</span>
            <textarea
              className="textarea"
              value={c.hashtags}
              onChange={(e) => props.onEditHashtags(idx, e.target.value)}
              rows={2}
              style={{ ...textarea, color: UI.inkMuted }}
            />
          </label>
        </div>

        <div style={{ flex: 1 }} />

        {/* ===== ações ===== (escondidas no modo carrossel: posta pela barra) */}
        {props.carouselMode ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {square ? (
              // Feed 1:1 — publica a imagem.
              <button
                className="ui-btn"
                onClick={() => props.onPublish(idx)}
                disabled={posting}
                title="Publicar esta imagem no feed do Instagram conectado"
                style={igBtn({ width: '100%' })}
              >
                {posting ? <>{spinner} Postando…</> : <>📤 Postar no Instagram</>}
              </button>
            ) : (
              // Story 9:16 — grava o vídeo animado e publica no Story e/ou Reels.
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {posting ? (
                  <button className="ui-btn" disabled style={igBtn({ width: '100%' })}>
                    {spinner} Publicando vídeo… ~30s
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ui-btn" onClick={() => props.onPublishStory(idx, ['story'])} title="Publicar o vídeo no Story" style={igBtn({ flex: 1 })}>
                      📱 Story
                    </button>
                    <button className="ui-btn" onClick={() => props.onPublishStory(idx, ['reels'])} title="Publicar o vídeo nos Reels" style={igBtn({ flex: 1 })}>
                      🎬 Reels
                    </button>
                    <button className="ui-btn" onClick={() => props.onPublishStory(idx, ['story', 'reels'])} title="Publicar no Story e nos Reels" style={igBtn({ flex: 1 })}>
                      ✨ Ambos
                    </button>
                  </div>
                )}
                {!posting && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="ui-btn"
                      onClick={() => props.onPublishStory(idx, ['reels'], true)}
                      title="Trial Reel: publica só para NÃO-seguidores por 72h, para testar o desempenho antes de mostrar aos seguidores"
                      style={{ ...button('ghost'), flex: 1, fontSize: 13 }}
                    >
                      🧪 Trial Reels
                    </button>
                    <button
                      className="ui-btn"
                      onClick={() => props.onDownloadVideo(idx)}
                      title="Baixar o vídeo para postar no app e escolher um áudio em alta (a API não permite áudio da biblioteca)"
                      style={{ ...button('ghost'), flex: 1, fontSize: 13 }}
                    >
                      ⬇ Baixar (áudio no app)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* baixar imagem — feed/carrossel — para postar manualmente com áudio em alta */}
            {square && (
              <button
                className="ui-btn"
                onClick={() => props.onDownloadImage(idx)}
                title="Baixar a imagem (PNG) para postar manualmente no app"
                style={{ ...button('ghost'), width: '100%', fontSize: 13 }}
              >
                ⬇ Baixar imagem (p/ postar manual)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
