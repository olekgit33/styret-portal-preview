'use client'

import { memo } from 'react'

interface DoorConfirmationProps {
  position: { x: number; y: number }
  onConfirm: () => void
  onCancel: () => void
}

function DoorConfirmation({ position, onConfirm, onCancel }: DoorConfirmationProps) {
  return (
    <div
      className="fixed flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 z-[10000]"
      style={{
        left: position.x - 60,
        top: position.y - 40,
      }}
    >
      <button
        onClick={onConfirm}
        className="w-8 h-8 flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors"
        title="Confirm door placement"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        onClick={onCancel}
        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
        title="Cancel door placement"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default memo(DoorConfirmation)

