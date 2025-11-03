'use client'

import { useState, useMemo, memo, useCallback } from 'react'
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
const SCENARIOS: ScenarioType[] = ['taxi', 'car/truck', 'bicycle', 'ambulance']

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
      <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-gray-200">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-200 transition-colors"
        >
          ← Back to List
        </button>
      </div>

      {/* Current Address Section */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="space-y-1">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Original Address:</div>
            <div className="text-sm font-semibold text-gray-900">{address.givenAddress}</div>
          </div>
          {address.validatedAddress && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Validated Address:</div>
              <div className="text-sm font-semibold text-green-600">✓ {address.validatedAddress}</div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Address Progress Bar */}
      <div className="flex-shrink-0">
        <ProgressBar completedCount={completedCount} totalCount={totalAddresses} />
      </div>

      {/* Wizard Steps - Scrollable Section */}
      <div className="flex-1 overflow-y-scroll overflow-x-hidden p-4 flex flex-col gap-4 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c1c1c1 #f1f1f1' }}>
        {/* Validation Step */}
        <div className={`p-4 bg-white rounded-lg border shadow-sm flex flex-col relative ${!validationEnabled ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
          {isStepCompleted(1) && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-lg font-semibold mb-2">
            {getActiveStep() === 1 && (
              <span className="mr-2 text-primary-500">▶</span>
            )}
            <span>Step 1. Validation</span>
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="block text-sm mb-1 text-gray-600">We found similar addresses. Please select the correct one to continue.</label>
            <select
              value={address.selectedAddress || ''}
              onChange={(e) => handleAddressSelect(e.target.value)}
              onFocus={() => setIsSelectFocused(true)}
              onBlur={() => setIsSelectFocused(false)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          className={`p-4 bg-white rounded-lg border shadow-sm flex flex-col relative ${!doorEnabled ? 'opacity-60 border-gray-200 cursor-not-allowed' : 'border-gray-200 cursor-pointer hover:bg-gray-50'} ${isEditingDoor ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => {
            if (doorEnabled && onEditDoorChange) {
              onEditDoorChange(!isEditingDoor)
            }
          }}
        >
          {isStepCompleted(2) && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-lg font-semibold mb-2">
            {(getActiveStep() === 2 || isEditingDoor) && (
              <span className="mr-2 text-primary-500">▶</span>
            )}
            <span>Step 2. Placing Door</span>
          </div>
          <div className="text-sm text-gray-600 flex-1 flex items-center">
            {address.doorPosition ? (
              <div className="text-green-500">
                {isEditingDoor ? 'Click on the map to change the door position' : '✓ Door placed at coordinates: ' + address.doorPosition.lat.toFixed(6) + ', ' + address.doorPosition.lng.toFixed(6)}
              </div>
            ) : (
              <div>
                Click on the map to place the door. The door icon will follow your mouse cursor.
              </div>
            )}
          </div>
        </div>

        {/* Scenarios Step */}
        <div className={`p-4 bg-white rounded-lg border shadow-sm flex flex-col relative ${!scenariosEnabled ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
          {isStepCompleted(3) && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-lg font-semibold mb-2">
            {getActiveStep() === 3 && (
              <span className="mr-2 text-primary-500">▶</span>
            )}
            <span>Step 3. Draw Path</span>
          </div>
          <label className="block text-sm mb-1 text-gray-600">There are 4 scenarios, each reprents a path.</label>
          <div className="flex flex-col gap-2 flex-1">
            {SCENARIOS.map((scenario) => {
              const hasPath = address.scenarioPaths?.[scenario]
              const stepEnabled = isCategoryEnabled('Scenarios')
              const isActive = activeScenario === scenario

              return (
                <div
                  key={scenario}
                  className={`flex items-center p-2 rounded-lg border-2 transition-all ${
                    hasPath 
                      ? 'bg-green-50 border-green-500' 
                      : isActive && stepEnabled
                      ? 'bg-primary-50 border-primary-500 ring-2 ring-yellow-400 ring-offset-1' 
                      : stepEnabled
                      ? 'bg-gray-50 border-gray-200 hover:border-gray-300' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  } ${stepEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => {
                    if (stepEnabled && address.doorPosition && onScenarioSelect) {
                      onScenarioSelect(isActive ? null : scenario)
                    }
                  }}
                >
                  {isActive && stepEnabled && !hasPath && (
                    <span className="mr-2 text-primary-500">▶</span>
                  )}
                  {hasPath && <span className="mr-2 text-green-600">✓</span>}
                  <span className="text-sm font-medium capitalize text-gray-700">{scenario}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Parking Spot Step */}
        <div className={`p-4 bg-white rounded-lg border shadow-sm flex flex-col relative ${!parkingEnabled ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
          {isStepCompleted(4) && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          <div className="flex items-center text-lg font-semibold mb-2">
            {getActiveStep() === 4 && (
              <span className="mr-2 text-primary-500">▶</span>
            )}
            <span>Step 4. Parking Spot</span>
          </div>
          <div className="text-sm text-gray-600 flex-1 flex items-center">
            {address.parkingSpotSet ? (
              <div className="text-green-500">✓ Parking spot set</div>
            ) : (
              <div>Click on the map to set the parking spot.</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
        <button
          onClick={() => onNavigate('prev')}
          className="flex-1 px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-md cursor-pointer text-sm hover:bg-gray-200 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => onNavigate('next')}
          className="flex-1 px-5 py-2.5 bg-primary-500 text-white rounded-md cursor-pointer text-sm hover:bg-primary-600 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default memo(WizardView)

