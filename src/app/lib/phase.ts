/** Mirrors `LendingVault.Phase`. The contract returns it as its ordinal. */
export enum Phase {
  Funding,
  Failed,
  Drawdown,
  Accruing,
  Settlement,
  Redemption,
  Default,
}

export const PHASE_LABEL: Record<Phase, string> = {
  [Phase.Funding]: 'Funding',
  [Phase.Failed]: 'Funding failed',
  [Phase.Drawdown]: 'Building',
  [Phase.Accruing]: 'Accruing',
  [Phase.Settlement]: 'Settlement',
  [Phase.Redemption]: 'Redemption',
  [Phase.Default]: 'Default',
}

export const PHASE_SUMMARY: Record<Phase, string> = {
  [Phase.Funding]:
    'Open for subscriptions. The raise has to fill exactly before its deadline, or every lender is refunded in full.',
  [Phase.Failed]:
    'The raise did not fill before its deadline. Lenders return their claim tokens for their EURC, 1:1.',
  [Phase.Drawdown]:
    'Fully funded. The borrower draws the principal down and builds the installation; the term starts once it is attested live.',
  [Phase.Accruing]:
    'The installation is live. Its measured production is priced on chain each day and accrues to lenders as premium.',
  [Phase.Settlement]:
    'The term has ended and the obligation is frozen. The borrower repays principal plus premium within the grace window.',
  [Phase.Redemption]:
    'Settled. Lenders burn claim tokens for their share of what was repaid.',
  [Phase.Default]:
    'The obligation was not met in time. Once finalized, whatever was repaid is shared pro rata across all lenders.',
}

/** Colouring only: whether a lender should read the phase as on track. */
export const isHealthy = (phase: Phase) => phase !== Phase.Failed && phase !== Phase.Default
