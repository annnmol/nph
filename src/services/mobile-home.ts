import { apiConfig } from '../config/api.ts'
import { mobileSession } from '../store/mobile-session.ts'
import type { Catalog, CatalogRow } from '../types/api.ts'
import { ApiError } from './http/api-error.ts'
import { http } from './http/request.ts'

export function expireSession(): never {
  mobileSession.status = {
    ...mobileSession.status, phase: 'expired', message: 'Your mobile session expired. Please connect again.',
    nextCheckAt: null, verificationUrl: null,
  }
  mobileSession.pageTime = ''
  mobileSession.catalog = null
  throw new ApiError(mobileSession.status.message, 401, 'SESSION_EXPIRED')
}

export async function readMobileHome(signal?: AbortSignal) {
  const html = await http.get<string>('/mobile/home', { params: { app: 1 }, responseType: 'text', signal })
  // Parse inert markup; upstream scripts and event handlers are never executed.
  const document = new DOMParser().parseFromString(html, 'text/html')
  const verification = document.querySelector('[data-addhash]')?.getAttribute('data-addhash')
  if (verification) {
    const url = new URL('/', apiConfig.verificationOrigin)
    url.search = new URLSearchParams({ ffr455: verification, a: 'y', t: String(Math.random()) }).toString()
    return { verification, verificationUrl: url.href }
  }
  const pageTime = document.body.getAttribute('data-time')
  if (!pageTime || !document.querySelector('script[src*="nf-custom.js"]')) {
    throw new ApiError('The mobile homepage changed or access was blocked.', 502, 'HOME_FORMAT')
  }
  const rows: CatalogRow[] = []
  document.querySelectorAll('.inner-mob-tray-container').forEach((container) => {
    const items = new Map<string, CatalogRow['items'][number]>()
    container.querySelectorAll('[data-post]').forEach((card) => {
      const id = card.getAttribute('data-post')
      if (id && /^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
        const title = card.getAttribute('title') || card.querySelector('img')?.getAttribute('alt')?.trim() || `Title ${id}`
        items.set(id, { id, title, provider: 'netflix' })
      }
    })
    if (items.size) {
      const title = container.closest('.container')?.previousElementSibling?.querySelector('h2')?.textContent?.trim() || `Catalog ${rows.length + 1}`
      rows.push({ title, items: [...items.values()] })
    }
  })
  if (!rows.length) throw new ApiError('No catalog rows were found.', 502, 'CATALOG_FORMAT')
  return { pageTime, catalog: { rows } satisfies Catalog }
}

export function acceptCatalog(data: Awaited<ReturnType<typeof readMobileHome>>) {
  if (!data.catalog || !data.pageTime) expireSession()
  mobileSession.catalog = data.catalog
  mobileSession.catalogLoadedAt = Date.now()
  mobileSession.pageTime = data.pageTime
  mobileSession.verification = ''
  mobileSession.status = {
    phase: 'verified', message: 'Connected to the mobile catalog.', nextCheckAt: null,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000, verificationUrl: null,
  }
}
