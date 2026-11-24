import { TvProxyTest } from './pages/TvProxyTest.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { RequestError } from './components/RequestError.tsx'
import { VerificationStatus } from './components/VerificationStatus.tsx'
import { useSession } from './hooks/use-session.ts'

function MobileApp() {
  const { session, start, reset, beginVerification } = useSession()
  const status = session.data
  const verified = status?.phase === 'verified'
  const pending = start.isPending || reset.isPending

  return (
    <main className="mx-auto min-h-svh max-w-3xl px-5 py-10">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-medium">NPH</h1>
        {status && status.phase !== 'idle' && <button className="text-sm text-neutral-500 hover:underline disabled:opacity-50" disabled={pending || session.isFetching} onClick={() => reset.mutate()}>Reset connection</button>}
      </header>
      {session.isPending && <p role="status" className="my-5 text-sm">Connecting…</p>}
      {session.error && <RequestError error={session.error} onRetry={() => { void session.refetch() }} />}
      {start.error && <RequestError error={start.error} />}
      {reset.error && <RequestError error={reset.error} />}
      {status && <VerificationStatus status={status} />}
      {status?.verificationUrl && <a className="action inline-block" href={status.verificationUrl} target="_blank" rel="noopener noreferrer" onClick={beginVerification}>Open verification</a>}
      {status && !verified && ['idle', 'expired'].includes(status.phase) && <button className="action" disabled={pending || session.isFetching} onClick={() => start.mutate()}>
        {start.isPending ? 'Starting verification…' : 'Connect to the service'}
      </button>}
      {verified && <HomePage />}
    </main>
  )
}

export default function App() {
  return (window.location.pathname === '/tv-proxy-test' || new URLSearchParams(window.location.search).has('tv-proxy-test')) ? <TvProxyTest /> : <MobileApp />
}
