import axios from 'axios'
import type {
  RateLimitResponse,
  StatsResponse,
  HealthResponse,
  ConfigResponse,
  ConfigUpdateRequest,
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// POST /api/request
export async function sendRequest(clientId: string): Promise<RateLimitResponse> {
  try {
    const res = await api.post<RateLimitResponse>('/api/request', { clientId })
    return res.data
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      return err.response.data as RateLimitResponse
    }
    throw err
  }
}

// GET /api/stats/:clientId
export async function getStats(clientId: string): Promise<StatsResponse> {
  const res = await api.get<StatsResponse>(`/api/stats/${clientId}`)
  return res.data
}

// DELETE /api/reset/:clientId
export async function resetClient(clientId: string): Promise<void> {
  await api.delete(`/api/reset/${clientId}`)
}

// GET /api/health
export async function getHealth(): Promise<HealthResponse> {
  const res = await api.get<HealthResponse>('/api/health')
  return res.data
}

// GET /api/config
export async function getConfig(): Promise<ConfigResponse> {
  const res = await api.get<ConfigResponse>('/api/config')
  return res.data
}

// PUT /api/config
export async function updateConfig(cfg: ConfigUpdateRequest): Promise<ConfigResponse> {
  const res = await api.put<ConfigResponse>('/api/config', cfg)
  return res.data
}
