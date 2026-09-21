import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { lendingVaultAbi } from '../contracts/LendingVault'
import { Phase } from '../lib/phase'

/**
 * Phase transitions are derived from block time rather than pushed, so a vault can change phase
 * with no transaction to observe. Polling is the only way to notice.
 */
const REFRESH_MS = 20_000

export type VaultState = ReturnType<typeof toVaultState>

/**
 * Everything the app shows about one vault, read in a single multicall so the figures on a page
 * all come from the same block and can never disagree with each other.
 */
export function useVault(address: Address) {
  const vault = { address, abi: lendingVaultAbi } as const

  const query = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...vault, functionName: 'phase' },
      { ...vault, functionName: 'principal' },
      { ...vault, functionName: 'subscribed' },
      { ...vault, functionName: 'owed' },
      { ...vault, functionName: 'cumulativeYield' },
      { ...vault, functionName: 'repaid' },
      { ...vault, functionName: 'settled' },
      { ...vault, functionName: 'surplus' },
      { ...vault, functionName: 'shortfall' },
      { ...vault, functionName: 'outstandingSupply' },
      { ...vault, functionName: 'fundingDeadline' },
      { ...vault, functionName: 'activationDeadline' },
      { ...vault, functionName: 'activationWindow' },
      { ...vault, functionName: 'activatedAt' },
      { ...vault, functionName: 'maturity' },
      { ...vault, functionName: 'term' },
      { ...vault, functionName: 'graceWindow' },
      { ...vault, functionName: 'lastRebasedAt' },
      { ...vault, functionName: 'maxRebaseDeltaRatio' },
      { ...vault, functionName: 'drawnDown' },
      { ...vault, functionName: 'finalized' },
      { ...vault, functionName: 'defaulted' },
      { ...vault, functionName: 'borrower' },
      { ...vault, functionName: 'activator' },
      { ...vault, functionName: 'rebaseAdapter' },
      { ...vault, functionName: 'collateralToken' },
      { ...vault, functionName: 'collateralDecimals' },
      { ...vault, functionName: 'claimToken' },
      { ...vault, functionName: 'tokenId' },
    ],
    query: {
      refetchInterval: REFRESH_MS,
      select: toVaultState,
    },
  })

  return { ...query, vault: query.data }
}

function toVaultState([
  phase,
  principal,
  subscribed,
  owed,
  cumulativeYield,
  repaid,
  settled,
  surplus,
  shortfall,
  outstandingSupply,
  fundingDeadline,
  activationDeadline,
  activationWindow,
  activatedAt,
  maturity,
  term,
  graceWindow,
  lastRebasedAt,
  maxRebaseDeltaRatio,
  drawnDown,
  finalized,
  defaulted,
  borrower,
  activator,
  rebaseAdapter,
  collateralToken,
  collateralDecimals,
  claimToken,
  tokenId,
]: readonly [
  number, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint,
  bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint,
  boolean, boolean, boolean,
  Address, Address, Address, Address, number, Address, bigint,
]) {
  return {
    phase: phase as Phase,
    principal,
    subscribed,
    owed,
    cumulativeYield,
    repaid,
    settled,
    surplus,
    shortfall,
    outstandingSupply,
    fundingDeadline,
    activationDeadline,
    activationWindow,
    activatedAt,
    maturity,
    term,
    graceWindow,
    lastRebasedAt: BigInt(lastRebasedAt),
    maxRebaseDeltaRatio,
    drawnDown,
    finalized,
    defaulted,
    borrower,
    activator,
    rebaseAdapter,
    collateralToken,
    collateralDecimals,
    claimToken,
    tokenId,
  }
}
