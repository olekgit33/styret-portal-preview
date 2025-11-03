'use client'

import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react'
import { Address, Category, ScenarioType } from '@/types'
import ProgressBar from './ProgressBar'

interface WizardViewProps {
  address: Address
  onBack: () => void
  onUpdate: (updates: Partial<Address>) => void
  onNavigate: (direction: 'prev' | 'next') => void
  totalAddresses: number
  completedCount: number
  activeScenario?: ScenarioType | null
  onScenarioSelect?: (scenario: ScenarioType | null) => void
  isEditingDoor?: boolean
  onEditDoorChange?: (isEditing: boolean) => void
}

const CATEGORIES: Category[] = ['Validation', 'Placing Door', 'Scenarios', 'Parking Spot']
const SCENARIOS: ScenarioType[] = ['Door to taxi', 'car/truck to Door', 'bicycle to Door', 'ambulance to Door']

function WizardView({
  address,
  onBack,
  onUpdate,
  onNavigate,
  totalAddresses,
  completedCount,
  activeScenario,
  onScenarioSelect,
  isEditingDoor,
  onEditDoorChange,
}: WizardViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSelectFocused, setIsSelectFocused] = useState(false)
  const step3Ref = useRef<HTMLDivElement>(null)
  const prevDoorPosition = useRef<{ lat: number; lng: number } | undefined>(address.doorPosition)
  
  // Auto-scroll to step 3 when door is placed
  useEffect(() => {
    if (address.doorPosition && !prevDoorPosition.current && step3Ref.current) {
      // Door was just placed, scroll to step 3
      setTimeout(() => {
        step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
    prevDoorPosition.current = address.doorPosition
  }, [address.doorPosition])

  // Calculate category completion
  const categoryProgress = useMemo(() => {
    let completed = 0
    
    if (address.validatedAddress || address.selectedAddress) {
      completed++
    } else {
      return { completed, total: CATEGORIES.length }
    }
    
    if (address.doorPosition) {
      completed++
    } else {
      return { completed, total: CATEGORIES.length }
    }
    
    if (address.selectedScenarios && address.selectedScenarios.length > 0) {
      completed++
    } else {
      return { completed, total: CATEGORIES.length }
    }
    
    if (address.parkingSpotSet) {
      completed++
    }
    
    return { completed, total: CATEGORIES.length }
  }, [address])

  // Determine which categories are enabled
  const isCategoryEnabled = useCallback((category: Category): boolean => {
    switch (category) {
      case 'Validation':
        return true
      case 'Placing Door':
        return !!(address.validatedAddress || address.selectedAddress)
      case 'Scenarios':
        return !!address.doorPosition
      case 'Parking Spot':
        return !!(address.selectedScenarios && address.selectedScenarios.length > 0)
      default:
        return false
    }
  }, [address])

  // Sample addresses for validation dropdown
  const searchAddresses = useMemo(() => {
    const baseAddresses = [
      address.givenAddress,
      address.validatedAddress || '',
      `${address.givenAddress.split(',')[0]} Street, ${address.givenAddress.split(',')[1]?.trim() || ''}`,
      `${address.givenAddress.split(',')[0]} Avenue, ${address.givenAddress.split(',')[1]?.trim() || ''}`,
    ].filter(Boolean)

    if (!searchQuery.trim()) return baseAddresses
    const query = searchQuery.toLowerCase()
    return baseAddresses.filter((addr) => addr.toLowerCase().includes(query))
  }, [address, searchQuery])

  const handleScenarioToggle = useCallback((scenario: ScenarioType) => {
    const current = address.selectedScenarios || []
    const updated = current.includes(scenario)
      ? current.filter((s) => s !== scenario)
      : [...current, scenario]
    onUpdate({ selectedScenarios: updated })
  }, [address.selectedScenarios, onUpdate])

  const handleAddressSelect = useCallback((selected: string) => {
    onUpdate({ selectedAddress: selected, validatedAddress: selected || undefined })
  }, [onUpdate])

  const validationEnabled = isCategoryEnabled('Validation')
  const doorEnabled = isCategoryEnabled('Placing Door')
  const scenariosEnabled = isCategoryEnabled('Scenarios')
  const parkingEnabled = isCategoryEnabled('Parking Spot')

  // Determine which step is currently active (being worked on)
  const getActiveStep = useCallback((): number | null => {
    // Step 1 is active if validation is not completed OR if user is interacting with the select
    const isStep1Completed = !!(address.validatedAddress || address.selectedAddress)
    if (!isStep1Completed || isSelectFocused) {
      return 1
    }
    // Step 2 is active if door is not placed
    if (!address.doorPosition) {
      return 2
    }
    // Step 3 is active if door is placed and scenarios are being worked on or not all scenarios have paths
    if (address.doorPosition) {
      const scenarioPaths = address.scenarioPaths || {}
      const hasAllPaths = SCENARIOS.every(s => scenarioPaths[s])
      // Active if currently drawing a path OR not all scenarios have paths yet
      if (activeScenario || !hasAllPaths) {
        return 3
      }
    }
    // Step 4 is active if all scenarios have paths but parking spot is not set
    if (address.scenarioPaths) {
      const scenarioPaths = address.scenarioPaths
      const hasAllPaths = SCENARIOS.every(s => scenarioPaths[s])
      if (hasAllPaths && !address.parkingSpotSet) {
        return 4
      }
    }
    return null
  }, [address, activeScenario, isSelectFocused])

  // Check if a step is completed
  const isStepCompleted = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: // Validation
        return !!(address.validatedAddress || address.selectedAddress)
      case 2: // Placing Door
        return !!address.doorPosition
      case 3: // Scenarios - all scenarios have paths
        if (!address.scenarioPaths) return false
        return SCENARIOS.every(s => address.scenarioPaths?.[s])
      case 4: // Parking Spot
        return !!address.parkingSpotSet
      default:
        return false
    }
  }, [address])

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Back Button */}
      <div className="flex-shrink-0 px-2 py-1.5 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <button
          onClick={onBack}
          className="px-2.5 py-1 bg-white/60 hover:bg-white border border-gray-300/50 rounded-lg text-xs font-medium cursor-pointer hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
        >
          ← Back
        </button>
      </div>

      {/* Current Address Section */}
      <div className="flex-shrink-0 px-2 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Address</span>
              {address.validatedAddress && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100/80 text-green-800 backdrop-blur-sm">
                  <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Validated
                </span>
              )}
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-md px-1.5 py-1 border border-gray-200/50 shadow-sm">
              <div className="text-[10px] text-gray-500 font-medium mb-0.5">Original</div>
              <div className="text-xs text-gray-900 truncate" title={address.givenAddress}>
                {address.givenAddress}
              </div>
            </div>
            {address.validatedAddress && (
              <div className="bg-green-50/70 backdrop-blur-sm rounded-md px-1.5 py-1 border border-green-200/50 shadow-sm">
                <div className="text-[10px] text-green-700 font-medium mb-0.5">Validated</div>
                <div className="text-xs font-semibold text-green-900 truncate" title={address.validatedAddress}>
                  {address.validatedAddress}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Address Progress Bar */}
      <div className="flex-shrink-0">
        <ProgressBar completedCount={completedCount} totalCount={totalAddresses} />
      </div>

      {/* Wizard Steps - Scrollable Section */}
      <div className="flex-1 overflow-y-scroll overflow-x-hidden p-2 flex flex-col gap-2 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c1c1c1 #f1f1f1' }}>
        {/* Validation Step */}
        <div className={`p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md flex flex-col relative transition-all duration-200 ${!validationEnabled ? 'opacity-60' : ''}`}>
          {isStepCompleted(1) && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-sm font-semibold mb-1.5">
            {getActiveStep() === 1 && (
              <span className="mr-1.5 text-primary-500 text-xs">▶</span>
            )}
            <span className="text-sm">Step 1. Validation</span>
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="block text-xs mb-0.5 text-gray-600">We found similar addresses. Please select the correct one to continue.</label>
            <select
              value={address.selectedAddress || ''}
              onChange={(e) => handleAddressSelect(e.target.value)}
              onFocus={() => setIsSelectFocused(true)}
              onBlur={() => setIsSelectFocused(false)}
              className="w-full px-2 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 transition-all shadow-sm"
            >
              <option value="">Select an address...</option>
              {searchAddresses.map((addr, idx) => (
                <option key={idx} value={addr}>
                  {addr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Place Door Step */}
        <div 
          className={`p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md flex flex-col relative transition-all duration-200 ${!doorEnabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-white/90'}`}
          onClick={() => {
            if (doorEnabled && onEditDoorChange) {
              onEditDoorChange(!isEditingDoor)
            }
          }}
        >
          {isStepCompleted(2) && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-sm font-semibold mb-1.5">
            {(getActiveStep() === 2 || isEditingDoor) && (
              <span className="mr-1.5 text-primary-500 text-xs">▶</span>
            )}
            <span className="text-sm">Step 2. Placing Door</span>
          </div>
          <div className="text-xs text-gray-600 flex-1 flex items-center leading-relaxed">
            {address.doorPosition ? (
              <div className="text-green-600 font-medium">
                {isEditingDoor ? 'Click on the map to change the door position' : '✓ Door placed at ' + address.doorPosition.lat.toFixed(4) + ', ' + address.doorPosition.lng.toFixed(4)}
              </div>
            ) : (
              <div>
                Click on the map to place the door. The door icon will follow your mouse cursor.
              </div>
            )}
          </div>
        </div>

        {/* Scenarios Step */}
        <div ref={step3Ref} className={`p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md flex flex-col relative transition-all duration-200 ${!scenariosEnabled ? 'opacity-60' : ''}`}>
          {isStepCompleted(3) && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-sm font-semibold mb-1.5">
            {getActiveStep() === 3 && !activeScenario && !isEditingDoor && (
              <span className="mr-1.5 text-primary-500 text-xs">▶</span>
            )}
            <span className="text-sm">Step 3. Draw Path</span>
          </div>
          <label className="block text-xs mb-1.5 text-gray-600">There are 4 scenarios, each represents a path.</label>
          <div className="flex flex-col gap-1.5 flex-1">
            {SCENARIOS.map((scenario) => {
              const hasPath = !!address.scenarioPaths?.[scenario]
              const stepEnabled = isCategoryEnabled('Scenarios')
              const isActive = activeScenario === scenario

              return (
                <div
                  key={scenario}
                  className={`flex items-center p-1.5 rounded-lg border transition-all duration-200 ${
                    hasPath 
                      ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-400/50 backdrop-blur-sm shadow-sm' 
                      : isActive && stepEnabled
                      ? 'bg-gradient-to-r from-primary-50/80 to-yellow-50/80 border-primary-400/70 ring-1 ring-primary-300/50 backdrop-blur-sm shadow-sm' 
                      : stepEnabled
                      ? 'bg-gray-50/60 border-gray-200/50 hover:border-gray-300/50 hover:bg-gray-50/80 backdrop-blur-sm' 
                      : 'bg-gray-50/40 border-gray-200/30 opacity-60'
                  } ${stepEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => {
                    if (stepEnabled && address.doorPosition && onScenarioSelect) {
                      onScenarioSelect(isActive ? null : scenario)
                    }
                  }}
                >
                  {isActive && stepEnabled && !hasPath && !isEditingDoor && (
                    <span className="mr-1.5 text-primary-500 text-xs">▶</span>
                  )}
                  {hasPath && <span className="mr-1.5 text-green-600 text-xs">✓</span>}
                  <span className="text-xs font-medium capitalize text-gray-700">{scenario}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Parking Spot Step */}
        <div className={`p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md flex flex-col relative transition-all duration-200 ${!parkingEnabled ? 'opacity-60' : ''}`}>
          {isStepCompleted(4) && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-sm font-semibold mb-1.5">
            {getActiveStep() === 4 && (
              <span className="mr-1.5 text-primary-500 text-xs">▶</span>
            )}
            <span className="text-sm">Step 4. Parking Spot</span>
          </div>
          <div className="text-xs text-gray-600 flex-1 flex items-center">
            {address.parkingSpotSet ? (
              <div className="text-green-600 font-medium">✓ Parking spot set</div>
            ) : (
              <div>Click on the map to set the parking spot.</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-shrink-0 px-3 py-2 bg-gradient-to-br from-gray-50/90 to-white/90 backdrop-blur-sm border-t border-gray-200/50">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onNavigate('prev')}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-lg cursor-pointer text-xs font-semibold hover:border-primary-400/50 hover:bg-primary-50/80 hover:shadow-sm transition-all duration-200 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-700 group-hover:text-primary-600 transition-colors">Prev</span>
          </button>

          {/* Address Progress Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 font-medium">Progress</div>
                <div className="text-xs font-bold text-gray-900">
                  {completedCount}/{totalAddresses}
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => onNavigate('next')}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg cursor-pointer text-xs font-semibold hover:from-primary-600 hover:to-primary-700 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 flex-shrink-0"
          >
            <span className="text-white">Next</span>
            <svg className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(WizardView)

