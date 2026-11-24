const endpoints = new Map([
  ['discovery', 'https://mobiledetects.com/checknewtv.php'],
  ['otp', 'https://tv.imgcdn.kim/newtv/otp.php'],
  ['main', 'https://tv.imgcdn.kim/newtv/main.php'],
])

const noStore = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

export default {
  async fetch(request) {
    const reply = (body, status) => Response.json(body, { status, headers: noStore })
    if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405)
    const endpoint = new URL(request.url).searchParams.get('endpoint')
    const destination = endpoints.get(endpoint)
    if (!destination) return reply({ error: 'Unknown endpoint' }, 404)

    const headers = new Headers({
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache', Expires: '0',
    })
    if (endpoint === 'otp') {
      const otp = request.headers.get('otp') || ''
      if (!/^\d{6}$/.test(otp)) return reply({ error: 'A six-digit OTP header is required' }, 400)
      headers.set('Otp', otp)
    }
    if (endpoint === 'main') {
      const token = request.headers.get('usertoken') || ''
      if (!token || token.length > 4096) return reply({ error: 'A valid Usertoken header is required' }, 400)
      headers.set('Usertoken', token)
      headers.set('Ott', 'nf')
      headers.set('Page', '1')
      headers.set('Recentplay', '')
      headers.set('Watchlist', '')
    }
    try {
      const upstream = await fetch(destination, {
        method: 'GET', headers, redirect: 'manual', signal: AbortSignal.timeout(12_000),
      })
      if (upstream.status >= 300 && upstream.status < 400) {
        await upstream.body?.cancel()
        return reply({ error: 'Upstream redirected; not followed', upstreamStatus: upstream.status }, 502)
      }
      const type = upstream.headers.get('content-type') || ''
      if (!type.includes('application/json')) {
        await upstream.body?.cancel()
        return reply({ error: 'Upstream returned a non-JSON response', upstreamStatus: upstream.status }, upstream.ok ? 502 : upstream.status)
      }
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { ...noStore, 'Content-Type': 'application/json', 'X-Proxy-Upstream-Status': String(upstream.status) },
      })
    } catch (error) {
      const timeout = error?.name === 'TimeoutError'
      return reply({ error: timeout ? 'Upstream request timed out' : 'Upstream connection failed' }, timeout ? 504 : 502)
    }
  },
}
