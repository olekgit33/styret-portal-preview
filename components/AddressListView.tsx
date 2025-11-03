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
    <div className="h-full w-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Modern Search Bar */}
      <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-b border-slate-200/50 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
        <div className="relative group">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg className={`w-5 h-5 transition-colors duration-200 ${searchQuery ? 'text-blue-600' : 'text-slate-400 group-focus-within:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group/clear z-10"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover/clear:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <input
            type="text"
            placeholder="Search addresses by name or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:border-slate-300/80"
          />
          
          {/* Focus Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none -z-0" />
        </div>
        
        {/* Search Results Count */}
        {searchQuery && addresses.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              {addresses.length} {addresses.length === 1 ? 'result' : 'results'}
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>
        )}
      </div>
      
      {/* Modern Address List */}
      <div className="flex-1 overflow-y-scroll px-3 py-3 space-y-2 address-list-scroll" style={{ 
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        maxHeight: '100%'
      }}>
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-slate-100/80 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-slate-600 mb-1">No addresses found</div>
            <div className="text-xs text-slate-400">Try adjusting your search</div>
          </div>
        ) : (
          addresses.map((address) => {
            const statusColorClass = getStatusColor(address.wizardStatus)
            const isCompleted = address.wizardStatus === 'completed'
            const isInProgress = address.wizardStatus === 'in-progress'
            
            return (
              <div
                key={address.id}
                onClick={() => onSelectAddress(address.id)}
                className="group p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 cursor-pointer transition-all duration-300 hover:border-blue-400/60 hover:shadow-[0_4px_12px_rgba(59,130,246,0.15)] hover:scale-[1.01] hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                {/* Header with Icon and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                        : isInProgress
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    {/* Address Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Given</div>
                        {address.validatedAddress && (
                          <>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Validated</div>
                          </>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-800 leading-tight truncate" title={address.givenAddress}>
                        {address.givenAddress}
                      </div>
                      {address.validatedAddress && (
                        <div className="text-xs font-semibold text-emerald-700 leading-tight truncate mt-1" title={address.validatedAddress}>
                          {address.validatedAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0 ml-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        : isInProgress
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                        : 'bg-gradient-to-r from-slate-400 to-slate-500'
                    }`}>
                      {isCompleted && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isInProgress && (
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      <span className="uppercase tracking-wide">{address.wizardStatus === 'in-progress' ? 'In Progress' : address.wizardStatus === 'completed' ? 'Completed' : 'Not Started'}</span>
                    </span>
                  </div>
                </div>
                
                {/* Steps Progress Bar */}
                {(isInProgress || isCompleted) && address.stepsCompleted !== undefined && (() => {
                  const stepsCompleted = address.stepsCompleted ?? 0
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                          }`} />
                          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Wizard Progress</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-xs font-bold ${
                            isCompleted ? 'text-emerald-600' : 'text-orange-600'
                          }`}>
                            {isCompleted ? '100%' : `${Math.round((stepsCompleted / 4) * 100)}%`}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500">
                            {stepsCompleted}/4
                          </div>
                        </div>
                      </div>
                      
                      {/* Modern Progress Bar */}
                      <div className="relative">
                        {/* Background Track */}
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                          {/* Progress Fill */}
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 shadow-[0_2px_6px_rgba(16,185,129,0.4)]'
                                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 shadow-[0_2px_6px_rgba(251,146,60,0.4)]'
                            }`}
                            style={{ width: `${isCompleted ? 100 : (stepsCompleted / 4) * 100}%` }}
                          >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                            
                            {/* Glow Effect at end */}
                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full blur-md opacity-50 ${
                              isCompleted ? 'bg-emerald-400' : 'bg-orange-400'
                            }`} />
                          </div>
                        </div>
                        
                        {/* Step Markers */}
                        <div className="absolute inset-0 flex items-center justify-between px-0.5 pointer-events-none mt-0.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`w-0.5 h-1.5 rounded-full transition-all duration-300 ${
                                step <= stepsCompleted
                                  ? isCompleted
                                    ? 'bg-emerald-400 shadow-[0_0_3px_rgba(16,185,129,0.6)]'
                                    : 'bg-orange-400 shadow-[0_0_3px_rgba(251,146,60,0.6)]'
                                  : 'bg-slate-300/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Progress Label */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <>
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">All Steps Completed</span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                              <span className="text-[10px] font-semibold text-slate-500">
                                {4 - stepsCompleted} step{4 - stepsCompleted !== 1 ? 's' : ''} remaining
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default memo(AddressListView)

