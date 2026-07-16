import type { CSSProperties } from 'react'
import type { ClientConfig } from '../clients/types'
import type { Creative } from '../types'

const S = (o: CSSProperties) => o

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Layouts com texto claro sobre fundo escuro — recebem véu escuro por trás
 * da imagem de IA. Os demais (texto escuro sobre fundo claro) recebem véu
 * claro, pra manter a legibilidade preservando a identidade visual.
 */
export const DARK_BG_LAYOUTS = new Set(['ad', 'statement', 'feature'])

/**
 * A "arte" do criativo em resolução nativa (1080×1080 ou 1080×1920).
 * Fica escalada para caber no card; `data-cap` é o alvo do html2canvas.
 */
export function CreativeCanvas({
  c,
  idx,
  square,
  scaleStr,
  innerW,
  innerH,
  client,
}: {
  c: Creative
  idx: number
  square: boolean
  scaleStr: string
  innerW: number
  innerH: number
  client: ClientConfig
}) {
  const hasBg = Boolean(c.bgImage)
  const isDarkLayout = DARK_BG_LAYOUTS.has(c.layout)
  const { colors, fonts, images } = client
  const [brandPrimary, brandAccent] = client.brandParts
  const brandName = client.brandParts.join(' ')
  const heroAccentImage = images.heroAccentImage || images.logo
  const badgeIcon = images.badgeIcon || images.logo

  /** Fundo do layout: transparente (deixa a imagem aparecer) quando há bgImage. */
  const bgFor = (color: string): string => (hasBg ? 'transparent' : color)
  /** Camada de conteúdo acima da imagem/véu. */
  const layerZ: CSSProperties = hasBg ? { zIndex: 1 } : {}

  const adPhoneStyle: CSSProperties = square
    ? {
        position: 'absolute',
        left: '50%',
        top: 0,
        marginLeft: -280,
        width: 560,
        height: 980,
        transform: 'rotate(-4deg)',
      }
    : {
        position: 'absolute',
        left: '50%',
        bottom: -160,
        marginLeft: -320,
        width: 640,
        height: 1080,
        transform: 'rotate(-4deg)',
      }

  const adPortraitStyle: CSSProperties = square
    ? {
        position: 'absolute',
        left: '50%',
        top: 40,
        marginLeft: -250,
        width: 500,
        height: 720,
      }
    : {
        position: 'absolute',
        left: '50%',
        bottom: -40,
        marginLeft: -280,
        width: 560,
        height: 820,
      }

  return (
    <div
      data-cap={idx}
      style={{
        width: innerW,
        height: innerH,
        transform: `scale(${scaleStr})`,
        transformOrigin: 'top left',
        position: 'relative',
        fontFamily: fonts.body,
      }}
    >
      {c.bgImage && (
        <>
          {/* Fundo de IA como background-size: cover (não <img objectFit>).
              O html2canvas 1.4.x ignora object-fit e ESPREME a <img>, deixando
              o PNG/vídeo exportado diferente do preview; background-size: cover
              é respeitado na captura, então a proporção fica igual à tela. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${c.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isDarkLayout
                ? `linear-gradient(180deg, ${rgba(colors.dark, 0.35)} 0%, ${rgba(colors.dark, 0.72)} 100%)`
                : `linear-gradient(180deg, ${rgba(colors.cream, 0.55)} 0%, ${rgba(colors.cream, 0.88)} 100%)`,
              zIndex: 0,
            }}
          />
        </>
      )}

      {c.layout === 'ad' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.dark),
            overflow: 'hidden',
            ...layerZ,
          })}
        >
          {!hasBg && (
            <div
              style={S({
                position: 'absolute',
                top: -320,
                right: -320,
                width: 900,
                height: 900,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${rgba(colors.accent, 0.32)} 0%, ${rgba(colors.accent, 0)} 65%)`,
              })}
            />
          )}
          {!hasBg && (
            <div
              style={S({
                position: 'absolute',
                bottom: -180,
                left: -180,
                width: 520,
                height: 520,
                borderRadius: '50%',
                border: `80px solid ${rgba(colors.accent, 0.14)}`,
              })}
            />
          )}
          <div
            style={S({
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: '88px 84px 0',
            })}
          >
            <div style={S({ display: 'flex', alignItems: 'center', gap: 16 })}>
              <span
                style={S({
                  background: colors.accent,
                  color: colors.accentText,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  fontSize: 24,
                  letterSpacing: '0.14em',
                  padding: '12px 22px',
                  borderRadius: 999,
                })}
              >
                {c.f.badge}
              </span>
              <span
                style={S({
                  fontFamily: fonts.mono,
                  fontSize: 24,
                  letterSpacing: '0.1em',
                  color: colors.darkTextMuted,
                })}
              >
                {client.smallPrint}
              </span>
            </div>
            <div
              style={S({
                fontSize: 92,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: colors.darkText,
                marginTop: 44,
              })}
            >
              {c.f.headline} <span style={{ color: colors.accent }}>{c.f.highlight}</span>
            </div>
            <div
              style={S({
                fontSize: 38,
                fontWeight: 500,
                lineHeight: 1.3,
                color: colors.darkTextMuted,
                marginTop: 26,
                maxWidth: 840,
              })}
            >
              {c.f.sub}
            </div>
            <div style={S({ display: 'flex', alignItems: 'center', gap: 24, marginTop: 40 })}>
              <span
                style={S({
                  background: colors.accent,
                  color: colors.accentText,
                  fontWeight: 800,
                  fontSize: 32,
                  padding: '22px 40px',
                  borderRadius: 999,
                  boxShadow: `0 12px 36px ${rgba(colors.accent, 0.4)}`,
                })}
              >
                {c.f.cta} →
              </span>
              <span
                style={S({
                  fontFamily: fonts.mono,
                  fontSize: 24,
                  color: colors.accent,
                })}
              >
                {client.offerLine}
              </span>
            </div>
            <div style={S({ flex: 1, position: 'relative', marginTop: 48 })}>
              {images.heroFrame === 'portrait' ? (
                <div style={adPortraitStyle}>
                  {!hasBg && (
                    <div
                      style={S({
                        position: 'absolute',
                        inset: '8% 6%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${rgba(colors.accent, 0.28)} 0%, ${rgba(colors.accent, 0)} 72%)`,
                        filter: 'blur(18px)',
                      })}
                    />
                  )}
                  <div
                    style={S({
                      position: 'absolute',
                      inset: 0,
                      padding: 18,
                      borderRadius: '42% 58% 48% 52% / 38% 42% 58% 62%',
                      background: hasBg ? rgba(colors.cream, 0.92) : colors.cream,
                      border: `2px solid ${rgba(colors.accent, 0.18)}`,
                      boxShadow: `0 38px 90px ${rgba(colors.ink, 0.25)}`,
                      overflow: 'hidden',
                    })}
                  >
                    <img
                      src={images.heroMedia}
                      style={S({
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        borderRadius: '38% 62% 46% 54% / 34% 38% 62% 66%',
                      })}
                    />
                  </div>
                </div>
              ) : (
                <div style={adPhoneStyle}>
                  <div
                    style={S({
                      width: '100%',
                      height: '100%',
                      borderRadius: 64,
                      border: '16px solid #14142B',
                      background: '#14142B',
                      boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                    })}
                  >
                    <img
                      src={images.heroMedia}
                      style={S({
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        borderRadius: 48,
                      })}
                    />
                  </div>
                  {heroAccentImage && (
                    <img
                      src={heroAccentImage}
                      style={S({
                        position: 'absolute',
                        top: -55,
                        right: -75,
                        width: 210,
                        height: 210,
                        objectFit: 'contain',
                        transform: 'rotate(10deg)',
                        filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.4))',
                      })}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {c.layout === 'statement' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.dark),
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              fontFamily: fonts.mono,
              fontSize: 26,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: colors.accent,
            })}
          >
            {c.f.eyebrow}
          </div>
          <div
            style={S({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            })}
          >
            <div
              style={S({
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: colors.darkText,
              })}
            >
              {c.f.line1}
            </div>
            <div
              style={S({
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: colors.accent,
              })}
            >
              {c.f.line2}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 20 })}>
            <img src={images.logo} style={S({ width: 64, height: 64, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 30, color: colors.darkText })}>
              {brandPrimary} <span style={{ color: colors.accent }}>{brandAccent}</span>
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                background: colors.accent,
                color: colors.accentText,
                fontWeight: 800,
                fontSize: 26,
                padding: '16px 26px',
                borderRadius: 999,
              })}
            >
              {client.ctaBadgeLong}
            </span>
          </div>
        </div>
      )}

      {c.layout === 'list' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.cream),
            display: 'flex',
            flexDirection: 'column',
            padding: '92px 84px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              fontFamily: fonts.mono,
              fontSize: 24,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: colors.accentSoft,
            })}
          >
            {c.f.eyebrow}
          </div>
          <div
            style={S({
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: colors.dark,
              margin: '14px 0 40px',
            })}
          >
            {c.f.title}
          </div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 })}>
            {[c.f.item1, c.f.item2, c.f.item3].map((item, i) => (
              <div key={i} style={S({ display: 'flex', alignItems: 'center', gap: 26 })}>
                <span
                  style={S({
                    width: 74,
                    height: 74,
                    flex: 'none',
                    borderRadius: 999,
                    background: colors.accent,
                    color: colors.accentText,
                    fontWeight: 800,
                    fontSize: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  {i + 1}
                </span>
                <span
                  style={S({
                    fontSize: 40,
                    fontWeight: 600,
                    color: colors.ink,
                    lineHeight: 1.15,
                  })}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
          <div
            style={S({
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              borderTop: `2px solid ${colors.line}`,
              paddingTop: 30,
            })}
          >
            <img src={images.logo} style={S({ width: 58, height: 58, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 28, color: colors.dark })}>{brandName}</span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                fontFamily: fonts.mono,
                fontSize: 22,
                color: colors.inkMuted,
              })}
            >
              {client.smallPrint}
            </span>
          </div>
        </div>
      )}

      {c.layout === 'question' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.accent),
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              fontFamily: fonts.mono,
              fontSize: 26,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: rgba(colors.accentText, 0.7),
            })}
          >
            Pergunta do dia
          </div>
          <div style={S({ flex: 1, display: 'flex', alignItems: 'center' })}>
            <div
              style={S({
                fontSize: 82,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: colors.accentText,
              })}
            >
              {c.f.question}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 22 })}>
            <span
              style={S({
                background: colors.dark,
                color: colors.accent,
                fontWeight: 800,
                fontSize: 34,
                padding: '20px 34px',
                borderRadius: 999,
              })}
            >
              👇 Comenta aqui
            </span>
            <div style={{ flex: 1 }} />
            <img src={badgeIcon} style={S({ width: 120, height: 120, objectFit: 'contain' })} />
          </div>
        </div>
      )}

      {c.layout === 'feature' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.dark),
            display: 'flex',
            flexDirection: 'column',
            padding: '92px 84px',
            ...layerZ,
          })}
        >
          <span
            style={S({
              alignSelf: 'flex-start',
              background: colors.accent,
              color: colors.accentText,
              fontFamily: fonts.mono,
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: '0.12em',
              padding: '12px 22px',
              borderRadius: 999,
            })}
          >
            {c.f.badge}
          </span>
          <div
            style={S({
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.03,
              letterSpacing: '-0.035em',
              color: colors.darkText,
              margin: '34px 0 22px',
            })}
          >
            {c.f.headline}
          </div>
          <div
            style={S({
              fontSize: 38,
              fontWeight: 500,
              lineHeight: 1.3,
              color: colors.darkTextMuted,
              maxWidth: 820,
            })}
          >
            {c.f.sub}
          </div>
          <div style={{ flex: 1 }} />
          <div style={S({ display: 'flex', alignItems: 'center', gap: 20 })}>
            <img src={images.logo} style={S({ width: 64, height: 64, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 30, color: colors.darkText })}>
              {brandPrimary} <span style={{ color: colors.accent }}>{brandAccent}</span>
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                background: colors.accent,
                color: colors.accentText,
                fontWeight: 800,
                fontSize: 26,
                padding: '16px 26px',
                borderRadius: 999,
              })}
            >
              {client.ctaBadgeShort}
            </span>
          </div>
        </div>
      )}

      {c.layout === 'quote' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.surfaceAlt),
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              fontFamily: fonts.serif,
              fontSize: 200,
              lineHeight: 0.6,
              color: colors.accent,
              height: 110,
            })}
          >
            &ldquo;
          </div>
          <div style={S({ flex: 1, display: 'flex', alignItems: 'center' })}>
            <div
              style={S({
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontSize: 82,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: colors.dark,
              })}
            >
              {c.f.quote}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 18 })}>
            <img src={images.logo} style={S({ width: 58, height: 58, objectFit: 'contain' })} />
            <span
              style={S({
                fontFamily: fonts.mono,
                fontSize: 24,
                letterSpacing: '0.06em',
                color: colors.inkMuted,
              })}
            >
              — {brandName}
            </span>
          </div>
        </div>
      )}

      {c.layout === 'myth' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor(colors.cream),
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 80px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              flex: 1,
              background: '#fff',
              border: `2px solid ${colors.line}`,
              borderRadius: 26,
              padding: 52,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginBottom: 26,
            })}
          >
            <span
              style={S({
                alignSelf: 'flex-start',
                fontFamily: fonts.mono,
                fontSize: 26,
                letterSpacing: '0.16em',
                color: '#B83A36',
                background: 'rgba(184,58,54,.1)',
                padding: '8px 18px',
                borderRadius: 999,
                marginBottom: 22,
              })}
            >
              ✕ MITO
            </span>
            <div
              style={S({
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.15,
                color: colors.inkMuted,
              })}
            >
              {c.f.myth}
            </div>
          </div>
          <div
            style={S({
              flex: 1,
              background: colors.dark,
              borderRadius: 26,
              padding: 52,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            })}
          >
            <span
              style={S({
                alignSelf: 'flex-start',
                fontFamily: fonts.mono,
                fontSize: 26,
                letterSpacing: '0.16em',
                color: colors.accentText,
                background: colors.accent,
                padding: '8px 18px',
                borderRadius: 999,
                marginBottom: 22,
              })}
            >
              ✓ VERDADE
            </span>
            <div
              style={S({
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.18,
                color: colors.darkText,
              })}
            >
              {c.f.truth}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 })}>
            <img src={images.logo} style={S({ width: 52, height: 52, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 26, color: colors.dark })}>{brandName}</span>
          </div>
        </div>
      )}
    </div>
  )
}
