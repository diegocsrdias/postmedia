/**
 * Cliente do backend (Vercel Functions em /api).
 * A chave da OpenAI vive SÓ no servidor — o navegador nunca a vê.
 *
 * Base configurável via VITE_API_BASE (padrão: mesma origem, '/api').
 */

import type { Creative, Format } from '../types'
import { EDIT_FIELDS } from '../data/shared'
import { deriveVcap } from './creatives'

const BASE = import.meta.env.VITE_API_BASE || '/api'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Erro ${res.status}`)
  }
  return data as T
}

/** Gera `n` conceitos de ANÚNCIO via backend. */
export async function generateAds(
  n: number,
  existingHeadlines: string,
  clientId: string,
): Promise<Creative[]> {
  const { items } = await post<{ items: RawAd[] }>('generate-ads', {
    n,
    existingHeadlines,
    clientId,
  })
  const fresh = (items || [])
    .filter((x) => x && x.f && x.f.headline)
    .slice(0, n)
    .map((x, i) => {
      const f = { ...x.f }
      return {
        layout: 'ad' as const,
        angle: 'anuncio' as const,
        f,
        caption: x.caption || '',
        hashtags: x.hashtags || '',
        vcap: (x.vcap && String(x.vcap).trim()) || deriveVcap('ad', f),
        _key: 'ad-ai-' + Date.now() + '-' + i,
      }
    })
  if (!fresh.length) throw new Error('empty')
  return fresh
}

/** Gera `n` criativos amarrando um tema em alta via backend. */
export async function generateByTheme(
  n: number,
  theme: string,
  clientId: string,
): Promise<Creative[]> {
  const { items } = await post<{ items: RawThemed[] }>('generate-theme', {
    n,
    theme,
    clientId,
  })
  const valid = (items || []).filter((x) => x && x.layout && EDIT_FIELDS[x.layout] && x.f)
  if (!valid.length) throw new Error('empty')
  return valid.slice(0, n).map((x, i) => {
    const layout = x.layout!
    const f = { ...x.f }
    return {
      layout,
      angle: 'tema' as const,
      f,
      caption: x.caption || '',
      hashtags: x.hashtags || '',
      vcap: (x.vcap && String(x.vcap).trim()) || deriveVcap(layout, f),
      _key: 'tema-' + i + '-' + Math.random().toString(36).slice(2, 7),
    }
  })
}

/**
 * Gera uma imagem de fundo por IA a partir do texto do post.
 * O servidor usa a IA de texto para bolar (de forma aleatória) uma cena que
 * faça sentido com o conteúdo, e então gera a imagem dessa cena.
 * Retorna a data URL (PNG) e a ideia de cena usada.
 */
export async function generateImage(
  postText: string,
  format: Format,
  clientId: string,
): Promise<{ image: string; idea: string }> {
  return post<{ image: string; idea: string }>('generate-image', { postText, format, clientId })
}

interface RawAd {
  f?: Record<string, string>
  caption?: string
  hashtags?: string
  vcap?: string
}

interface RawThemed {
  layout?: keyof typeof EDIT_FIELDS
  f?: Record<string, string>
  caption?: string
  hashtags?: string
  vcap?: string
}
