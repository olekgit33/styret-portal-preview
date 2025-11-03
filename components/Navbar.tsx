'use client'

import { memo } from 'react'

function Navbar() {
  return (
    <nav className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Manager Data Entry</h1>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Settings
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Help
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </nav>
  )
}

export default memo(Navbar)

