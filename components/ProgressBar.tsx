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
    <div className="px-4 py-2 border-b border-gray-200 bg-white">
      <div className="mb-1 text-sm text-gray-600">{label}</div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="mt-0.5 text-sm text-gray-500">
        {completedCount} / {totalCount} completed
      </div>
    </div>
  )
}

export default memo(ProgressBar)

