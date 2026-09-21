import { formatUnits } from 'viem'

const eur = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * EURC minor units as euros, truncated to the cent. Truncating rather than rounding means the
 * app never shows a lender more than the contract would pay.
 */
export function formatEur(value: bigint, decimals: number): string {
  const [whole, fraction = ''] = formatUnits(value, decimals).split('.')
  const negative = whole.startsWith('-')
  const cents = fraction.padEnd(2, '0').slice(0, 2)

  return (negative ? '-' : '') + eur.format(Number(`${whole.replace('-', '')}.${cents}`))
}

/** Signed, with an explicit plus, for deltas. */
export const formatEurDelta = (value: bigint, decimals: number) =>
  (value > 0n ? '+' : '') + formatEur(value, decimals)

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export const formatDateTime = (seconds: bigint) => dateTime.format(new Date(Number(seconds) * 1000))
export const formatDate = (seconds: bigint) => date.format(new Date(Number(seconds) * 1000))

/**
 * A period key as the day it describes. Keys are the start of the period in the installation's
 * local time, which is the previous calendar day in UTC, so it has to be read in that zone.
 */
export const formatPeriod = (periodStart: bigint, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone }).format(
    new Date(Number(periodStart) * 1000),
  )

/** A duration in seconds, in the largest unit that reads naturally. */
export function formatDuration(seconds: bigint): string {
  const days = Number(seconds) / 86_400

  if (days >= 365) return `${+(days / 365).toFixed(1)} years`
  if (days >= 1) return `${Math.round(days)} days`
  return `${Math.round(Number(seconds) / 3_600)} hours`
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/** `part / whole` as a percentage with two decimals, computed in integers. */
export const percent = (part: bigint, whole: bigint) =>
  whole === 0n ? 0 : Number((part * 10_000n) / whole) / 100
