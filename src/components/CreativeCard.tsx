import type { ClientConfig } from '../clients/types'
import type { Creative, CreativeFields } from '../types'
import type { ImageMode, StoryTarget } from '../lib/api'
import { ANGLE_LABELS, EDIT_FIELDS } from '../data/shared'
import { RADIUS, SHADOW, UI, button, fieldLabel, textarea } from '../ui/theme'
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
  onRegen: (idx: number) => void
  /** Publica a imagem no feed (formato 1:1). */
  onPublish: (idx: number) => void
  /** Publica o vídeo vertical no Story e/ou nos Reels (formato 9:16). */
  onPublishStory: (idx: number, targets: StoryTarget[]) => void
  onGenImage: (idx: number, mode: ImageMode) => void
  onClearImage: (idx: number) => void
  busy: boolean
  /** true quando a imagem DESTE card está sendo gerada pela IA */
  busyImage?: boolean
  /** true quando ESTE card está sendo publicado no Instagram */
  posting?: boolean
}

// Cor da marca do Instagram, usada nos botões de publicar.
const IG_GRADIENT = 'linear-gradient(90deg,#833AB4 0%,#E1306C 50%,#F77737 100%)'

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
    background: 'rgba(0,0,0,0.6)',
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
    background: posting ? UI.inkMuted2 : IG_GRADIENT,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: posting ? 'default' : 'pointer',
    opacity: posting ? 0.85 : 1,
    ...extra,
  })

  const spinner = <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />

  return (
    <div
      style={{
        background: UI.surface,
        border: '1px solid ' + UI.border,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        boxShadow: SHADOW.card,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* preview */}
      <div
        style={{
          background: UI.surfaceAlt,
          padding: 20,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: frameW,
            height: frameH,
            overflow: 'hidden',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            flex: 'none',
            position: 'relative',
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

          {/* botões flutuantes: fundo por IA (aparece em todo post, feed ou story).
              Dois estilos: editorial (foto sóbria) e propaganda (imagem vibrante). */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              gap: 6,
              zIndex: 5,
            }}
          >
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
              <span
                className="spinner"
                style={{ width: 40, height: 40, borderWidth: 4, color: '#fff' }}
              />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, padding: '0 16px' }}>
                Gerando imagem… ~15s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* meta + edit */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: UI.surfaceAlt,
              color: UI.inkMuted,
              padding: '5px 10px',
              borderRadius: 999,
            }}
          >
            {ANGLE_LABELS[c.angle] ?? c.angle}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => props.onRegen(idx)}
            title="Trocar por outro"
            style={{
              background: 'none',
              border: '1px solid ' + UI.border,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 13,
              fontWeight: 600,
              color: UI.inkMuted,
              cursor: 'pointer',
            }}
          >
            🔄 Trocar
          </button>
        </div>

        {/* editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {editFields.map(([key, label]) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabel}>{label}</span>
              <textarea
                value={c.f[key] ?? ''}
                onChange={(e) => props.onEditField(idx, key, e.target.value)}
                rows={2}
                style={textarea}
              />
            </label>
          ))}
        </div>

        {/* ===== Publicar ===== */}
        {square ? (
          // Feed 1:1 — publica a imagem.
          <button
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
              <button disabled style={igBtn({ width: '100%' })}>
                {spinner} Publicando vídeo… ~30s
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => props.onPublishStory(idx, ['story'])}
                  title="Publicar o vídeo no Story"
                  style={igBtn({ flex: 1 })}
                >
                  📱 Story
                </button>
                <button
                  onClick={() => props.onPublishStory(idx, ['reels'])}
                  title="Publicar o vídeo nos Reels"
                  style={igBtn({ flex: 1 })}
                >
                  🎬 Reels
                </button>
                <button
                  onClick={() => props.onPublishStory(idx, ['story', 'reels'])}
                  title="Publicar no Story e nos Reels"
                  style={igBtn({ flex: 1 })}
                >
                  ✨ Ambos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
