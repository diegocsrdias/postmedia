import { useState } from 'react'
import type { ClientConfig } from '../clients/types'
import type { Creative, CreativeFields } from '../types'
import type { ImageMode, StoryTarget } from '../lib/api'
import { ANGLE_LABELS, EDIT_FIELDS } from '../data/shared'
import { Badge, Button, Dropdown, MenuItem } from '../ui/components'
import { Icon } from '../ui/icons'
import { UI } from '../ui/theme'
import { CreativeCanvas } from './CreativeCanvas'

/** Qual versão baixar: como está (com a foto da OpenAI), sem ela, ou as duas. */
export type DownloadVariant = 'ai' | 'plain' | 'both'
export type DownloadKind = 'image' | 'video'

/** `data-cap` da variante "sem foto IA" (renderizada fora da tela). */
export const plainCapId = (idx: number) => 'plain-' + idx

/** Limite de caracteres da legenda no Instagram. */
const CAPTION_MAX = 2200

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
  /** Baixa a imagem (PNG) ou o vídeo, com ou sem a foto gerada pela OpenAI. */
  onDownload: (idx: number, kind: DownloadKind, variant: DownloadVariant) => void
  onGenImage: (idx: number, mode: ImageMode) => void
  onClearImage: (idx: number) => void
  busy: boolean
  /** Texto do overlay quando a IA está trabalhando NESTE card (foto ou texto novo). */
  busyLabel?: string
  /** true quando ESTE card está sendo publicado/gravado */
  posting?: boolean
  /** true enquanto um download deste card (ou do carrossel) está em andamento */
  downloading?: boolean
  /** no modo carrossel publicar é pela barra do carrossel (download segue por tela) */
  carouselMode?: boolean
  /** total de telas (só no carrossel, para o rótulo "Tela 2 de 4") */
  total?: number
}

type Tab = 'art' | 'caption'

