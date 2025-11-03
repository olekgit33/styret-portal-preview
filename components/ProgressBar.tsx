'use client'

import { memo } from 'react'

interface ProgressBarProps {
  completedCount: number
  totalCount: number
  label?: string
}

function ProgressBar({ completedCount, totalCount, label = '' }: ProgressBarProps) {
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <div className="px-2.5 py-2 border-b border-slate-200/40 bg-gradient-to-r from-white via-slate-50/60 to-white backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.8)]">
      <div className="flex items-center justify-between mb-1">
        {label && <div className="text-xs text-slate-600 font-semibold">{label}</div>}
        <div className="text-[10px] text-slate-600 font-bold">
          {completedCount}/{totalCount}
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 transition-all duration-500 ease-out shadow-[0_2px_4px_rgba(16,185,129,0.3)] relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
      <div className="mt-1 text-[10px] text-slate-600 font-bold">
        {completedCount} / {totalCount} completed
      </div>
    </div>
  )
}

export default memo(ProgressBar)

