import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { formatEur } from '../lib/format'
import s from '../app/app.module.css'

type Props = {
  decimals: number
  /** The most that may be entered, already capped by whatever limits apply. */
  max: bigint
  maxLabel: string
  submitLabel: (amount: bigint | undefined) => string
  onSubmit: (amount: bigint) => void
  disabled?: boolean
}

/**
 * A EURC amount, parsed into minor units with the token's own decimals. Anything unparseable or
 * out of range simply disables the button; the vault gives the authoritative answer on submit.
 */
export default function AmountForm({ decimals, max, maxLabel, submitLabel, onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')

  const amount = parse(value, decimals)
  const valid = amount !== undefined && amount > 0n && amount <= max

  return (
    <form
      className={s.form}
      onSubmit={event => {
        event.preventDefault()
        if (valid) onSubmit(amount)
      }}
    >
      <div className={s.field}>
        <input
          className={s.input}
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={event => setValue(event.target.value.replace(',', '.'))}
          disabled={disabled}
          aria-label="Amount in EURC"
        />
        <span className={s.unit}>EURC</span>
        <button
          type="button"
          className={s.maxButton}
          onClick={() => setValue(formatUnits(max, decimals))}
          disabled={disabled || max === 0n}
        >
          Max
        </button>
      </div>
      <p className={s.hint} style={{ margin: 0 }}>
        {maxLabel}: {formatEur(max, decimals)}
        {amount !== undefined && amount > max && ' (entered amount is above this)'}
      </p>
      <button type="submit" className={s.button} disabled={disabled || !valid}>
        {submitLabel(valid ? amount : undefined)}
      </button>
    </form>
  )
}

function parse(value: string, decimals: number): bigint | undefined {
  if (!/^\d*\.?\d*$/.test(value) || value === '' || value === '.') return undefined

  const [, fraction = ''] = value.split('.')
  if (fraction.length > decimals) return undefined

  return parseUnits(value, decimals)
}
