import axios from 'axios'
import { apiConfig } from '../../config/api.ts'
import { ApiError } from './api-error.ts'

export const httpClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
  withCredentials: true,
})

httpClient.interceptors.request.use((config) => {
  if (!config.url?.startsWith('/') || config.url.startsWith('//') || config.baseURL !== apiConfig.baseURL) {
    throw new ApiError('Invalid API destination.', 0, 'INVALID_DESTINATION')
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error) || error instanceof ApiError) return Promise.reject(error)
    if (axios.isAxiosError(error)) {
      const blocked = !error.response && error.code !== 'ECONNABORTED'
      return Promise.reject(new ApiError(
        blocked ? 'Unable to reach the service from this browser. Its API may block requests from this site, or your connection may be unavailable.'
          : error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.'
          : `the service returned HTTP ${error.response?.status}. Please try again.`,
        error.response?.status ?? 0,
        blocked ? 'BROWSER_NETWORK_ERROR' : error.code ?? 'NETWORK_ERROR',
      ))
    }
    return Promise.reject(new ApiError('The request could not be completed.', 0, 'UNKNOWN_ERROR'))
  },
)
