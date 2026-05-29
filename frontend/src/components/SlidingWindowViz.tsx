'use client'

import { useMemo } from 'react'
import type { WindowDot, ConfigResponse } from '@/types'
import clsx from 'clsx'

const CLIENT_COLORS: Record<string, string> = {
  user1: '#00ff87',
  user2: '#7b61ff',
  user3: '#ff6b35',
}

function clientColor(id: string) {
  return CLIENT_COLORS[id] ?? '#e8e8f0'
}

interface Props {
  dots:   WindowDot[]
  config: ConfigResponse | null
  limit:  number
}

export function SlidingWindowViz({ dots, config, limit }: Props) {
  const now      = Date.now()
  const windowMs = (config?.windowSeconds ?? 60) * 1000

  // Positions as 0–1 fractions within the window
  const positioned = useMemo(() => {
    return dots
      .filter(d => now - d.timestamp < windowMs)
      .map(d => ({
        ...d,
        frac: 1 - (now - d.timestamp) / windowMs,
      }))
  }, [dots, now, windowMs])

  const capacity = Math.max(limit, 1)
  const used     = positioned.length
  const pct      = Math.min((used / capacity) * 100, 100)

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">
          Sliding Window Visualization
        </p>
        <span className="text-[10px] font-mono text-[#4a4a6a]">
          {used} / {capacity} requests
        </span>
      </div>

      {/* Timeline track */}
      <div className="relative h-12 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 rounded-l-lg"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? 'rgba(255,107,53,0.12)'
              : 'rgba(0,255,135,0.07)',
          }}
        />

        {/* Time ticks */}
        {[0.25, 0.5, 0.75].map(f => (
          <div
            key={f}
            className="absolute inset-y-0 border-l border-[#1e1e2e]/60"
            style={{ left: `${f * 100}%` }}
          />
        ))}

        {/* Dots */}
        {positioned.map(d => (
          <div
            key={d.id}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-300"
            style={{
              left:       `calc(${d.frac * 100}% - 6px)`,
              background: clientColor(d.clientId),
              boxShadow:  `0 0 8px ${clientColor(d.clientId)}88`,
            }}
            title={`${d.clientId} @ ${new Date(d.timestamp).toLocaleTimeString()}`}
          />
        ))}

        {/* Labels */}
        <span className="absolute left-2 bottom-1 text-[9px] font-mono text-[#4a4a6a]">now</span>
        <span className="absolute right-2 bottom-1 text-[9px] font-mono text-[#4a4a6a]">
          -{config?.windowSeconds ?? 60}s
        </span>
      </div>

      {/* Capacity bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-[#0a0a0f] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${pct}%`,
              background: pct >= 100 ? '#ff6b35' : '#00ff87',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[#4a4a6a]">
          <span>window capacity</span>
          <span className={clsx(pct >= 100 && 'text-[#ff6b35]')}>{Math.round(pct)}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(CLIENT_COLORS).map(([id, color]) => (
          <span key={id} className="flex items-center gap-1.5 text-[10px] font-mono text-[#4a4a6a]">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {id}
          </span>
        ))}
      </div>
    </div>
  )
}
