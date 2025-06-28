'use client'

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation'

export default function InstallationDetails({ params }: { params: { slug: string } }) {
  const [installation, setInstallation] = useState<any>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInstallations = async () => {
      const installations = await fetch(`https://p3yujenss0.execute-api.eu-central-1.amazonaws.com/staging/installations`)
        .then(res => res.json())

      setInstallation(installations.find((i: any) => i._id === params.slug))
      setLoading(false)
    }

    fetchInstallations()
  }, [])

  if (isLoading) return <div>Loading...</div>

  if (!installation) return notFound()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{installation.stationId}</h1>
      <p className="text-gray-700">{installation.timezone}</p>
    </div>
  )
}
