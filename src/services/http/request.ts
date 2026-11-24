import type { AxiosRequestConfig } from 'axios'
import { httpClient } from './client.ts'

export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'baseURL'>

async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, options?: RequestOptions, data?: unknown): Promise<T> {
  const response = await httpClient.request<T>({ ...options, method, url, data })
  return response.data
}

export const http = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, options),
  post: <T>(url: string, data?: unknown, options?: RequestOptions) => request<T>('POST', url, options, data),
  put: <T>(url: string, data?: unknown, options?: RequestOptions) => request<T>('PUT', url, options, data),
  patch: <T>(url: string, data?: unknown, options?: RequestOptions) => request<T>('PATCH', url, options, data),
  delete: <T>(url: string, options?: RequestOptions) => request<T>('DELETE', url, options),
}
