'use client'

import Link from 'next/link'
import { ipfsUrl } from '../lib/ipfs'
import type { Installation } from '../lib/api'
import { useVault } from '../hooks/useVault'
import { useTokenMetadata } from '../hooks/useTokenMetadata'
import { Phase } from '../lib/phase'
import { formatDate, formatEur, percent } from '../lib/format'
import { PhaseBadge } from './ui'
import s from '../app/app.module.css'

export default function InstallationCard({ installation }: { installation: Installation }) {
  const { vault } = useVault(installation.vaultAddress)
  const { metadata } = useTokenMetadata(vault?.claimToken, vault?.tokenId)

  const funded = vault ? percent(vault.subscribed, vault.principal) : 0

  return (
    <Link href={`/app/installations/${installation._id}`} className={s.card}>
      <img
        src={ipfsUrl(installation.imageUrl)}
        alt={metadata?.name ?? installation.stationId}
        className={s.cardImage}
      />
      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <div>
            <h3 className={s.cardTitle}>{metadata?.name ?? installation.stationId}</h3>
            {metadata?.properties?.location && (
              <p className={s.subtitle}>{metadata.properties.location}</p>
            )}
          </div>
          {vault && <PhaseBadge phase={vault.phase} />}
        </div>

        {vault && (
          <div>
            <p className={s.mono}>{formatEur(vault.principal, vault.collateralDecimals)}</p>
            {vault.phase === Phase.Funding && (
              <>
                <div className={s.progress}>
                  <div className={s.progressBar} style={{ width: `${funded}%` }} />
                </div>
                <div className={s.progressMeta}>
                  <span>{funded}% funded</span>
                  <span>until {formatDate(vault.fundingDeadline)}</span>
                </div>
              </>
            )}
            {vault.phase !== Phase.Funding && metadata?.properties?.capacity && (
              <p className={s.muted}>{metadata.properties.capacity}</p>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
