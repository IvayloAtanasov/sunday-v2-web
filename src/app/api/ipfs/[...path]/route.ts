// Public IPFS gateways increasingly block requests that look like browser CORS
// calls - ipfs.io drops them outright, dweb.link and w3s.link answer 403 once an
// Origin/Referer is attached - while the same requests succeed server-side. So
// the browser talks only to this route, and the server does the gateway hop.
// The shared public gateways below rate-limit per IP, and every visitor's request
// now leaves from this server's single IP - so they start answering 429 under any
// real traffic. Point IPFS_GATEWAY_URL at a dedicated gateway (a Pinata or
// Filebase one, including the /ipfs suffix) to get ahead of that; the public ones
// stay on as fallbacks. IPFS_GATEWAY_TOKEN is the dedicated gateway's access
// token, if it needs one.
const DEDICATED_GATEWAY = process.env.IPFS_GATEWAY_URL
const DEDICATED_GATEWAY_TOKEN = process.env.IPFS_GATEWAY_TOKEN

const GATEWAYS = [
  ...(DEDICATED_GATEWAY ? [DEDICATED_GATEWAY.replace(/\/$/, '')] : []),
  'https://gateway.pinata.cloud/ipfs',
  'https://dweb.link/ipfs',
  'https://w3s.link/ipfs',
  'https://ipfs.io/ipfs',
]

const CID = /^[A-Za-z0-9]+$/

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } },
) {
  const [cid, ...rest] = params.path

  if (!cid || !CID.test(cid) || rest.some(segment => segment === '..')) {
    return Response.json({ error: 'Invalid IPFS path' }, { status: 400 })
  }

  const path = [cid, ...rest.map(encodeURIComponent)].join('/')

  const failures: string[] = []

  for (const gateway of GATEWAYS) {
    try {
      const res = await fetch(`${gateway}/${path}`, {
        headers:
          gateway === GATEWAYS[0] && DEDICATED_GATEWAY_TOKEN
            ? { 'x-pinata-gateway-token': DEDICATED_GATEWAY_TOKEN }
            : {},
        // Content is addressed by hash, so it can never change under us.
        next: { revalidate: 3600 },
      })

      if (!res.ok) {
        failures.push(`${gateway} ${res.status}`)
        continue
      }

      return new Response(res.body, {
        headers: {
          'content-type': res.headers.get('content-type') ?? 'application/octet-stream',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      failures.push(`${gateway} unreachable`)
    }
  }

  // Worth logging loudly: an all-429 sweep means we've outgrown the public
  // gateways rather than that the content is missing.
  console.error(`IPFS lookup failed for ${path}:`, failures.join(', '))

  return Response.json(
    { error: `Could not load ${path} from any IPFS gateway`, failures },
    { status: 502 },
  )
}
