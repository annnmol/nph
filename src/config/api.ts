function httpsOrigin(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('the service settings must be HTTPS origins without paths or credentials.')
  }
  return url.origin
}

export const apiConfig = {
  baseURL: httpsOrigin(import.meta.env.VITE_API_ORIGIN || 'https://net52.cc'),
  verificationOrigin: httpsOrigin(import.meta.env.VITE_VERIFICATION_ORIGIN || 'https://userver.net52.cc'),
  timeout: 20_000,
  headers: { Accept: '*/*' },
} as const
