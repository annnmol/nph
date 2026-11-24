import type { Catalog, SessionStatus } from '../types/api.ts'

function initialStatus(): SessionStatus {
  return {
    phase: 'idle', message: 'Connect to load the mobile catalog.',
    nextCheckAt: null, expiresAt: 0, verificationUrl: null,
  }
}

// Page metadata stays in memory. Browser-managed upstream cookies are never copied.
export const mobileSession = {
  status: initialStatus(),
  verification: '',
  pageTime: '',
  catalog: null as Catalog | null,
  catalogLoadedAt: 0,
  deadline: 0,
  reset() {
    this.status = initialStatus()
    this.verification = ''
    this.pageTime = ''
    this.catalog = null
    this.catalogLoadedAt = 0
    this.deadline = 0
  },
}
