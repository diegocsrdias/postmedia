// Composição do vídeo final com ffmpeg: pega a gravação crua do app (formato de
// celular) e monta o Reel/Story 9:16 — fundo da marca, o "telefone" centralizado,
// legendas sincronizadas pela linha do tempo e o CTA no fim (texto vindo dos
// FATOS APROVADOS do playbook, nunca inventado).
//
// Uma única passada de ffmpeg (sem concat) para ser robusto. Áudio: uma trilha
// silenciosa, só para o Instagram aceitar (a API não escolhe áudio de tendência).

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

const FONT = process.env.FFMPEG_FONT || '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

/** Escapa o texto para o filtro drawtext do ffmpeg. */
function esc(t) {
  return String(t)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%')
}

/** Monta os filtros drawtext (legendas + CTA) a partir da linha do tempo. */
function drawtexts(captions) {
  return captions
    .map((c) => {
      const y = 'h*0.70'
      return (
        `drawtext=fontfile='${FONT}':text='${esc(c.text)}':` +
        `fontsize=52:fontcolor=white:borderw=0:box=1:boxcolor=0x000000AA:boxborderw=26:` +
        `x=(w-text_w)/2:y=${y}:enable='between(t,${c.start.toFixed(2)},${c.end.toFixed(2)})'`
      )
    })
    .join(',')
}

/**
 * Gera o mp4 final (1080x1920, h264/aac).
 * `bg` é a cor de fundo da marca (hex 0xRRGGBB).
 */
export async function compose({ videoPath, outPath, captions, durationSec, bg = '0x303078' }) {
  const dur = Math.max(3, Math.ceil(durationSec))
  const chain =
    `[0:v]scale=980:-2[app];` +
    `color=c=${bg}:s=1080x1920:d=${dur}[bgv];` +
    `[bgv][app]overlay=(W-w)/2:(H-h)/2[base];` +
    `[base]${drawtexts(captions)}[v]`

  const args = [
    '-y',
    '-i', videoPath,
    '-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=44100:cl=stereo',
    '-filter_complex', chain,
    '-map', '[v]', '-map', '1:a',
    '-t', String(dur),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    outPath,
  ]
  await run('ffmpeg', args, { maxBuffer: 1024 * 1024 * 64 })
  return outPath
}
