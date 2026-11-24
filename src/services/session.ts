import { mobileSession } from '../store/mobile-session.ts'
import type { SessionStatus } from '../types/api.ts'
import { ApiError } from './http/api-error.ts'
import { http } from './http/request.ts'
import { acceptCatalog, readMobileHome } from './mobile-home.ts'
import { verificationSchema } from './schemas.ts'

function status(): SessionStatus {
  return { ...mobileSession.status }
}

export const sessionService = {
  status: async () => status(),
  async start(signal?: AbortSignal) {
    mobileSession.reset()
    const home = await readMobileHome(signal)
    if (home.catalog) {
      acceptCatalog(home)
    } else {
      mobileSession.verification = home.verification!
      mobileSession.status = {
        phase: 'verification', message: 'Open verification, then return here while it completes.',
        nextCheckAt: null, expiresAt: 0, verificationUrl: home.verificationUrl!,
      }
    }
    return status()
  },
  beginWait() {
    if (mobileSession.status.phase !== 'verification') return status()
    mobileSession.deadline = Date.now() + 90_000
    mobileSession.status = {
      ...mobileSession.status, phase: 'waiting',
      message: 'Waiting for verification. Keep the verification tab open.',
      nextCheckAt: Date.now() + 30_000,
    }
    return status()
  },
  async check(signal?: AbortSignal) {
    if (mobileSession.status.phase !== 'waiting') return status()
    if (Date.now() > mobileSession.deadline) {
      mobileSession.status = {
        ...mobileSession.status, phase: 'expired', message: 'Verification timed out. Please connect again.',
        nextCheckAt: null, verificationUrl: null,
      }
      return status()
    }
    if (Date.now() < (mobileSession.status.nextCheckAt ?? 0)) return status()
    const response = await http.post<unknown>('/mobile/verify2.php',
      new URLSearchParams({ verify: mobileSession.verification }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, signal,
      },
    )
    const reply = verificationSchema.safeParse(response)
    if (!reply.success) throw new ApiError('Unexpected verification response.', 502, 'VERIFICATION_FORMAT')
    // c:y alone is insufficient. Confirm completion by reading the actual catalog.
    if (reply.data.statusup === 'All Done') {
      acceptCatalog(await readMobileHome(signal))
    } else {
      mobileSession.status = {
        ...mobileSession.status, message: 'The mobile service is still processing verification.',
        nextCheckAt: Date.now() + 2000,
      }
    }
    return status()
  },
  async reset() {
    // A static page cannot delete another origin's cookies; only local state resets.
    mobileSession.reset()
  },
}
