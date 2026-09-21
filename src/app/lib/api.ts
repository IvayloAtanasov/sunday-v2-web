import type { Address } from 'viem'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://p3yujenss0.execute-api.eu-central-1.amazonaws.com/staging'

/**
 * An installation as the backend lists it. The backend only says where a vault is and how to
 * draw it; everything about the money is read from the vault itself.
 */
export type Installation = {
  _id: string
  stationId: string
  tokenId: number
  vaultAddress: Address
  timezone: string
  imageUrl: string
}

export async function fetchInstallations(): Promise<Installation[]> {
  const res = await fetch(`${API_URL}/installations`)
  if (!res.ok) throw new Error(`Installations request responded ${res.status}`)
  return res.json()
}
