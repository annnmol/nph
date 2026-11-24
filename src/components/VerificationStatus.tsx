import { useEffect, useState } from 'react'
import type { SessionStatus } from '../types/api.ts'

export function VerificationStatus({ status }: { status: SessionStatus }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (status.phase !== 'waiting') return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [status.phase])
  const seconds = status.nextCheckAt ? Math.max(0, Math.ceil((status.nextCheckAt - now) / 1000)) : 0

  return (
    <div role="status" className="my-5 text-sm text-neutral-600">
      <p>{status.message}</p>
      {status.phase === 'waiting' && seconds > 2 && <p className="mt-1">Checking in {seconds}s…</p>}
    </div>
  )
}