export function CreativeCard(props: Props) {
  const { c, idx, square, frameW, frameH, scaleStr, innerW, innerH, client } = props
  const editFields = EDIT_FIELDS[c.layout] ?? []
  // Marcas editoriais (saúde) não geram imagem de propaganda — ver ClientVoice.
  const editorial = client.voice === 'editorial'
  const posting = !!props.posting
  const hasAI = Boolean(c.bgImage)
  const [tab, setTab] = useState<Tab>('art')

  const captionLen = c.caption.length + (c.hashtags ? c.hashtags.length + 2 : 0)
  const tagCount = (c.hashtags.match(/#[\p{L}\p{N}_]+/gu) || []).length

  return (
    <article
      className="card card-work"
      style={{ borderRadius: 18 }}
      aria-label={'Criativo ' + (idx + 1)}
    >
      {/* ===== painel do preview ===== */}
      <div className="work-preview">
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: frameW,
              height: frameH,
              overflow: 'hidden',
              borderRadius: 12,
              boxShadow: '0 18px 44px -12px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)',
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

            {/* overlay enquanto a IA gera a imagem deste card */}
            {props.busyLabel && (
              <div className="card-loading-overlay" role="status" aria-live="polite">
                <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, color: 'var(--accent)' }} />
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, padding: '0 16px' }}>
                  {props.busyLabel}
                </div>
              </div>
            )}
          </div>

          {/* ferramentas de fundo por IA — fora da arte, para não cobrir o conteúdo */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: frameW }}>
            <button
              className="icon-btn accent"
              onClick={() => props.onGenImage(idx, 'editorial')}
              disabled={props.busy}
              title={hasAI ? 'Gerar outra foto editorial com a OpenAI' : 'Gerar uma foto editorial de fundo com a OpenAI'}
            >
              <Icon name={hasAI ? 'refresh' : 'image'} size={15} />
              {hasAI ? 'Outra foto' : 'Foto IA'}
            </button>
            {!editorial && (
              <button
                className="icon-btn"
                onClick={() => props.onGenImage(idx, 'promo')}
                disabled={props.busy}
                title="Gerar imagem de propaganda (vibrante e chamativa) com a OpenAI"
              >
                <Icon name="megaphone" size={15} />
                Propaganda
              </button>
            )}
            {hasAI && (
              <button
                className="icon-btn danger"
                onClick={() => props.onClearImage(idx)}
                disabled={props.busy}
                title="Remover a foto de fundo (volta ao layout da marca)"
                aria-label="Remover foto de fundo"
              >
                <Icon name="imageOff" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== painel do editor ===== */}
      <div className="work-editor">
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '16px 20px 0' }}>
          {props.carouselMode && props.total ? (
            <Badge tone="neutral" icon="layers">
              Tela {idx + 1} de {props.total}
            </Badge>
          ) : null}
          <Badge tone="accent">{ANGLE_LABELS[c.angle] ?? c.angle}</Badge>
          <div style={{ flex: 1 }} />
          <button
            className="icon-btn"
            onClick={() => props.onRegen(idx)}
            disabled={props.busy}
            title="Trocar por outro criativo (a IA escreve um novo)"
          >
            <Icon name="refresh" size={15} />
            Trocar
          </button>
        </div>

        {/* abas: texto da arte × legenda do post */}
        <div className="tabs" role="tablist" style={{ padding: '6px 12px 0' }}>
          <button role="tab" aria-selected={tab === 'art'} className={'tab' + (tab === 'art' ? ' on' : '')} onClick={() => setTab('art')}>
            <Icon name="type" size={15} />
            Texto da arte
          </button>
          <button
            role="tab"
            aria-selected={tab === 'caption'}
            className={'tab' + (tab === 'caption' ? ' on' : '')}
            onClick={() => setTab('caption')}
          >
            <Icon name="text" size={15} />
            Legenda
            {tagCount > 0 && (
              <span style={{ fontSize: 11, color: UI.inkMuted2, fontWeight: 500 }}>
                · {tagCount} #
              </span>
            )}
          </button>
        </div>

        <div style={{ padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {tab === 'art' ? (
            editFields.map(([key, label]) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="field-label">{label}</span>
                <textarea
                  className="textarea"
                  value={c.f[key] ?? ''}
                  onChange={(e) => props.onEditField(idx, key, e.target.value)}
                  rows={2}
                  style={{ fontSize: 14 }}
                />
              </label>
            ))
          ) : (
            <>
              {!square && (
                <div className="field-hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Icon name="bulb" size={14} />A legenda vai nos Reels. O Story não usa legenda.
                </div>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Legenda
                  <span style={{ fontWeight: 500, color: captionLen > CAPTION_MAX ? 'var(--danger)' : UI.inkMuted2 }}>
                    {captionLen.toLocaleString('pt-BR')}/{CAPTION_MAX.toLocaleString('pt-BR')}
                  </span>
                </span>
                <textarea
                  className="textarea"
                  value={c.caption}
                  onChange={(e) => props.onEditCaption(idx, e.target.value)}
                  rows={6}
                  style={{ fontSize: 14 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="field-label">Hashtags</span>
                <textarea
                  className="textarea"
                  value={c.hashtags}
                  onChange={(e) => props.onEditHashtags(idx, e.target.value)}
                  rows={2}
                  style={{ fontSize: 13.5, color: 'var(--accent-hover)' }}
                />
              </label>
            </>
          )}
        </div>

        {/* ===== barra de ações ===== */}
        <div className="work-actions stack-sm">
          {!props.carouselMode &&
            (square ? (
              <Button
                variant="ig"
                icon="send"
                loading={posting}
                disabled={props.busy}
                onClick={() => props.onPublish(idx)}
                title="Publicar esta imagem no feed do Instagram conectado"
                style={{ flex: '1 1 200px' }}
              >
                {posting ? 'Publicando…' : 'Publicar no feed'}
              </Button>
            ) : (
              <PublishStoryMenu posting={posting} disabled={props.busy} onPick={(t, trial) => props.onPublishStory(idx, t, trial)} />
            ))}

          <DownloadMenu
            story={!square}
            hasAI={hasAI}
            loading={!!props.downloading}
            disabled={posting || !!props.busyLabel}
            wide={!!props.carouselMode}
            onPick={(kind, variant) => props.onDownload(idx, kind, variant)}
          />
        </div>
      </div>

      {/* variante "sem foto da OpenAI", renderizada fora da tela só para exportar */}
      {hasAI && (
        <div className="export-stage" aria-hidden="true">
          <CreativeCanvas
            c={{ ...c, bgImage: undefined }}
            idx={idx}
            capId={plainCapId(idx)}
            square={square}
            scaleStr="1"
            innerW={innerW}
            innerH={innerH}
            client={client}
          />
        </div>
      )}
    </article>
  )
}

/* ============================================================
   Publicar Story/Reels (menu)
   ============================================================ */

function PublishStoryMenu({
  posting,
  disabled,
  onPick,
}: {
  posting: boolean
  disabled: boolean
  onPick: (targets: StoryTarget[], trial?: boolean) => void
}) {
  return (
    <div style={{ flex: '1 1 200px', display: 'flex' }}>
      <Dropdown
        align="left"
        up
        width={290}
        trigger={({ open, toggle }) => (
          <Button
            variant="ig"
            icon="send"
            loading={posting}
            disabled={disabled}
            onClick={toggle}
            full
            style={{ minWidth: 200 }}
          >
            {posting ? 'Gravando e publicando… ~30s' : 'Publicar vídeo'}
            {!posting && <Icon name="chevronDown" size={15} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />}
          </Button>
        )}
      >
        {(close) => {
          const pick = (t: StoryTarget[], trial?: boolean) => {
            close()
            onPick(t, trial)
          }
          return (
            <>
              <div className="menu-label">Publicar no Instagram</div>
              <MenuItem icon="sparkles" accent title="Story + Reels" sub="Publica nos dois de uma vez" onClick={() => pick(['story', 'reels'])} />
              <MenuItem icon="portrait" title="Só Story" sub="Some em 24h" onClick={() => pick(['story'])} />
              <MenuItem icon="video" title="Só Reels" sub="Fica no perfil, com a legenda" onClick={() => pick(['reels'])} />
              <div className="menu-sep" />
              <MenuItem
                icon="flask"
                title="Trial Reels"
                sub="Só para não-seguidores por 72h. Teste antes de mostrar a todos."
                onClick={() => pick(['reels'], true)}
              />
            </>
          )
        }}
      </Dropdown>
    </div>
  )
}

/* ============================================================
   Baixar (menu) — com e sem a foto da OpenAI
   ============================================================ */

function DownloadMenu({
  story,
  hasAI,
  loading,
  disabled,
  wide,
  onPick,
}: {
  story: boolean
  hasAI: boolean
  loading: boolean
  disabled: boolean
  wide: boolean
  onPick: (kind: DownloadKind, variant: DownloadVariant) => void
}) {
  const noAIHint = 'Gere uma Foto IA para ter esta versão'
  return (
    <div style={{ display: 'flex', flex: wide ? '1 1 200px' : '0 0 auto' }}>
      <Dropdown
        align="right"
        up
        width={300}
        trigger={({ open, toggle }) => (
          <Button
            variant="ghost"
            icon="download"
            loading={loading}
            disabled={disabled}
            onClick={toggle}
            full={wide}
            title="Baixar para postar manualmente (com ou sem a foto da OpenAI)"
          >
            {loading ? 'Baixando…' : 'Baixar'}
            {!loading && (
              <Icon name="chevronDown" size={15} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
            )}
          </Button>
        )}
      >
        {(close) => {
          const pick = (kind: DownloadKind, variant: DownloadVariant) => {
            close()
            onPick(kind, variant)
          }
          return (
            <>
              <div className="menu-label">Imagem PNG</div>
              <MenuItem
                icon="sparkles"
                accent
                title="Com foto da OpenAI"
                sub={hasAI ? 'Igual ao preview' : noAIHint}
                disabled={!hasAI}
                onClick={() => pick('image', 'ai')}
              />
              <MenuItem
                icon="imageOff"
                title="Sem foto da OpenAI"
                sub="Só o layout e as cores da marca"
                onClick={() => pick('image', 'plain')}
              />
              {hasAI && (
                <MenuItem icon="layers" title="Baixar as duas" sub="2 arquivos PNG" onClick={() => pick('image', 'both')} />
              )}
              {story && (
                <>
                  <div className="menu-sep" />
                  <div className="menu-label">Vídeo ~6s · para pôr áudio no app</div>
                  <MenuItem
                    icon="video"
                    accent
                    title="Vídeo com foto da OpenAI"
                    sub={hasAI ? 'Igual ao preview, animado' : noAIHint}
                    disabled={!hasAI}
                    onClick={() => pick('video', 'ai')}
                  />
                  <MenuItem
                    icon="video"
                    title="Vídeo sem foto da OpenAI"
                    sub="Só o layout da marca, animado"
                    onClick={() => pick('video', 'plain')}
                  />
                </>
              )}
            </>
          )
        }}
      </Dropdown>
    </div>
  )
}
