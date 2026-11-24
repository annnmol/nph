import { useState } from 'react'

const expectedOrigin = 'https://tv.imgcdn.kim'
const commonHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache', Expires: '0',
}

export function TvProxyTest() {
  const [otp, setOtp] = useState('111111')
  const [busy, setBusy] = useState(false)
  const [lines, setLines] = useState<string[]>([])

  async function run() {
    if (!/^\d{6}$/.test(otp)) { setLines(['Enter a six-digit code.']); return }
    setBusy(true)
    setLines([])
    const log = (line: string) => setLines(previous => [...previous, line])
    async function get(path: string, headers: Record<string, string>) {
      const response = await fetch(`/tv-api/${path}`, {
        method: 'GET', headers: { ...commonHeaders, ...headers },
        cache: 'no-store', redirect: 'error', credentials: 'omit',
        signal: AbortSignal.timeout(20_000),
      })
      log(`${path}: HTTP ${response.status}`)
      if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`)
      const body: unknown = await response.json()
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(`${path}: expected a JSON object`)
      return body as Record<string, unknown>
    }
    try {
      log(import.meta.env.DEV ? 'LOCAL Vite proxy test. Repeat on Vercel to confirm its external rewrites.' : `Testing deployed proxy at ${location.origin}`)
      const discovery = await get('discovery', {})
      if (typeof discovery.token_hash !== 'string') throw new Error('Discovery did not return token_hash')
      const origin = atob(discovery.token_hash).replace(/\/+$/, '')
      if (origin !== expectedOrigin) throw new Error(`API origin changed to ${origin}. Update proxy destinations before continuing.`)
      log('Discovery matches the configured TV API.')
      const login = await get('otp', { Otp: otp })
      if (login.status !== 'ok' || typeof login.usertoken !== 'string' || !login.usertoken) throw new Error('OTP rejected or no usertoken returned')
      log('OTP accepted; received usertoken (kept in memory).')
      const main = await get('main', {
        Ott: 'nf',
        Usertoken: login.usertoken, Page: '1', Recentplay: '', Watchlist: '',
      })
      if (main.status !== 'ok') throw new Error('Protected main endpoint did not return status: ok')
      log('PASS: protected main API returned status: ok. Browser read all three responses without a CORS error.')
    } catch (error) {
      log(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-10">
    <h1 className="text-2xl font-medium">TV authentication proxy test</h1>
    <p>Check the TV service connection, verify your code, then request the protected API.</p>
    <label className="block">Six-digit code
      <input className="ml-3 rounded border p-2" aria-label="Six-digit code" inputMode="numeric" autoComplete="off" maxLength={6} value={otp} disabled={busy} onChange={event => setOtp(event.target.value)} />
    </label>
    <button className="action" disabled={busy} onClick={() => { void run() }}>{busy ? 'Testing…' : 'Test OTP and protected API'}</button>
    <pre role="status" aria-live="polite" className="whitespace-pre-wrap rounded bg-neutral-100 p-4 text-sm">{lines.join('\n') || 'Ready.'}</pre>
  </main>
}
