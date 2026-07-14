import { dindinClient } from './dindin'
import { rachelClient } from './rachel'
import type { ClientConfig } from './types'

export type { ClientConfig } from './types'

export const CLIENTS: Record<string, ClientConfig> = {
  dindin: dindinClient,
  rachel: rachelClient,
}

export type ClientId = keyof typeof CLIENTS

export const DEFAULT_CLIENT: ClientId = 'dindin'

export const CLIENT_LIST: ClientConfig[] = [dindinClient, rachelClient]

/** Retorna a config do cliente pelo id, caindo pro padrão se não existir. */
export function getClient(id: string | null | undefined): ClientConfig {
  if (id && CLIENTS[id]) return CLIENTS[id]
  return CLIENTS[DEFAULT_CLIENT]
}
