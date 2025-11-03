'use client'

import { memo } from 'react'
import { Address } from '@/types'
import { getStatusColor, getStatusLabel } from '@/utils/addressUtils'

interface AddressListViewProps {
  addresses: Address[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectAddress: (id: string) => void
}

function AddressListView({
  addresses,
  searchQuery,
  onSearchChange,
  onSelectAddress,
}: AddressListViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="Search addresses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {addresses.length === 0 ? (
          <div className="p-5 text-center text-gray-500">No addresses found</div>
        ) : (
          addresses.map((address) => {
            const statusColorClass = getStatusColor(address.wizardStatus)
            return (
              <div
                key={address.id}
                onClick={() => onSelectAddress(address.id)}
                className="p-2.5 mb-2 bg-white rounded cursor-pointer border border-gray-200 shadow-sm transition-all hover:bg-gray-50 hover:border-primary-500 hover:shadow-md"
              >
                <div className="mb-1.5">
                  <div className="text-xs text-gray-600 mb-0.5">Given Address:</div>
                  <div className="text-sm font-medium leading-tight">{address.givenAddress}</div>
                </div>
                
                {address.validatedAddress && (
                  <div className="mb-1.5">
                    <div className="text-xs text-gray-600 mb-0.5">Validated Address:</div>
                    <div className="text-sm text-green-500 leading-tight">{address.validatedAddress}</div>
                  </div>
                )}
                
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white ${statusColorClass}`}>
                    {getStatusLabel(address)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default memo(AddressListView)

