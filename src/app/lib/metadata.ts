import { fetchIpfsJson } from './ipfs'

export type TokenMetadata = {
  name: string
  description: string
  image?: string
  documents?: Record<string, string>
  properties?: {
    area?: string
    capacity?: string
    location?: string
  }
}

export const fetchTokenMetadata = (uri: string) => fetchIpfsJson<TokenMetadata>(uri)

/** `notaryAct` → `Notary act`. The metadata keys its documents in camelCase. */
export function documentLabel(key: string): string {
  const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
