// Token URIs are minted pointing at https://ipfs.io/ipfs/..., but that gateway
// now drops public browser traffic. The dropped response carries no CORS headers,
// so the browser surfaces it as a CORS error rather than a network one. Ignore
// whichever gateway the URI names and resolve the content path through our own
// /api/ipfs route, which does the gateway hop server-side - see that route for
// why going straight to a public gateway from the browser is unreliable.

// Pulls `<cid>/<optional path>` out of ipfs://, /ipfs/ and <cid>.ipfs.<host> forms.
export function toIpfsPath(uri: string | undefined | null): string | null {
  if (!uri) return null

  const protocol = uri.match(/^ipfs:\/\/(?:ipfs\/)?(.+)$/i)
  if (protocol) return protocol[1]

  const pathGateway = uri.match(/\/ipfs\/(.+)$/i)
  if (pathGateway) return pathGateway[1]

  const subdomainGateway = uri.match(/^https?:\/\/([a-z0-9]+)\.ipfs\.[^/]+(\/.*)?$/i)
  if (subdomainGateway) return subdomainGateway[1] + (subdomainGateway[2] ?? '')

  return null
}

// Rewrites an IPFS URI onto our proxy route. Non-IPFS URLs pass through, and a
// missing one stays missing so callers can leave the attribute off entirely.
export function ipfsUrl(uri: string | undefined | null): string | undefined {
  const path = toIpfsPath(uri)
  if (path) return `/api/ipfs/${path}`
  return uri ?? undefined
}

export async function fetchIpfsJson<T>(uri: string): Promise<T> {
  const res = await fetch(ipfsUrl(uri) ?? uri)
  if (!res.ok) throw new Error(`IPFS request for ${uri} responded ${res.status}`)
  return res.json()
}
