'use client'

import type { HistoryEntry } from '@/types'
import clsx from 'clsx'

interface Props { history: HistoryEntry[] }

export function RequestHistory({ history }: Props) {
  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e2e]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">
          Request History
          <span className="ml-2 text-[#4a4a6a]">last {history.length} / 20</span>
        </p>
      </div>

      {history.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs font-mono text-[#4a4a6a]">
          No requests yet — send one above ↑
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {['Timestamp', 'Client ID', 'Status', 'Remaining'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest text-[#4a4a6a]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={clsx(
                    'border-b border-[#1e1e2e]/50 transition-colors',
                    i === 0 && 'animate-slide-up',
                    'hover:bg-[#1e1e2e]/30',
                  )}>
                  <td className="px-4 py-2.5 text-[#4a4a6a]">
                    {entry.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 text-[#e8e8f0]">{entry.clientId}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] border',
                      entry.allowed
                        ? 'text-[#00ff87] border-[#00ff87]/30 bg-[#00ff87]/5'
                        : 'text-[#ff6b35] border-[#ff6b35]/30 bg-[#ff6b35]/5',
                    )}>
                      <span className={clsx(
                        'w-1.5 h-1.5 rounded-full',
                        entry.allowed ? 'bg-[#00ff87]' : 'bg-[#ff6b35]',
                      )} />
                      {entry.allowed ? 'ALLOWED' : 'DENIED'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-[#e8e8f0]">
                    {entry.remainingRequests}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
