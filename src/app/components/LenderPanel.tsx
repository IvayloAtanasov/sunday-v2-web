import { erc20Abi, type Address } from 'viem'
import { useSimulateContract } from 'wagmi'
import { simulateContract } from 'wagmi/actions'
import { lendingVaultAbi } from '../contracts/LendingVault'
import type { VaultState } from '../hooks/useVault'
import type { Position } from '../hooks/usePosition'
import { useContractAction, type ActionStep } from '../hooks/useContractAction'
import { Phase } from '../lib/phase'
import { formatEur } from '../lib/format'
import AmountForm from './AmountForm'
import { ActionStatusLine, Row, Rows } from './ui'
import s from '../app/app.module.css'

type Props = {
  vaultAddress: Address
  vault: VaultState
  position: Position
  onChange: () => unknown
}

/**
 * What the connected wallet holds in this vault, and the one thing a lender can do with it in the
 * current phase: subscribe while funding, get their money back if the raise failed, redeem once
 * settled. In every other phase a lender simply holds.
 */
export default function LenderPanel({ vaultAddress, vault, position, onChange }: Props) {
  const { run, status, busy } = useContractAction(onChange)
  const eur = (value: bigint) => formatEur(value, vault.collateralDecimals)
  const vaultContract = { address: vaultAddress, abi: lendingVaultAbi } as const

  const claimBalance = position.claimBalance ?? 0n
  const eurcBalance = position.eurcBalance ?? 0n
  const remaining = vault.principal - vault.subscribed

  const subscribe = (amount: bigint) => {
    const steps: ActionStep[] = []

    // Approve exactly the amount, not an unlimited allowance: the vault never needs more than
    // this one subscription.
    if ((position.allowance ?? 0n) < amount) {
      steps.push({
        label: 'Approve EURC',
        simulate: config =>
          simulateContract(config, {
            address: vault.collateralToken,
            abi: erc20Abi,
            functionName: 'approve',
            args: [vaultAddress, amount],
          }),
      })
    }

    steps.push({
      label: 'Subscribe',
      simulate: config => simulateContract(config, { ...vaultContract, functionName: 'subscribe', args: [amount] }),
    })

    return run(steps)
  }

  const burnAll = (functionName: 'refund' | 'redeem', label: string) =>
    run([
      {
        label,
        simulate: config => simulateContract(config, { ...vaultContract, functionName, args: [claimBalance] }),
      },
    ])

  return (
    <section className={s.panel}>
      <h2 className={s.panelTitle}>Your position</h2>
      <p className={s.panelText}>
        Claim tokens are issued 1:1 for EURC subscribed and are what the vault repays against.
      </p>

      <Rows>
        <Row label="Claim tokens">{eur(claimBalance)}</Row>
        {claimBalance > 0n && position.claimValue !== undefined && (
          <Row label={vault.finalized ? 'Pays out' : 'Worth today'}>
            <span className={s.money}>{eur(position.claimValue)}</span>
          </Row>
        )}
        <Row label="EURC in wallet">{eur(eurcBalance)}</Row>
      </Rows>

      <div className={s.actions} style={{ marginTop: 24 }}>
        {vault.phase === Phase.Funding && (
          <div className={s.action}>
            <p className={s.actionHead}>Subscribe</p>
            <p className={s.hint}>
              The raise fills exactly or not at all. If it has not filled by the deadline, you can
              take your EURC back 1:1.
            </p>
            <AmountForm
              decimals={vault.collateralDecimals}
              max={remaining < eurcBalance ? remaining : eurcBalance}
              maxLabel={remaining < eurcBalance ? 'Left to raise' : 'Your EURC balance'}
              submitLabel={amount => (amount ? `Subscribe ${eur(amount)}` : 'Subscribe')}
              onSubmit={subscribe}
              disabled={busy}
            />
          </div>
        )}

        {vault.phase === Phase.Failed && claimBalance > 0n && (
          <div className={s.action}>
            <p className={s.actionHead}>Refund</p>
            <p className={s.hint}>Return your claim tokens for the EURC you subscribed.</p>
            <button className={s.button} disabled={busy} onClick={() => burnAll('refund', 'Refund')}>
              Refund {eur(claimBalance)}
            </button>
          </div>
        )}

        {vault.phase === Phase.Redemption && claimBalance > 0n && (
          <div className={s.action}>
            <p className={s.actionHead}>Redeem</p>
            <p className={s.hint}>Burn your claim tokens for your share of the settled pot.</p>
            <button className={s.button} disabled={busy} onClick={() => burnAll('redeem', 'Redeem')}>
              Redeem for {eur(position.claimValue ?? 0n)}
            </button>
          </div>
        )}

        <Finalize vaultAddress={vaultAddress} vault={vault} busy={busy} run={run} />

        <ActionStatusLine status={status} />
      </div>
    </section>
  )
}

/**
 * Anyone may finalize once the obligation is covered, or once the grace window has closed. Rather
 * than re-derive those conditions here, the call is simulated and the button only appears when the
 * vault itself would accept it.
 */
function Finalize({
  vaultAddress,
  vault,
  busy,
  run,
}: {
  vaultAddress: Address
  vault: VaultState
  busy: boolean
  run: (steps: ActionStep[]) => Promise<void>
}) {
  const candidate =
    !vault.finalized &&
    (vault.phase === Phase.Accruing || vault.phase === Phase.Settlement || vault.phase === Phase.Default)

  const { data } = useSimulateContract({
    address: vaultAddress,
    abi: lendingVaultAbi,
    functionName: 'finalize',
    query: { enabled: candidate },
  })

  if (!candidate || !data) return null

  return (
    <div className={s.action}>
      <p className={s.actionHead}>Finalize</p>
      <p className={s.hint}>
        Fixes what is paid out and opens redemption. Anyone can do this now; it only needs doing once.
      </p>
      <button
        className={s.buttonGhost}
        disabled={busy}
        onClick={() =>
          run([
            {
              label: 'Finalize',
              simulate: config =>
                simulateContract(config, { address: vaultAddress, abi: lendingVaultAbi, functionName: 'finalize' }),
            },
          ])
        }
      >
        Finalize vault
      </button>
    </div>
  )
}
