import type { CSSProperties } from 'react'
import type { Creative } from '../types'
import logo from '../assets/logo-dindin.png'
import mascote from '../assets/mascote-porquinho.png'
import screenshot from '../assets/app-screenshot.png'

const S = (o: CSSProperties) => o

/**
 * Layouts com texto claro sobre fundo escuro — onde uma imagem de IA + véu
 * escuro mantém o texto legível. (question/list/quote/myth usam texto escuro
 * e não recebem imagem de fundo.)
 */
export const IMAGE_FRIENDLY = new Set(['ad', 'statement', 'feature'])

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
}: {
  c: Creative
  idx: number
  square: boolean
  scaleStr: string
  innerW: number
  innerH: number
}) {
  const hasBg = Boolean(c.bgImage)
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

  return (
    <div
      data-cap={idx}
      style={{
        width: innerW,
        height: innerH,
        transform: `scale(${scaleStr})`,
        transformOrigin: 'top left',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {c.bgImage && (
        <>
          <img
            src={c.bgImage}
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          {/* véu para manter o texto legível sobre a imagem gerada */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(20,20,43,0.35) 0%, rgba(20,20,43,0.72) 100%)',
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
            background: bgFor('#303078'),
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
                background:
                  'radial-gradient(circle,rgba(192,216,48,0.32) 0%,rgba(192,216,48,0) 65%)',
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
                border: '80px solid rgba(192,216,48,0.14)',
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
                  background: '#C0D830',
                  color: '#303078',
                  fontFamily: "'JetBrains Mono', monospace",
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
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  letterSpacing: '0.1em',
                  color: '#8B8BC4',
                })}
              >
                controledindin.com.br
              </span>
            </div>
            <div
              style={S({
                fontSize: 92,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: '#F6F2EA',
                marginTop: 44,
              })}
            >
              {c.f.headline} <span style={{ color: '#C0D830' }}>{c.f.highlight}</span>
            </div>
            <div
              style={S({
                fontSize: 38,
                fontWeight: 500,
                lineHeight: 1.3,
                color: '#C6C6E4',
                marginTop: 26,
                maxWidth: 840,
              })}
            >
              {c.f.sub}
            </div>
            <div style={S({ display: 'flex', alignItems: 'center', gap: 24, marginTop: 40 })}>
              <span
                style={S({
                  background: '#C0D830',
                  color: '#303078',
                  fontWeight: 800,
                  fontSize: 32,
                  padding: '22px 40px',
                  borderRadius: 999,
                  boxShadow: '0 12px 36px rgba(192,216,48,0.4)',
                })}
              >
                {c.f.cta} →
              </span>
              <span
                style={S({
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  color: '#C0D830',
                })}
              >
                10 dias grátis · sem cartão
              </span>
            </div>
            <div style={S({ flex: 1, position: 'relative', marginTop: 48 })}>
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
                    src={screenshot}
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
                <img
                  src={mascote}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {c.layout === 'statement' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor('#303078'),
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
            ...layerZ,
          })}
        >
          <div
            style={S({
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 26,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C0D830',
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
                color: '#F6F2EA',
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
                color: '#C0D830',
              })}
            >
              {c.f.line2}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 20 })}>
            <img src={logo} style={S({ width: 64, height: 64, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 30, color: '#F6F2EA' })}>
              Controle <span style={{ color: '#C0D830' }}>DinDin</span>
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                background: '#C0D830',
                color: '#303078',
                fontWeight: 800,
                fontSize: 26,
                padding: '16px 26px',
                borderRadius: 999,
              })}
            >
              Teste 10 dias grátis 🐷
            </span>
          </div>
        </div>
      )}

      {c.layout === 'list' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: '#F6F2EA',
            display: 'flex',
            flexDirection: 'column',
            padding: '92px 84px',
          })}
        >
          <div
            style={S({
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#9DB320',
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
              color: '#303078',
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
                    background: '#C0D830',
                    color: '#303078',
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
                    color: '#14142B',
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
              borderTop: '2px solid #DCD3BD',
              paddingTop: 30,
            })}
          >
            <img src={logo} style={S({ width: 58, height: 58, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 28, color: '#303078' })}>
              Controle DinDin
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                color: '#8B8BA8',
              })}
            >
              controledindin.com.br
            </span>
          </div>
        </div>
      )}

      {c.layout === 'question' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: '#C0D830',
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
          })}
        >
          <div
            style={S({
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 26,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#303078',
              opacity: 0.7,
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
                color: '#303078',
              })}
            >
              {c.f.question}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 22 })}>
            <span
              style={S({
                background: '#303078',
                color: '#C0D830',
                fontWeight: 800,
                fontSize: 34,
                padding: '20px 34px',
                borderRadius: 999,
              })}
            >
              👇 Comenta aqui
            </span>
            <div style={{ flex: 1 }} />
            <img src={mascote} style={S({ width: 120, height: 120, objectFit: 'contain' })} />
          </div>
        </div>
      )}

      {c.layout === 'feature' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: bgFor('#303078'),
            display: 'flex',
            flexDirection: 'column',
            padding: '92px 84px',
            ...layerZ,
          })}
        >
          <span
            style={S({
              alignSelf: 'flex-start',
              background: '#C0D830',
              color: '#303078',
              fontFamily: "'JetBrains Mono', monospace",
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
              color: '#F6F2EA',
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
              color: '#C6C6E4',
              maxWidth: 820,
            })}
          >
            {c.f.sub}
          </div>
          <div style={{ flex: 1 }} />
          <div style={S({ display: 'flex', alignItems: 'center', gap: 20 })}>
            <img src={logo} style={S({ width: 64, height: 64, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 30, color: '#F6F2EA' })}>
              Controle <span style={{ color: '#C0D830' }}>DinDin</span>
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={S({
                background: '#C0D830',
                color: '#303078',
                fontWeight: 800,
                fontSize: 26,
                padding: '16px 26px',
                borderRadius: 999,
              })}
            >
              Teste grátis 🐷
            </span>
          </div>
        </div>
      )}

      {c.layout === 'quote' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: '#EEE7D8',
            display: 'flex',
            flexDirection: 'column',
            padding: '96px 88px',
          })}
        >
          <div
            style={S({
              fontFamily: "'Instrument Serif', serif",
              fontSize: 200,
              lineHeight: 0.6,
              color: '#C0D830',
              height: 110,
            })}
          >
            &ldquo;
          </div>
          <div style={S({ flex: 1, display: 'flex', alignItems: 'center' })}>
            <div
              style={S({
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontSize: 82,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: '#303078',
              })}
            >
              {c.f.quote}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 18 })}>
            <img src={logo} style={S({ width: 58, height: 58, objectFit: 'contain' })} />
            <span
              style={S({
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 24,
                letterSpacing: '0.06em',
                color: '#4A4A6A',
              })}
            >
              — Controle DinDin
            </span>
          </div>
        </div>
      )}

      {c.layout === 'myth' && (
        <div
          style={S({
            position: 'absolute',
            inset: 0,
            background: '#F6F2EA',
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 80px',
          })}
        >
          <div
            style={S({
              flex: 1,
              background: '#fff',
              border: '2px solid #DCD3BD',
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
                fontFamily: "'JetBrains Mono', monospace",
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
            <div style={S({ fontSize: 52, fontWeight: 700, lineHeight: 1.15, color: '#8B8BA8' })}>
              {c.f.myth}
            </div>
          </div>
          <div
            style={S({
              flex: 1,
              background: '#303078',
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 26,
                letterSpacing: '0.16em',
                color: '#303078',
                background: '#C0D830',
                padding: '8px 18px',
                borderRadius: 999,
                marginBottom: 22,
              })}
            >
              ✓ VERDADE
            </span>
            <div style={S({ fontSize: 52, fontWeight: 700, lineHeight: 1.18, color: '#F6F2EA' })}>
              {c.f.truth}
            </div>
          </div>
          <div style={S({ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 })}>
            <img src={logo} style={S({ width: 52, height: 52, objectFit: 'contain' })} />
            <span style={S({ fontWeight: 800, fontSize: 26, color: '#303078' })}>
              Controle DinDin
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
