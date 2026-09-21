import { erc20Abi, isAddressEqual, type Address } from 'viem'
import { simulateContract } from 'wagmi/actions'
import { lendingVaultAbi } from '../contracts/LendingVault'
import type { VaultState } from '../hooks/useVault'
import type { Position } from '../hooks/usePosition'
import { useContractAction, type ActionStep } from '../hooks/useContractAction'
import { Phase } from '../lib/phase'
import { formatDateTime, formatDuration, formatEur } from '../lib/format'
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
 * The borrower's and the activator's side of the loan, shown only to those addresses. Everything
 * here is also callable from a block explorer; this panel only saves them working out which call
 * is valid in which phase.
 */
export default function RolePanel({ vaultAddress, vault, position, onChange }: Props) {
  const { run, status, busy } = useContractAction(onChange)

  const account = position.account
  if (!account) return null

  const isBorrower = isAddressEqual(account, vault.borrower)
  const isActivator = isAddressEqual(account, vault.activator)
  if (!isBorrower && !isActivator) return null

  const eur = (value: bigint) => formatEur(value, vault.collateralDecimals)
  const vaultContract = { address: vaultAddress, abi: lendingVaultAbi } as const

  const call = (
    label: string,
    functionName: 'drawdown' | 'activate' | 'withdrawSurplus' | 'withdrawRemainder',
  ) =>
    run([{ label, simulate: config => simulateContract(config, { ...vaultContract, functionName }) }])

  const repay = (amount: bigint) => {
    const steps: ActionStep[] = []

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
      label: 'Repay',
      simulate: config => simulateContract(config, { ...vaultContract, functionName: 'repay', args: [amount] }),
    })

    return run(steps)
  }

  const outstanding = vault.owed > vault.repaid ? vault.owed - vault.repaid : 0n
  const eurcBalance = position.eurcBalance ?? 0n

  const canDrawdown = isBorrower && vault.phase === Phase.Drawdown && !vault.drawnDown
  const canActivate = isActivator && vault.phase === Phase.Drawdown && vault.drawnDown
  const canRepay =
    isBorrower &&
    !vault.finalized &&
    (vault.phase === Phase.Accruing || vault.phase === Phase.Settlement || vault.phase === Phase.Default)
  const canWithdrawSurplus = isBorrower && vault.phase === Phase.Redemption && vault.surplus > 0n
  const canWithdrawRemainder =
    isBorrower &&
    (vault.phase === Phase.Redemption || vault.phase === Phase.Failed) &&
    vault.outstandingSupply === 0n &&
    (position.vaultEurcBalance ?? 0n) > 0n

  const roles = [isBorrower && 'Borrower', isActivator && 'Activator'].filter(Boolean).join(' · ')
  const nothingToDo =
    !canDrawdown && !canActivate && !canRepay && !canWithdrawSurplus && !canWithdrawRemainder

  return (
    <section className={s.panel}>
      <span className={s.roleTag}>{roles}</span>
      <h2 className={s.panelTitle} style={{ marginTop: 6 }}>
        Your obligations
      </h2>

      {canRepay && (
        <Rows>
          <Row label="Owed">{eur(vault.owed)}</Row>
          <Row label="Repaid">{eur(vault.repaid)}</Row>
          <Row label="Outstanding">{eur(outstanding)}</Row>
        </Rows>
      )}

      <div className={s.actions} style={{ marginTop: 20 }}>
        {nothingToDo && (
          <p className={s.hint} style={{ margin: 0 }}>
            Nothing for you to do in this phase.
          </p>
        )}

        {canDrawdown && (
          <div className={s.action}>
            <p className={s.actionHead}>Draw down</p>
            <p className={s.hint}>
              Takes the full {eur(vault.principal)} to build the installation. It has to be live by{' '}
              {formatDateTime(vault.activationDeadline)} or the loan defaults.
            </p>
            <button className={s.button} disabled={busy} onClick={() => call('Draw down', 'drawdown')}>
              Draw down {eur(vault.principal)}
            </button>
          </div>
        )}

        {canActivate && (
          <div className={s.action}>
            <p className={s.actionHead}>Activate</p>
            <p className={s.hint}>
              Attests the installation is live. The {formatDuration(vault.term)} term starts now,
              and cannot be moved afterwards.
            </p>
            <button className={s.button} disabled={busy} onClick={() => call('Activate', 'activate')}>
              Activate installation
            </button>
          </div>
        )}

        {canRepay && (
          <div className={s.action}>
            <p className={s.actionHead}>Repay</p>
            <p className={s.hint}>
              {vault.phase === Phase.Accruing
                ? 'Repaying early is allowed. It does not end the term or stop premium accruing, so the final amount can still grow.'
                : 'Anything paid above what is owed comes back to you as surplus after finalization.'}
            </p>
            <AmountForm
              decimals={vault.collateralDecimals}
              max={eurcBalance}
              maxLabel="Your EURC balance"
              submitLabel={amount => (amount ? `Repay ${eur(amount)}` : 'Repay')}
              onSubmit={repay}
              disabled={busy}
            />
          </div>
        )}

        {canWithdrawSurplus && (
          <div className={s.action}>
            <p className={s.actionHead}>Withdraw surplus</p>
            <p className={s.hint}>What you repaid above the final obligation.</p>
            <button
              className={s.buttonGhost}
              disabled={busy}
              onClick={() => call('Withdraw surplus', 'withdrawSurplus')}
            >
              Withdraw {eur(vault.surplus)}
            </button>
          </div>
        )}

        {canWithdrawRemainder && (
          <div className={s.action}>
            <p className={s.actionHead}>Withdraw remainder</p>
            <p className={s.hint}>
              Every claim is paid out. Collects whatever EURC is left in the vault: rounding dust,
              unwithdrawn surplus, or transfers made outside subscribe and repay.
            </p>
            <button
              className={s.buttonGhost}
              disabled={busy}
              onClick={() => call('Withdraw remainder', 'withdrawRemainder')}
            >
              Withdraw {eur(position.vaultEurcBalance ?? 0n)}
            </button>
          </div>
        )}

        <ActionStatusLine status={status} />
      </div>
    </section>
  )
}
