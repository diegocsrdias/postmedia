import type { CSSProperties } from 'react'
import type { ClientConfig } from '../clients/types'
import type { Creative, CreativeFields } from '../types'
import type { ImageMode } from '../lib/api'
import { ANGLE_LABELS, EDIT_FIELDS, STRAT } from '../data/shared'
import { RADIUS, SHADOW, UI, button, fieldLabel, pill, textarea } from '../ui/theme'
import { CreativeCanvas } from './CreativeCanvas'

interface Props {
  c: Creative
  idx: number
  square: boolean
  isStory: boolean
  frameW: number
  frameH: number
  scaleStr: string
  innerW: number
  innerH: number
  client: ClientConfig
  onEditField: (idx: number, key: keyof CreativeFields, val: string) => void
  onEditCaption: (idx: number, val: string) => void
  onEditVcap: (idx: number, val: string) => void
  onRegen: (idx: number) => void
  onCopy: (idx: number) => void
  onDownload: (idx: number) => void
  onVideo: (idx: number) => void
  onGenImage: (idx: number, mode: ImageMode) => void
  onClearImage: (idx: number) => void
  busy: boolean
}

export function CreativeCard(props: Props) {
  const { c, idx, square, isStory, frameW, frameH, scaleStr, innerW, innerH, client } = props
  const strat = STRAT[c.layout] ?? ({} as (typeof STRAT)[keyof typeof STRAT])
  const editFields = EDIT_FIELDS[c.layout] ?? []

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
            <button
              onClick={() => props.onGenImage(idx, 'promo')}
              disabled={props.busy}
              title="Gerar imagem de propaganda (vibrante e chamativa) por IA"
              style={{ ...floatBtn, background: UI.accent }}
            >
              📣 Propaganda
            </button>
          </div>
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
          <span style={{ fontSize: 12, color: UI.inkMuted2 }}>·</span>
          <span style={{ fontSize: 12, color: UI.inkMuted2, fontWeight: 600 }}>Facebook</span>
          <span style={{ fontSize: 12, color: UI.inkMuted2, fontWeight: 600 }}>Instagram</span>
          <span style={{ fontSize: 12, color: UI.inkMuted2, fontWeight: 600 }}>TikTok</span>
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

        {/* strategy strip */}
        <div
          style={{
            background: UI.surfaceAlt,
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={pill}>🎵 {strat.mood}</span>
            <span style={pill}>{strat.bpm}</span>
            <span style={pill}>🎯 {strat.goal}</span>
          </div>
          <div style={{ fontSize: 12, color: UI.inkMuted, lineHeight: 1.4 }}>
            <strong style={{ color: UI.ink }}>Gancho 2s:</strong> {strat.hook} ·{' '}
            <strong style={{ color: UI.ink }}>Melhor em:</strong> {strat.plat}
          </div>
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

        {/* caption */}
        <div
          style={{
            borderTop: '1px solid ' + UI.border,
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={fieldLabel}>Legenda</span>
          <textarea
            value={c.caption}
            onChange={(e) => props.onEditCaption(idx, e.target.value)}
            rows={4}
            style={{ ...textarea, lineHeight: 1.45 }}
          />
          <div
            style={{ fontSize: 12, color: UI.inkMuted, lineHeight: 1.4, wordBreak: 'break-word' }}
          >
            {c.hashtags}
          </div>
        </div>

        <div className="stack-sm" style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <button onClick={() => props.onCopy(idx)} style={{ ...button('primary'), flex: 1 }}>
            📋 Copiar legenda
          </button>
          <button onClick={() => props.onDownload(idx)} style={{ ...button('ghost'), flex: 1 }}>
            ⬇ Baixar PNG
          </button>
        </div>

        {isStory && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: '1px dashed ' + UI.border,
              paddingTop: 12,
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabel}>🎬 Texto na tela do vídeo (legenda animada)</span>
              <textarea
                value={c.vcap}
                onChange={(e) => props.onEditVcap(idx, e.target.value)}
                rows={2}
                style={textarea}
              />
            </label>
            <button
              onClick={() => props.onVideo(idx)}
              style={{ ...button('primary'), border: '2px solid ' + UI.darkBorder }}
            >
              🎬 Baixar Reels (vídeo ~6s)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
