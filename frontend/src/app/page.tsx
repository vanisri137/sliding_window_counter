'use client'

import { useRateLimiter } from '@/hooks/useRateLimiter'
import { StatCard }          from '@/components/StatCard'
import { RequestSimulator }  from '@/components/RequestSimulator'
import { SlidingWindowViz }  from '@/components/SlidingWindowViz'
import { RequestHistory }    from '@/components/RequestHistory'
import { ConfigPanel }       from '@/components/ConfigPanel'
import { RequestRateChart }  from '@/components/RequestRateChart'

export default function Dashboard() {
  const {
    clientId, setClientId,
    stats, config,
    history, dots,
    loading, lastResult, backendUp,
    sendRequest, reset, updateConfig,
  } = useRateLimiter()

  const limit     = stats?.limit     ?? config?.limit     ?? 10
  const remaining = stats?.remainingRequests ?? limit
  const current   = stats?.currentRequests   ?? 0
  const window    = stats?.windowSeconds     ?? config?.windowSeconds ?? 60

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight text-[#e8e8f0]">
            Distributed Rate Limiter Dashboard
          </h1>
          <p className="text-xs font-mono text-[#4a4a6a] mt-0.5">
            Sliding Window Counter · Redis · Spring Boot • Built by Vani Nandyala
          </p>
        </div>

       <div className="flex items-center gap-3">
  <a
    href="https://github.com/vanisri137/sliding_window_counter"
    target="_blank"
    rel="noopener noreferrer"
    className="px-3 py-1 border border-[#2a2a3a] rounded-lg text-xs font-mono text-[#e8e8f0] hover:border-[#00ff87] transition"
  >
    GitHub
  </a>

  <div className="flex items-center gap-2 text-[10px] font-mono">
    <span
      className={[
        'w-2 h-2 rounded-full',
        backendUp === null
          ? 'bg-[#4a4a6a] animate-pulse'
          : backendUp
          ? 'bg-[#00ff87] animate-pulse'
          : 'bg-[#ff6b35]',
      ].join(' ')}
    />
    <span className="text-[#4a4a6a]">
      {backendUp === null
        ? 'connecting…'
        : backendUp
        ? 'backend UP'
        : 'backend DOWN'}
    </span>
  </div>
</div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stat Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Request Limit"
            value={limit}
            sub="per window"
          />
          <StatCard
            label="Remaining"
            value={remaining}
            sub={`of ${limit}`}
            accent={remaining > 0}
            warn={remaining === 0}
          />
          <StatCard
            label="Current Requests"
            value={current}
            sub="in window"
            warn={current >= limit}
          />
          <StatCard
            label="Window Size"
            value={`${window}s`}
            sub={`sub: ${config?.subWindowSeconds ?? 10}s`}
          />
        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: simulator + config */}
          <div className="space-y-4">
            <RequestSimulator
              clientId={clientId}
              onClientChange={setClientId}
              onSend={sendRequest}
              onReset={reset}
              loading={loading}
              lastResult={lastResult}
            />
            <ConfigPanel config={config} onSave={updateConfig} />
          </div>

          {/* Right: visualization + chart */}
          <div className="space-y-4">
            <SlidingWindowViz dots={dots} config={config} limit={limit} />
            <RequestRateChart history={history} />
          </div>
        </div>

        {/* Full-width history table */}
        <RequestHistory history={history} />

        {/* Footer */}
        <footer className="text-center text-[10px] font-mono text-[#4a4a6a] pb-4">
          Sliding Window Counter · Redis-backed Rate Limiting · Spring Boot 3 · Next.js 14
        </footer>
      </div>
    </main>
  )
}
