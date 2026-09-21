import { formatUnits, hexToString, type Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { yieldAdapterAbi } from '../contracts/YieldAdapter'
import type { VaultState } from '../hooks/useVault'
import { formatEur } from '../lib/format'
import { AddressLink, Row, Rows } from './ui'
import s from '../app/app.module.css'

/**
 * Everything a lender needs to check this loan without trusting the app: the contracts, the
 * bindings the adapter froze for this vault, and the formula it applies, read from the adapter's
 * own constants rather than restated here.
 */
export default function ContractsPanel({ vaultAddress, vault }: { vaultAddress: Address; vault: VaultState }) {
  const adapter = { address: vault.rebaseAdapter, abi: yieldAdapterAbi } as const

  const { data } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...adapter, functionName: 'vaultState', args: [vaultAddress] },
      { ...adapter, functionName: 'priceOracle' },
      { ...adapter, functionName: 'BUYER_DISCOUNT_NUM' },
      { ...adapter, functionName: 'BUYER_DISCOUNT_DEN' },
      { ...adapter, functionName: 'VAT_NUM' },
      { ...adapter, functionName: 'VAT_DEN' },
      { ...adapter, functionName: 'PLATFORM_FEE_MICRO' },
      { ...adapter, functionName: 'CORPORATE_TAX_NUM' },
      { ...adapter, functionName: 'CORPORATE_TAX_DEN' },
    ],
    // All frozen: the adapter's formula and oracle at construction, the binding at registration.
    query: { enabled: BigInt(vault.rebaseAdapter) !== 0n, staleTime: Infinity },
  })

  const [registration, priceOracle, discountNum, discountDen, vatNum, vatDen, fee, taxNum, taxDen] =
    data ?? []

  const deltaBound = (vault.principal * vault.maxRebaseDeltaRatio) / 10_000n

  return (
    <section className={s.panel}>
      <h2 className={s.panelTitle}>Contracts</h2>
      <p className={s.panelText}>
        The premium is computed on chain from two inputs, the installation&apos;s measured
        production and the market price for the day. Nobody can state a yield directly.
      </p>

      <Rows>
        <Row label="Vault">
          <AddressLink address={vaultAddress} />
        </Row>
        <Row label="Yield adapter">
          {BigInt(vault.rebaseAdapter) === 0n ? 'Not set' : <AddressLink address={vault.rebaseAdapter} />}
        </Row>
        {priceOracle && (
          <Row label="Price oracle">
            <AddressLink address={priceOracle} />
          </Row>
        )}
        <Row label={`Claim token #${vault.tokenId}`}>
          <AddressLink address={vault.claimToken} />
        </Row>
        <Row label="EURC">
          <AddressLink address={vault.collateralToken} />
        </Row>
        <Row label="Borrower">
          <AddressLink address={vault.borrower} />
        </Row>
        <Row label="Activator">
          <AddressLink address={vault.activator} />
        </Row>
      </Rows>

      {registration && (
        <>
          <p className={s.eyebrow} style={{ marginTop: 28 }}>
            Bound to this vault, permanently
          </p>
          {registration.registered ? (
            <Rows>
              <Row label="Station">{registration.stationId}</Row>
              <Row label="Market">{hexToString(registration.country, { size: 32 })}</Row>
              <Row label="Most it can report per day">
                {formatUnits(registration.maxPeriodMilliKwh, 3)} kWh
              </Row>
              <Row label="Most one day can move the claim">
                ±{formatEur(deltaBound, vault.collateralDecimals)}
              </Row>
            </Rows>
          ) : (
            <p className={s.statusError}>
              This vault is not registered on its adapter, so it will not accrue.
            </p>
          )}
        </>
      )}

      {fee !== undefined && (
        <>
          <p className={s.eyebrow} style={{ marginTop: 28 }}>
            The formula, per day
          </p>
          <pre className={s.formula}>
            {[
              'value   = price × energy',
              `revenue = value × ${discountNum}/${discountDen}          trader's cut`,
              `taxable = revenue × ${vatNum}/${vatDen} − €${formatUnits(fee, 6)}  VAT, platform fee`,
              `premium = taxable > 0`,
              `        ? taxable × ${taxNum}/${taxDen}                corporate tax`,
              `        : taxable                       a loss carries in full`,
            ].join('\n')}
          </pre>
        </>
      )}
    </section>
  )
}
