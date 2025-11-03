'use client'

import { memo } from 'react'

interface ProgressBarProps {
  completedCount: number
  totalCount: number
  label?: string
}

function ProgressBar({ completedCount, totalCount, label = '' }: ProgressBarProps) {
  const progressPercentage = (completedCount / totalCount) * 100
  const isComplete = completedCount === totalCount && totalCount > 0

  return (
    <div className="px-4 py-3 border-b border-slate-200/50 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {label && (
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</div>
          )}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg shadow-sm ${
              isComplete 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {isComplete ? (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-bold text-slate-900 leading-none">
                {completedCount}<span className="text-sm font-semibold text-slate-500">/{totalCount}</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                Addresses
              </div>
            </div>
          </div>
        </div>
        
        {/* Percentage */}
        <div className="flex flex-col items-end">
          <div className={`text-lg font-bold leading-none ${
            isComplete ? 'text-emerald-600' : 'text-blue-600'
          }`}>
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
            Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background Track */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          {/* Progress Fill */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-[0_2px_8px_rgba(59,130,246,0.4)]'
            }`}
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            
            {/* Glow Effect */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-md opacity-60 ${
              isComplete ? 'bg-emerald-400' : 'bg-blue-400'
            }`} />
          </div>
        </div>
        
        {/* Progress Markers (optional visual enhancement) */}
        {totalCount <= 10 && (
          <div className="absolute inset-0 flex items-center justify-between px-0.5 pointer-events-none">
            {Array.from({ length: totalCount }).map((_, i) => (
              <div
                key={i}
                className={`w-0.5 h-2.5 rounded-full ${
                  i < completedCount
                    ? isComplete 
                      ? 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]'
                      : 'bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.6)]'
                    : 'bg-slate-300/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          <div className="text-[10px] font-semibold text-slate-500">
            {totalCount - completedCount} remaining
          </div>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide">All Complete</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ProgressBar)

