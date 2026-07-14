import type { CSSProperties } from 'react'
import type { Creative, CreativeFields } from '../types'
import { ANGLE_LABELS, EDIT_FIELDS, STRAT } from '../data/bank'
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
  onEditField: (idx: number, key: keyof CreativeFields, val: string) => void
  onEditCaption: (idx: number, val: string) => void
  onEditVcap: (idx: number, val: string) => void
  onRegen: (idx: number) => void
  onCopy: (idx: number) => void
  onDownload: (idx: number) => void
  onVideo: (idx: number) => void
  onGenImage: (idx: number) => void
  onClearImage: (idx: number) => void
  busy: boolean
}

const pill: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  background: '#fff',
  border: '1px solid #DCD3BD',
  color: '#303078',
  padding: '3px 9px',
  borderRadius: 999,
}

const fieldLabel: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8B8BA8',
}

const textarea: CSSProperties = {
  width: '100%',
  border: '1px solid #DCD3BD',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  color: '#14142B',
  background: '#fff',
  lineHeight: 1.35,
  resize: 'vertical',
  fontFamily: 'inherit',
}

export function CreativeCard(props: Props) {
  const { c, idx, square, isStory, frameW, frameH, scaleStr, innerW, innerH } = props
  const strat = STRAT[c.layout] ?? ({} as (typeof STRAT)[keyof typeof STRAT])
  const editFields = EDIT_FIELDS[c.layout] ?? []

  return (
    <div
      style={{
        background: '#F6F2EA',
        border: '1px solid #DCD3BD',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(20,20,43,.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* preview */}
      <div
        style={{
          background: '#E4DAC4',
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
            boxShadow: '0 8px 24px rgba(20,20,43,.18)',
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
          />

          {/* botões flutuantes: fundo por IA (aparece em todo post, feed ou story) */}
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
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(20,20,43,0.65)',
                  color: '#F6F2EA',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => props.onGenImage(idx)}
              disabled={props.busy}
              title={c.bgImage ? 'Gerar outra imagem de fundo por IA' : 'Gerar imagem de fundo por IA'}
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 999,
                border: 'none',
                background: 'rgba(20,20,43,0.65)',
                color: '#C0D830',
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: props.busy ? 'default' : 'pointer',
                opacity: props.busy ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              🎨 {c.bgImage ? 'Outra' : 'Gerar fundo'}
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
              background: '#EEE7D8',
              color: '#4A4A6A',
              padding: '5px 10px',
              borderRadius: 999,
            }}
          >
            {ANGLE_LABELS[c.angle] ?? c.angle}
          </span>
          <span style={{ fontSize: 12, color: '#8B8BA8' }}>·</span>
          <span style={{ fontSize: 12, color: '#8B8BA8', fontWeight: 600 }}>Facebook</span>
          <span style={{ fontSize: 12, color: '#8B8BA8', fontWeight: 600 }}>Instagram</span>
          <span style={{ fontSize: 12, color: '#8B8BA8', fontWeight: 600 }}>TikTok</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => props.onRegen(idx)}
            title="Trocar por outro"
            style={{
              background: 'none',
              border: '1px solid #DCD3BD',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 13,
              fontWeight: 600,
              color: '#4A4A6A',
              cursor: 'pointer',
            }}
          >
            🔄 Trocar
          </button>
        </div>

        {/* strategy strip */}
        <div
          style={{
            background: '#EEE7D8',
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
          <div style={{ fontSize: 12, color: '#4A4A6A', lineHeight: 1.4 }}>
            <strong style={{ color: '#14142B' }}>Gancho 2s:</strong> {strat.hook} ·{' '}
            <strong style={{ color: '#14142B' }}>Melhor em:</strong> {strat.plat}
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
            borderTop: '1px solid #E8E0CC',
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
            style={{ fontSize: 12, color: '#4A4A6A', lineHeight: 1.4, wordBreak: 'break-word' }}
          >
            {c.hashtags}
          </div>
        </div>

        <div className="stack-sm" style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <button
            onClick={() => props.onCopy(idx)}
            style={{
              flex: 1,
              background: '#303078',
              color: '#F6F2EA',
              border: 'none',
              borderRadius: 10,
              padding: 11,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            📋 Copiar legenda
          </button>
          <button
            onClick={() => props.onDownload(idx)}
            style={{
              flex: 1,
              background: '#C0D830',
              color: '#303078',
              border: 'none',
              borderRadius: 10,
              padding: 11,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ⬇ Baixar PNG
          </button>
        </div>

        {isStory && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: '1px dashed #DCD3BD',
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
              style={{
                background: '#303078',
                color: '#C0D830',
                border: '2px solid #C0D830',
                borderRadius: 10,
                padding: 11,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              🎬 Baixar Reels (vídeo ~6s)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
