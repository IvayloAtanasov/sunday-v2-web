import { useQuery } from '@tanstack/react-query'
import { fetchInstallations } from '../lib/api'

/** Shared by the list and the detail page, so moving between them does not refetch. */
export function useInstallations() {
  return useQuery({
    queryKey: ['installations'],
    queryFn: fetchInstallations,
    staleTime: 60_000,
  })
}

export function useInstallation(id: string) {
  const query = useInstallations()
  return { ...query, installation: query.data?.find(i => i._id === id) }
}
