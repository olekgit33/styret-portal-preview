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
    <div className="px-2 py-1.5 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
      {label && <div className="mb-0.5 text-xs text-gray-600 font-medium">{label}</div>}
      <div className="w-full h-1 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-gray-500 font-medium">
        {completedCount} / {totalCount} completed
      </div>
    </div>
  )
}

export default memo(ProgressBar)

