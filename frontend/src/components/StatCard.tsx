'use client'

import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  warn?: boolean
}

export function StatCard({ label, value, sub, accent, warn }: StatCardProps) {
  return (
    <div className={clsx(
      'relative rounded-xl border p-5 flex flex-col gap-1 overflow-hidden transition-all duration-200',
      accent && 'border-[#00ff87]/30 bg-[#00ff87]/5',
      warn   && 'border-[#ff6b35]/30 bg-[#ff6b35]/5',
      !accent && !warn && 'border-[#1e1e2e] bg-[#111118]',
    )}>
      {/* Corner accent bar */}
      <span className={clsx(
        'absolute top-0 left-0 h-[2px] w-12 rounded-br',
        accent && 'bg-[#00ff87]',
        warn   && 'bg-[#ff6b35]',
        !accent && !warn && 'bg-[#4a4a6a]',
      )} />

      <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">{label}</p>
      <p className={clsx(
        'text-3xl font-display font-bold tabular-nums',
        accent && 'text-[#00ff87]',
        warn   && 'text-[#ff6b35]',
        !accent && !warn && 'text-[#e8e8f0]',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#4a4a6a] font-mono">{sub}</p>}
    </div>
  )
}
