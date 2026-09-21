'use client'

import Link from 'next/link'
import type { Installation } from '../lib/api'
import { ipfsUrl } from '../lib/ipfs'
import { documentLabel } from '../lib/metadata'
import { useVault } from '../hooks/useVault'
import { usePosition } from '../hooks/usePosition'
import { useTokenMetadata } from '../hooks/useTokenMetadata'
import VaultStatus from './VaultStatus'
import LenderPanel from './LenderPanel'
import RolePanel from './RolePanel'
import ContractsPanel from './ContractsPanel'
import { Row, Rows } from './ui'
import s from '../app/app.module.css'

export default function InstallationDetails({ installation }: { installation: Installation }) {
  const vaultAddress = installation.vaultAddress
  const { vault, error, refetch } = useVault(vaultAddress)
  const position = usePosition(vaultAddress, vault)
  const { uri, metadata } = useTokenMetadata(vault?.claimToken, vault?.tokenId)

  // After any transaction both the vault and the wallet have moved.
  const refresh = () => Promise.all([refetch(), position.refetch()])

  const title = metadata?.name ?? installation.stationId

  return (
    <div className={s.container}>
      <Link href="/app" className={s.back}>
        ← All installations
      </Link>

      <header className={s.header}>
        <div>
          <h1 className={s.title}>{title}</h1>
          <p className={s.subtitle}>
            {[metadata?.properties?.location, metadata?.properties?.capacity].filter(Boolean).join(' · ') ||
              installation.stationId}
          </p>
        </div>
      </header>

      {error && (
        <p className={s.statusError} style={{ marginBottom: 24 }}>
          Could not read the vault at {vaultAddress}: {error.message}
        </p>
      )}

      <div className={s.layout}>
        <div className={s.column}>
          <img src={ipfsUrl(installation.imageUrl)} alt={title} className={s.image} />

          <section className={s.panel}>
            <h2 className={s.panelTitle}>Installation</h2>
            {metadata?.description && <p className={s.panelText}>{metadata.description}</p>}
            <Rows>
              <Row label="Station">{installation.stationId}</Row>
              {metadata?.properties?.capacity && <Row label="Capacity">{metadata.properties.capacity}</Row>}
              {metadata?.properties?.area && <Row label="Area">{metadata.properties.area}</Row>}
              {metadata?.properties?.location && <Row label="Location">{metadata.properties.location}</Row>}
              {Object.entries(metadata?.documents ?? {}).map(([key, url]) => (
                <Row key={key} label={documentLabel(key)}>
                  <a href={ipfsUrl(url)} target="_blank" rel="noopener noreferrer" className={s.link}>
                    Open
                  </a>
                </Row>
              ))}
              {uri && (
                <Row label="Token metadata">
                  <a href={ipfsUrl(uri)} target="_blank" rel="noopener noreferrer" className={s.link}>
                    IPFS
                  </a>
                </Row>
              )}
            </Rows>
          </section>

          {vault && <ContractsPanel vaultAddress={vaultAddress} vault={vault} />}
        </div>

        <div className={s.column}>
          {vault ? (
            <>
              <VaultStatus vault={vault} timeZone={installation.timezone} />
              <RolePanel vaultAddress={vaultAddress} vault={vault} position={position} onChange={refresh} />
              <LenderPanel vaultAddress={vaultAddress} vault={vault} position={position} onChange={refresh} />
            </>
          ) : (
            !error && <p className={s.placeholder}>Reading the vault…</p>
          )}
        </div>
      </div>
    </div>
  )
}
