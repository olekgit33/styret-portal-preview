'use client'

import { memo } from 'react'

function Footer() {
  return (
    <footer className="w-full h-16 bg-white border-t border-gray-200 shadow-sm flex items-center justify-center px-6">
      <div className="flex items-center justify-between w-full max-w-7xl">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} Manager Data Entry. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)

