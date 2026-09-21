import { useState } from 'react'
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError, type Hash } from 'viem'
import { useConfig, type Config } from 'wagmi'
import {
  getAccount,
  switchChain,
  waitForTransactionReceipt,
  writeContract,
  type WriteContractParameters,
} from 'wagmi/actions'
import { chain } from '../lib/chain'

/**
 * One transaction in a sequence. `simulate` is a thunk so each call site keeps full ABI typing
 * on its own `simulateContract` call; only the prepared request crosses into this hook.
 */
export type ActionStep = {
  label: string
  simulate: (config: Config) => Promise<{ request: unknown }>
}

export type ActionStatus =
  | { state: 'idle' }
  | { state: 'signing'; label: string }
  | { state: 'confirming'; label: string; hash: Hash }
  | { state: 'done'; hash: Hash }
  | { state: 'error'; message: string }

/**
 * Runs contract calls one after another, each waited on before the next is sent, so an approval
 * has landed before the call that spends it is simulated.
 *
 * Every call is simulated first. Beyond catching a revert before the wallet asks for a signature,
 * that is what turns a revert into the contract's own named error; a wallet only ever reports
 * that a transaction failed.
 */
export function useContractAction(onSettled?: () => unknown) {
  const config = useConfig()
  const [status, setStatus] = useState<ActionStatus>({ state: 'idle' })

  const run = async (steps: ActionStep[]) => {
    let hash: Hash | undefined

    try {
      if (getAccount(config).chainId !== chain.id) {
        await switchChain(config, { chainId: chain.id })
      }

      for (const step of steps) {
        setStatus({ state: 'signing', label: step.label })

        const { request } = await step.simulate(config)
        hash = await writeContract(config, request as WriteContractParameters)

        setStatus({ state: 'confirming', label: step.label, hash })

        const receipt = await waitForTransactionReceipt(config, { hash })
        if (receipt.status !== 'success') throw new Error(`${step.label} failed on chain`)
      }

      setStatus(hash ? { state: 'done', hash } : { state: 'idle' })
    } catch (err) {
      console.error(err)
      setStatus({ state: 'error', message: describeError(err) })
    } finally {
      await onSettled?.()
    }
  }

  const busy = status.state === 'signing' || status.state === 'confirming'

  return { run, status, busy, reset: () => setStatus({ state: 'idle' }) }
}

/** What each vault error means to the person who just clicked the button. */
const REVERT_MESSAGES: Record<string, string> = {
  WrongPhase: 'The vault has moved to a different phase. The page will refresh with its current state.',
  ZeroAmount: 'Enter an amount above zero.',
  ExceedsTarget: 'That is more than the raise has left to fill.',
  NotBorrower: 'Only the borrower can do this.',
  NotActivator: 'Only the activator can do this.',
  AlreadyDrawnDown: 'The principal has already been drawn down.',
  NotDrawnDown: 'The principal has to be drawn down before the installation can be activated.',
  AlreadyActivated: 'The installation has already been activated.',
  AlreadyFinalized: 'The vault has already been finalized.',
  NotFinalizable:
    'Not yet: the obligation is not fully repaid and the grace window after maturity is still open.',
  ClaimsOutstanding: 'Claim tokens are still outstanding. Every lender has to redeem first.',
}

export function describeError(err: unknown): string {
  if (!(err instanceof BaseError)) {
    return err instanceof Error ? err.message : 'Something went wrong.'
  }

  if (err.walk(e => e instanceof UserRejectedRequestError)) return 'Cancelled in the wallet.'

  const revert = err.walk(e => e instanceof ContractFunctionRevertedError)
  if (revert instanceof ContractFunctionRevertedError) {
    const name = revert.data?.errorName
    if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name]
    if (revert.reason) return revert.reason
  }

  return err.shortMessage
}
