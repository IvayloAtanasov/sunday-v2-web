'use client'

import InstallationCard from '../components/InstallationCard'
import { useInstallations } from '../hooks/useInstallations'
import s from './app.module.css'

export default function Home() {
  const { data: installations, isLoading, error } = useInstallations()

  return (
    <div className={s.container}>
      <h1 className={s.title}>Installations</h1>
      <p className={s.subtitle}>
        Each one is a single loan, funded in EURC and repaid from what the installation produces.
      </p>

      {isLoading && <p className={s.placeholder}>Loading installations…</p>}
      {error && <p className={s.placeholder}>Could not load installations: {error.message}</p>}

      <div className={s.grid}>
        {installations?.map(installation => (
          <InstallationCard key={installation._id} installation={installation} />
        ))}
      </div>
    </div>
  )
}
