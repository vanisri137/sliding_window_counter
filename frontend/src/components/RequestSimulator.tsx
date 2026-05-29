'use client'

import { useState } from 'react'
import clsx from 'clsx'

const PRESET_CLIENTS = ['user1', 'user2', 'user3']

interface Props {
  clientId: string
  onClientChange: (id: string) => void
  onSend: () => void
  onReset: () => void
  loading: boolean
  lastResult: { allowed: boolean; message?: string } | null
}

export function RequestSimulator({ clientId, onClientChange, onSend, onReset, loading, lastResult }: Props) {
  const [custom, setCustom] = useState(false)

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">Request Simulator</p>

      {/* Client selector */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {PRESET_CLIENTS.map(id => (
            <button
              key={id}
              onClick={() => { setCustom(false); onClientChange(id) }}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-mono border transition-all',
                clientId === id && !custom
                  ? 'border-[#00ff87] text-[#00ff87] bg-[#00ff87]/10'
                  : 'border-[#1e1e2e] text-[#4a4a6a] hover:border-[#4a4a6a] hover:text-[#e8e8f0]',
              )}>
              {id}
            </button>
          ))}
          <button
            onClick={() => setCustom(true)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-mono border transition-all',
              custom
                ? 'border-[#00ff87] text-[#00ff87] bg-[#00ff87]/10'
                : 'border-[#1e1e2e] text-[#4a4a6a] hover:border-[#4a4a6a] hover:text-[#e8e8f0]',
            )}>
            custom
          </button>
        </div>

        {custom && (
          <input
            type="text"
            value={clientId}
            onChange={e => onClientChange(e.target.value)}
            placeholder="Enter client ID..."
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-md px-3 py-2 text-sm font-mono text-[#e8e8f0] placeholder-[#4a4a6a] focus:outline-none focus:border-[#00ff87]/50"
          />
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSend}
          disabled={loading || !clientId}
          className={clsx(
            'flex-1 py-2.5 rounded-lg font-mono text-sm font-medium transition-all border',
            loading
              ? 'border-[#1e1e2e] text-[#4a4a6a] cursor-not-allowed'
              : 'border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87] hover:text-[#0a0a0f] active:scale-[0.98]',
          )}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-[#4a4a6a] border-t-transparent rounded-full animate-spin" />
              sending…
            </span>
          ) : (
            '→ Send Request'
          )}
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-lg font-mono text-xs border border-[#1e1e2e] text-[#4a4a6a] hover:border-[#ff6b35]/50 hover:text-[#ff6b35] transition-all">
          reset
        </button>
      </div>

      {/* Result badge */}
      {lastResult && (
        <div className={clsx(
          'rounded-lg px-4 py-3 border text-sm font-mono animate-slide-up',
          lastResult.allowed
            ? 'bg-[#00ff87]/5 border-[#00ff87]/30 text-[#00ff87]'
            : 'bg-[#ff6b35]/5 border-[#ff6b35]/30 text-[#ff6b35]',
        )}>
          {lastResult.allowed ? '✓ Request allowed' : `✗ ${lastResult.message ?? 'Rate limit exceeded'}`}
        </div>
      )}
    </div>
  )
}
