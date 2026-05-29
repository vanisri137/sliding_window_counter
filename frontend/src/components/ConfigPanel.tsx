'use client'

import { useState, useEffect } from 'react'
import type { ConfigResponse, ConfigUpdateRequest } from '@/types'

interface Props {
  config:  ConfigResponse | null
  onSave:  (cfg: ConfigUpdateRequest) => Promise<void>
}

export function ConfigPanel({ config, onSave }: Props) {
  const [limit,          setLimit]          = useState(10)
  const [windowSeconds,  setWindowSeconds]  = useState(60)
  const [subWindow,      setSubWindow]      = useState(10)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)

  useEffect(() => {
    if (config) {
      setLimit(config.limit)
      setWindowSeconds(config.windowSeconds)
      setSubWindow(config.subWindowSeconds)
    }
  }, [config])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ limit, windowSeconds, subWindowSeconds: subWindow })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#4a4a6a] font-mono">
        Dynamic Configuration
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Request Limit" value={limit} min={1} max={1000}
               onChange={setLimit} unit="req" />
        <Field label="Window Size"   value={windowSeconds} min={1} max={3600}
               onChange={setWindowSeconds} unit="sec" />
        <Field label="Sub-Window"    value={subWindow} min={1} max={windowSeconds}
               onChange={setSubWindow} unit="sec" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-[#4a4a6a]">
          Changes apply instantly — no restart needed.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-mono border border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87] hover:text-[#0a0a0f] transition-all disabled:opacity-50">
          {saving ? 'saving…' : saved ? '✓ saved' : 'Apply'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label, value, min, max, onChange, unit,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-[#4a4a6a] font-mono">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-md px-3 py-1.5 text-sm font-mono text-[#e8e8f0] focus:outline-none focus:border-[#00ff87]/50"
        />
        <span className="text-[10px] font-mono text-[#4a4a6a] shrink-0">{unit}</span>
      </div>
    </div>
  )
}
