import type { Address } from 'viem'
import { useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { sunTokenAbi } from '../contracts/SunToken'
import { fetchTokenMetadata } from '../lib/metadata'

/**
 * The claim token's metadata, resolved from the URI the token itself reports rather than from the
 * backend, so what a lender sees described is what the token they hold points at.
 */
export function useTokenMetadata(claimToken: Address | undefined, tokenId: bigint | undefined) {
  const { data: uri } = useReadContract({
    address: claimToken,
    abi: sunTokenAbi,
    functionName: 'uri',
    args: tokenId === undefined ? undefined : [tokenId],
    query: { enabled: !!claimToken && tokenId !== undefined, staleTime: Infinity },
  })

  const metadata = useQuery({
    queryKey: ['token-metadata', uri],
    queryFn: () => fetchTokenMetadata(uri!),
    enabled: !!uri,
    // Content-addressed: the same URI can never resolve to something else.
    staleTime: Infinity,
  })

  return { uri, metadata: metadata.data, error: metadata.error }
}
