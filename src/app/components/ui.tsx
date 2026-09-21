import type { ReactNode } from 'react'
import { Phase, PHASE_LABEL } from '../lib/phase'
import { addressUrl, txUrl } from '../lib/chain'
import { shortAddress } from '../lib/format'
import type { ActionStatus } from '../hooks/useContractAction'
import s from '../app/app.module.css'

const BADGE_CLASS: Record<Phase, string> = {
  [Phase.Funding]: s.badgeActive,
  [Phase.Failed]: s.badgeBad,
  [Phase.Drawdown]: s.badgeActive,
  [Phase.Accruing]: s.badgeActive,
  [Phase.Settlement]: s.badgeActive,
  [Phase.Redemption]: s.badgeDone,
  [Phase.Default]: s.badgeBad,
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  return <span className={`${s.badge} ${BADGE_CLASS[phase]}`}>{PHASE_LABEL[phase]}</span>
}

export function Rows({ children }: { children: ReactNode }) {
  return <dl className={s.rows}>{children}</dl>
}

export function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={s.row}>
      <dt className={s.rowKey}>{label}</dt>
      <dd className={s.rowVal}>{children}</dd>
    </div>
  )
}

export function AddressLink({ address }: { address: string }) {
  return (
    <a href={addressUrl(address)} target="_blank" rel="noopener noreferrer" className={s.link}>
      {shortAddress(address)}
    </a>
  )
}

function TxLink({ hash, children }: { hash: string; children: ReactNode }) {
  return (
    <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className={s.link}>
      {children}
    </a>
  )
}

export function ActionStatusLine({ status }: { status: ActionStatus }) {
  switch (status.state) {
    case 'idle':
      return null
    case 'signing':
      return <p className={s.status}>{status.label}: confirm in your wallet…</p>
    case 'confirming':
      return (
        <p className={s.status}>
          {status.label}: waiting for <TxLink hash={status.hash}>the transaction</TxLink>…
        </p>
      )
    case 'done':
      return (
        <p className={s.statusDone}>
          Done. <TxLink hash={status.hash}>View transaction</TxLink>
        </p>
      )
    case 'error':
      return <p className={s.statusError}>{status.message}</p>
  }
}
