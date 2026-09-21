import { erc20Abi, type Address } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { lendingVaultAbi } from '../contracts/LendingVault'
import { sunTokenAbi } from '../contracts/SunToken'
import type { VaultState } from './useVault'

/**
 * The connected wallet against one vault: its claim tokens, what they are worth, and the EURC it
 * has to subscribe or repay with.
 */
export function usePosition(vaultAddress: Address, vault: VaultState | undefined) {
  const { address: account } = useAccount()

  const query = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: vault?.claimToken,
        abi: sunTokenAbi,
        functionName: 'balanceOf',
        args: [account!, vault?.tokenId ?? 0n],
      },
      {
        address: vault?.collateralToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account!],
      },
      {
        address: vault?.collateralToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account!, vaultAddress],
      },
      {
        address: vault?.collateralToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [vaultAddress],
      },
    ],
    query: { enabled: !!account && !!vault },
  })

  const claimBalance = query.data?.[0]

  // Quoted by the vault for the whole holding at once. Its rounding is what redemption pays, and
  // a per-token rate multiplied up here would not match it.
  const { data: claimValue, refetch: refetchValue } = useReadContract({
    address: vaultAddress,
    abi: lendingVaultAbi,
    functionName: 'claimValue',
    args: [claimBalance ?? 0n],
    query: { enabled: claimBalance !== undefined },
  })

  return {
    account,
    claimBalance,
    claimValue,
    eurcBalance: query.data?.[1],
    allowance: query.data?.[2],
    vaultEurcBalance: query.data?.[3],
    refetch: () => Promise.all([query.refetch(), refetchValue()]),
  }
}

export type Position = ReturnType<typeof usePosition>
