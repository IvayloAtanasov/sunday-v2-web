'use client'

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation'
import InstallationDetails from '../../components/InstallationDetails';

export default function InstallationDetailsPage({ params }: { params: { slug: string } }) {
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

  return <InstallationDetails installation={installation} />
}
