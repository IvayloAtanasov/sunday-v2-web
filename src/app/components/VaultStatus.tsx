import type { VaultState } from '../hooks/useVault'
import { Phase, PHASE_SUMMARY } from '../lib/phase'
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatEur,
  formatEurDelta,
  formatPeriod,
  percent,
} from '../lib/format'
import { PhaseBadge, Row, Rows } from './ui'
import s from '../app/app.module.css'

/**
 * Where the loan stands. Each phase leads with the one figure that matters in it: progress while
 * funding, the obligation while accruing, the pot once settled.
 */
export default function VaultStatus({ vault, timeZone }: { vault: VaultState; timeZone: string }) {
  const eur = (value: bigint) => formatEur(value, vault.collateralDecimals)
  const premium = vault.owed - vault.principal

  return (
    <section className={s.panel}>
      <div className={s.cardHead}>
        <h2 className={s.panelTitle}>Loan</h2>
        <PhaseBadge phase={vault.phase} />
      </div>
      <p className={s.panelText}>{PHASE_SUMMARY[vault.phase]}</p>

      {vault.phase === Phase.Funding && <Funding vault={vault} />}

      {(vault.phase === Phase.Accruing || vault.phase === Phase.Settlement) && (
        <>
          <p className={`${s.figure} ${s.money}`}>{eur(vault.owed)}</p>
          <p className={s.figureCaption}>
            owed to lenders: {eur(vault.principal)} principal + {eur(premium)} premium
          </p>
        </>
      )}

      {vault.phase === Phase.Redemption && (
        <>
          <p className={`${s.figure} ${s.money}`}>{eur(vault.settled)}</p>
          <p className={s.figureCaption}>
            {vault.defaulted
              ? `settled at ${percent(vault.settled, vault.owed)}% of the ${eur(vault.owed)} owed`
              : `repaid in full, principal + ${eur(premium)} premium`}
          </p>
        </>
      )}

      {vault.phase === Phase.Default && (
        <>
          <p className={`${s.figure} ${s.negative}`}>{eur(vault.shortfall)}</p>
          <p className={s.figureCaption}>unpaid of the {eur(vault.owed)} owed</p>
        </>
      )}

      <Rows>
        {vault.phase !== Phase.Funding && <Row label="Principal">{eur(vault.principal)}</Row>}

        {vault.phase === Phase.Failed && (
          <>
            <Row label="Raised">{eur(vault.subscribed)}</Row>
            <Row label="Deadline passed">{formatDateTime(vault.fundingDeadline)}</Row>
            <Row label="Still to refund">{eur(vault.outstandingSupply)}</Row>
          </>
        )}

        {vault.phase === Phase.Drawdown && (
          <>
            <Row label="Principal drawn down">{vault.drawnDown ? 'Yes' : 'Not yet'}</Row>
            <Row label="Must be live by">{formatDateTime(vault.activationDeadline)}</Row>
            <Row label="Term once live">{formatDuration(vault.term)}</Row>
          </>
        )}

        {vault.maturity > 0n && (
          <>
            <Row label="Live since">{formatDate(vault.activatedAt)}</Row>
            <Row label="Matures">{formatDate(vault.maturity)}</Row>
            <Row label="Repayment due by">{formatDate(vault.maturity + vault.graceWindow)}</Row>
            <Row label="Premium accrued">
              <span className={vault.cumulativeYield < 0n ? s.negative : undefined}>
                {formatEurDelta(vault.cumulativeYield, vault.collateralDecimals)}
              </span>
            </Row>
            <Row label="Last day accrued">
              {vault.lastRebasedAt > 0n ? formatPeriod(vault.lastRebasedAt, timeZone) : 'None yet'}
            </Row>
            <Row label="Repaid so far">{eur(vault.repaid)}</Row>
          </>
        )}

        {vault.phase === Phase.Default && (
          <Row label="Finalized">{vault.finalized ? 'Yes' : 'Not yet'}</Row>
        )}
      </Rows>

      {vault.maturity > 0n && vault.cumulativeYield < 0n && (
        <p className={s.hint} style={{ marginTop: 16 }}>
          Accrued premium is negative after loss-making days. What is owed never drops below
          principal; later days have to make the loss up before premium grows again.
        </p>
      )}
    </section>
  )
}

function Funding({ vault }: { vault: VaultState }) {
  const eur = (value: bigint) => formatEur(value, vault.collateralDecimals)
  const funded = percent(vault.subscribed, vault.principal)

  return (
    <div style={{ marginBottom: 20 }}>
      <p className={s.figure}>{eur(vault.subscribed)}</p>
      <p className={s.figureCaption} style={{ marginBottom: 0 }}>
        raised of {eur(vault.principal)}
      </p>
      <div className={s.progress}>
        <div className={s.progressBar} style={{ width: `${funded}%` }} />
      </div>
      <div className={s.progressMeta}>
        <span>{funded}%</span>
        <span>{eur(vault.principal - vault.subscribed)} left</span>
      </div>
      <div style={{ marginTop: 20 }}>
        <Rows>
          <Row label="Closes">{formatDateTime(vault.fundingDeadline)}</Row>
          <Row label="Term">{formatDuration(vault.term)} from going live</Row>
          <Row label="Build window">{formatDuration(vault.activationWindow)} after funding</Row>
        </Rows>
      </div>
    </div>
  )
}
