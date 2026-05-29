'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { HistoryEntry } from '@/types'

interface Props { history: HistoryEntry[] }

export function RequestRateChart({ history }: Props) {
  const data = useMemo(() => {
    // Group into 10-second buckets over last 2 minutes
    const now       = Date.now()
    const bucketMs  = 10_000
    const numBuckets = 12

    const buckets = Array.from({ length: numBuckets }, (_, i) => {
      const bucketStart = now - (numBuckets - i) * bucketMs
      const label       = `-${(numBuckets - i) * 10}s`
      return { label, allowed: 0, denied: 0, bucketStart }
    })

    for (const entry of history) {
      const age    = now - entry.timestamp.getTime()
      const idx    = numBuckets - 1 - Math.floor(age / bucketMs)
      if (idx >= 0 && idx < numBuckets) {
        if (entry.allowed) buckets[idx].allowed++
        else               buckets[idx].denied++
      }
    }

    return buckets.map(({ label, allowed, denied }) => ({ label, allowed, denied }))
  }, [history])

  const hasData = data.some(d => d.allowed > 0 || d.denied > 0)

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">
          Request Rate (2 min)
        </p>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-[#4a4a6a]">
            <span className="w-2 h-2 rounded-sm bg-[#00ff87]" /> allowed
          </span>
          <span className="flex items-center gap-1.5 text-[#4a4a6a]">
            <span className="w-2 h-2 rounded-sm bg-[#ff6b35]" /> denied
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-32 flex items-center justify-center text-xs font-mono text-[#4a4a6a]">
          Send some requests to see the chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} barSize={8} barGap={2}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#4a4a6a', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: '#111118',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono',
                color: '#e8e8f0',
              }}
              cursor={{ fill: '#1e1e2e' }}
            />
            <Bar dataKey="allowed" fill="#00ff87" radius={[2, 2, 0, 0]} />
            <Bar dataKey="denied"  fill="#ff6b35" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
