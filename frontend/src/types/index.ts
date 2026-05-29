// ── API Response Types ────────────────────────────────────────────────────────

export interface RateLimitResponse {
  allowed: boolean
  remainingRequests: number
  limit: number
  windowSeconds: number
  message?: string
}

export interface StatsResponse {
  clientId: string
  currentRequests: number
  remainingRequests: number
  limit: number
  windowSeconds: number
  subWindowSeconds: number
}

export interface HealthResponse {
  status: string
}

export interface ConfigResponse {
  limit: number
  windowSeconds: number
  subWindowSeconds: number
}

export interface ConfigUpdateRequest {
  limit: number
  windowSeconds: number
  subWindowSeconds: number
}

// ── Local UI Types ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  timestamp: Date
  clientId: string
  allowed: boolean
  remainingRequests: number
}

export interface WindowDot {
  id: string
  timestamp: number   // ms
  clientId: string
}
