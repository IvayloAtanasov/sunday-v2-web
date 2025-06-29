'use client'

import { useEffect, useState } from 'react';
import InstallationCard from './components/InstallationCard';

export default function Home() {
  const [installations, setInstallations] = useState<any>([])

  useEffect(() => {
    const fetchInstallations = async () => {
      const inst = await fetch(`https://p3yujenss0.execute-api.eu-central-1.amazonaws.com/staging/installations`)
        .then(res => res.json())

      setInstallations(inst)
    }

    fetchInstallations()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Installations</h1>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {installations.map((item: any) => (
          <InstallationCard
            key={item._id}
            slug={item._id}
            title={item.stationId}
            image={item.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
