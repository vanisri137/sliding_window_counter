'use client'

import { useState, useCallback, useEffect } from 'react'
import { sendRequest, getStats, resetClient, getConfig, updateConfig } from '@/lib/api'
import type {
  StatsResponse,
  ConfigResponse,
  HistoryEntry,
  WindowDot,
  ConfigUpdateRequest,
} from '@/types'

const MAX_HISTORY = 20
const MAX_DOTS    = 50   // cap dots in the timeline

export function useRateLimiter(initialClientId = 'user1') {
  const [clientId, setClientId]     = useState(initialClientId)
  const [stats, setStats]           = useState<StatsResponse | null>(null)
  const [config, setConfig]         = useState<ConfigResponse | null>(null)
  const [history, setHistory]       = useState<HistoryEntry[]>([])
  const [dots, setDots]             = useState<WindowDot[]>([])
  const [loading, setLoading]       = useState(false)
  const [lastResult, setLastResult] = useState<{ allowed: boolean; message?: string } | null>(null)
  const [backendUp, setBackendUp]   = useState<boolean | null>(null)

  // ── Boot: load config and check health ───────────────────────────────────

  useEffect(() => {
    getConfig()
      .then(cfg => { setConfig(cfg); setBackendUp(true) })
      .catch(() => setBackendUp(false))
  }, [])

  // ── Auto-refresh stats for active client every 3s ─────────────────────────

  useEffect(() => {
    if (!backendUp) return
    const id = setInterval(() => {
      getStats(clientId).then(setStats).catch(() => {})
    }, 3000)
    return () => clearInterval(id)
  }, [clientId, backendUp])

  // ── Prune expired dots from the visual timeline ──────────────────────────

  useEffect(() => {
    if (!config) return
    const id = setInterval(() => {
      const cutoff = Date.now() - config.windowSeconds * 1000
      setDots(prev => prev.filter(d => d.timestamp > cutoff))
    }, 1000)
    return () => clearInterval(id)
  }, [config])

  // ── Core actions ──────────────────────────────────────────────────────────

  const doSendRequest = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sendRequest(clientId)
      setLastResult({ allowed: res.allowed, message: res.message })

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        clientId,
        allowed: res.allowed,
        remainingRequests: res.remainingRequests,
      }
      setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY))

      if (res.allowed) {
        const dot: WindowDot = { id: entry.id, timestamp: Date.now(), clientId }
        setDots(prev => [...prev, dot].slice(-MAX_DOTS))
      }

      // Refresh stats
      const fresh = await getStats(clientId)
      setStats(fresh)
    } catch {
      setLastResult({ allowed: false, message: 'Backend unreachable' })
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const doReset = useCallback(async () => {
    await resetClient(clientId)
    setDots(prev => prev.filter(d => d.clientId !== clientId))
    const fresh = await getStats(clientId)
    setStats(fresh)
  }, [clientId])

  const doUpdateConfig = useCallback(async (cfg: ConfigUpdateRequest) => {
    const updated = await updateConfig(cfg)
    setConfig(updated)
  }, [])

  return {
    clientId, setClientId,
    stats, config,
    history, dots,
    loading, lastResult, backendUp,
    sendRequest: doSendRequest,
    reset: doReset,
    updateConfig: doUpdateConfig,
  }
}
