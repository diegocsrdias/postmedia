/**
 * Ícones da INTERFACE (traço 1.75, 24×24, herdam `currentColor`).
 *
 * Substituem os emojis da casca da ferramenta: renderizam igual em qualquer
 * sistema, alinham com o texto e respeitam a cor do contexto. Emojis continuam
 * valendo só DENTRO da arte gerada (CreativeCanvas), que é conteúdo do cliente.
 */
import type { CSSProperties, ReactNode } from 'react'

const PATHS = {
  sparkles: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ),
  studio: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </>
  ),
  history: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 6-7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 17v2.5A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5V17" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 01-15.5 6.2L3 16" />
      <path d="M3 12a9 9 0 0115.5-6.2L21 8" />
      <path d="M21 3v5h-5M3 21v-5h5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.8" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  imageOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.4 5H18.5A2.5 2.5 0 0121 7.5v8.1M21 21H5.5A2.5 2.5 0 013 18.5V5" />
      <path d="M3 17l5-5 3 3" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v2a1 1 0 001 1h3l6 5V5L7 10H4a1 1 0 00-1 1z" />
      <path d="M17 8a5 5 0 010 8" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="5.5" width="14" height="13" rx="2.5" />
      <path d="M16.5 10l5-3v10l-5-3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 2l10 5-10 5L2 7z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </>
  ),
  square: <rect x="4" y="4" width="16" height="16" rx="2.5" />,
  portrait: <rect x="7" y="2.5" width="10" height="19" rx="2.5" />,
  flask: (
    <>
      <path d="M9 3h6M10 3v6L4.5 19A1.5 1.5 0 005.8 21h12.4a1.5 1.5 0 001.3-2L14 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M20 6L9 17l-5-5" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5V6" />
      <path d="M5.5 6l1 14a1.5 1.5 0 001.5 1.4h8a1.5 1.5 0 001.5-1.4l1-14" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 01-3 3H3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 3A2.5 2.5 0 007 5.5v.2A3 3 0 004.5 9a3 3 0 00.4 4.9A3 3 0 007.5 19H9.5a2.5 2.5 0 002.5-2.5V5.5A2.5 2.5 0 009.5 3z" />
      <path d="M14.5 3A2.5 2.5 0 0117 5.5v.2A3 3 0 0119.5 9a3 3 0 01-.4 4.9 3 3 0 01-2.6 5.1H14.5a2.5 2.5 0 01-2.5-2.5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  heart: <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  share: (
    <>
      <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
      <path d="M16 6l-4-4-4 4M12 2v13" />
    </>
  ),
  message: <path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.8 8.8 0 01-4-.9L3 20.5l1.5-4.2A8.4 8.4 0 1121 11.5z" />,
  external: (
    <>
      <path d="M15 3h6v6M10 14L21 3" />
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    </>
  ),
  type: (
    <>
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </>
  ),
  text: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </>
  ),
  hash: <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />,
  flame: <path d="M12 22c4 0 7-2.7 7-7 0-3-1.6-5.4-3.5-7.2-.4 1.8-1.5 3-2.8 3.2.3-2.8-.9-6-3.7-8 .2 3-1.5 5-3.1 6.9C4.8 11.2 5 12.8 5 15c0 4.3 3 7 7 7z" />,
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5h13L22 12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M12.2 6.2l-1.4-1.4" />
      <path d="M15 9L3 21" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  dots: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 18,
  stroke = 1.75,
  style,
  className,
}: {
  name: IconName
  size?: number
  stroke?: number
  style?: CSSProperties
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ flex: 'none', display: 'block', ...style }}
    >
      {PATHS[name]}
    </svg>
  )
}
