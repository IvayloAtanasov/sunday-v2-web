import { arcTestnet } from 'viem/chains'

/** The one network the app talks to. Every vault address the API hands out lives here. */
export const chain = arcTestnet

// The chain's public endpoint is shared and rate-limited, so a keyed provider can be swapped in
// through the environment.
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || chain.rpcUrls.default.http[0]

const explorer = chain.blockExplorers.default.url

export const addressUrl = (address: string) => `${explorer}/address/${address}`
export const txUrl = (hash: string) => `${explorer}/tx/${hash}`
