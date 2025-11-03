'use client'

import { memo } from 'react'

interface ElevatorModalProps {
  onYes: () => void
  onNo: () => void
}

function ElevatorModal({ onYes, onNo }: ElevatorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200/60 animate-[scale_0.3s_ease-out]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Elevator Question</h3>
        </div>
        
        <p className="text-slate-700 mb-6 leading-relaxed">
          Is there an elevator behind this door?
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onYes}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.5)] transition-all duration-200 transform hover:scale-[1.02]"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-xl font-semibold hover:from-slate-500 hover:to-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:scale-[1.02]"
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(ElevatorModal)

