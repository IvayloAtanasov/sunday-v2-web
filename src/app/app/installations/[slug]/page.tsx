'use client'

import { notFound } from 'next/navigation'
import InstallationDetails from '../../../components/InstallationDetails'
import { useInstallation } from '../../../hooks/useInstallations'
import s from '../../app.module.css'

export default function InstallationDetailsPage({ params }: { params: { slug: string } }) {
  const { installation, isLoading, error } = useInstallation(params.slug)

  if (isLoading) return <p className={s.placeholder}>Loading…</p>
  if (error) return <p className={s.placeholder}>Could not load installation: {error.message}</p>
  if (!installation) return notFound()

  return <InstallationDetails installation={installation} />
}
