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
  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)
  const step4Ref = useRef<HTMLDivElement>(null)
  const prevDoorPosition = useRef<{ lat: number; lng: number } | undefined>(address.doorPosition)
  
  // Track completion states to detect when steps become completed
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set())
  const prevValidationState = useRef<boolean>(!!(address.validatedAddress || address.selectedAddress))
  const prevDoorState = useRef<boolean>(!!address.doorPosition)
  const prevScenariosState = useRef<boolean>(address.scenarioPaths ? SCENARIOS.every(s => address.scenarioPaths?.[s]) : false)
  const prevParkingState = useRef<boolean>(!!address.parkingSpotSet)
  
  // Helper function to get next step to scroll to
  const getNextStep = useCallback((justCompleted: Set<number>): number | null => {
    // Find the highest completed step number
    const maxCompleted = Math.max(...Array.from(justCompleted))
    
    // Skip step 2 (it's display-only), go directly to step 3 after step 1
    if (maxCompleted === 1) {
      return 3 // Skip step 2, go to step 3
    }
    
    // Return next step if exists
    if (maxCompleted < 4) {
      return maxCompleted + 1
    }
    return null
  }, [])
  
  // Function to scroll to a specific step
  const scrollToStep = useCallback((stepNumber: number) => {
    const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref]
    const ref = stepRefs[stepNumber - 1]
    
    if (ref?.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
    }
  }, [])
  
  // Track step completions and trigger animations
  useEffect(() => {
    const newJustCompleted = new Set<number>()
    
    // Step 1: Validation
    const isStep1Completed = !!(address.validatedAddress || address.selectedAddress)
    if (isStep1Completed && !prevValidationState.current) {
      newJustCompleted.add(1)
    }
    prevValidationState.current = isStep1Completed
    
    // Step 2: Door
    const isStep2Completed = !!address.doorPosition
    if (isStep2Completed && !prevDoorState.current) {
      newJustCompleted.add(2)
    }
    prevDoorState.current = isStep2Completed
    
    // Step 3: Scenarios
    const isStep3Completed = address.scenarioPaths ? SCENARIOS.every(s => address.scenarioPaths?.[s]) : false
    if (isStep3Completed && !prevScenariosState.current) {
      newJustCompleted.add(3)
    }
    prevScenariosState.current = isStep3Completed
    
    // Step 4: Parking
    const isStep4Completed = !!address.parkingSpotSet
    if (isStep4Completed && !prevParkingState.current) {
      newJustCompleted.add(4)
    }
    prevParkingState.current = isStep4Completed
    
    // Update completion states
    const allCompleted = new Set<number>()
    if (isStep1Completed) allCompleted.add(1)
    if (isStep2Completed) allCompleted.add(2)
    if (isStep3Completed) allCompleted.add(3)
    if (isStep4Completed) allCompleted.add(4)
    setCompletedSteps(allCompleted)
    
    // Trigger animation for newly completed steps
    if (newJustCompleted.size > 0) {
      setJustCompleted(newJustCompleted)
      // Clear animation state after animation completes
      setTimeout(() => {
        setJustCompleted(new Set())
      }, 2000) // Animation duration
      
      // Auto-scroll logic
      setTimeout(() => {
        const maxCompleted = Math.max(...Array.from(newJustCompleted))
        
        // If step 1 just completed, first scroll to step 2 to show active icon
        // then continue to step 3
        if (maxCompleted === 1) {
          // Scroll to step 2 first to show the play icon
          scrollToStep(2)
          // Then after a brief pause, scroll to step 3
          setTimeout(() => {
            scrollToStep(3)
          }, 1000)
        } else {
          // For other steps, use normal next step logic
          const nextStep = getNextStep(newJustCompleted)
          if (nextStep) {
            scrollToStep(nextStep)
          }
        }
      }, 800) // Delay before scrolling to next step
    }
  }, [address, getNextStep, scrollToStep])
  
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
    
    // Check if all scenarios have paths (this is the actual completion condition)
    const hasAllScenarioPaths = address.scenarioPaths ? SCENARIOS.every(s => address.scenarioPaths?.[s]) : false
    if (hasAllScenarioPaths) {
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
    // Step 2 is active if step 1 is completed but door is not placed yet
    if (isStep1Completed && !address.doorPosition) {
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
      {/* Back Button with Original Address */}
      <div className="flex-shrink-0 px-2.5 py-1.5 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-b border-slate-200/40 shadow-[0_1px_0_0_rgba(255,255,255,0.8)]">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors text-slate-700"
          >
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </span>
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-yellow-50/70 backdrop-blur-sm rounded-lg border-2 border-amber-200/60 shadow-[0_2px_6px_rgba(245,158,11,0.15)] ring-1 ring-amber-100/50">
            <span className="text-xs text-amber-900 font-semibold truncate" title={address.givenAddress}>
              {address.givenAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Validated Address Section - Fixed Height */}
      <div className="flex-shrink-0 min-h-[60px] px-2.5 py-2 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 backdrop-blur-md border-b border-slate-200/40 shadow-[0_1px_0_0_rgba(255,255,255,0.8)] flex items-center">
        {address.validatedAddress ? (
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.4)] ring-2 ring-emerald-100/50">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Validated Address</span>
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-50/90 via-green-50/80 to-teal-50/70 backdrop-blur-sm rounded-xl border-2 border-emerald-300/60 shadow-[0_2px_8px_rgba(16,185,129,0.25)] ring-1 ring-emerald-100/50">
                <span className="text-sm font-bold text-emerald-900 truncate block" title={address.validatedAddress}>
                  {address.validatedAddress}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <span className="text-xs text-slate-400 font-medium italic">No validated address yet</span>
          </div>
        )}
      </div>

      {/* Category Progress Bar */}
      <div className="flex-shrink-0">
        <ProgressBar completedCount={categoryProgress.completed} totalCount={categoryProgress.total} label="Steps"/>
      </div>

      {/* Wizard Steps - Scrollable Section */}
      <div className="flex-1 overflow-y-scroll overflow-x-hidden p-2 flex flex-col gap-2 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c1c1c1 #f1f1f1' }}>
        {/* Validation Step */}
        <div ref={step1Ref} className={`p-3 bg-white/90 backdrop-blur-md rounded-2xl border transition-all duration-500 flex flex-col relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          !validationEnabled ? 'opacity-60' : 'hover:scale-[1.01]'
        } ${
          justCompleted.has(1) 
            ? 'border-emerald-400/80 shadow-[0_0_0_4px_rgba(16,185,129,0.2),0_4px_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-50/50 to-white/90 scale-[1.02]' 
            : isStepCompleted(1)
            ? 'border-emerald-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            : 'border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        } hover:border-slate-300/60`}>
          {isStepCompleted(1) && (
            <div className={`absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(16,185,129,0.4)] ring-2 ring-emerald-100/50 transition-all duration-500 ${
              justCompleted.has(1)
                ? 'animate-[bounce_0.6s_ease-out,scale_0.8s_ease-out] scale-125 ring-4 ring-emerald-200/60'
                : 'scale-100'
            }`}>
              <svg className={`w-4 h-4 text-white transition-all duration-300 ${
                justCompleted.has(1) ? 'animate-[checkmark_0.5s_ease-out_0.2s_both]' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="flex items-center text-sm font-bold mb-2 text-slate-800">
            {getActiveStep() === 1 && (
              <span className="mr-1.5 text-blue-600 text-sm animate-pulse">▶</span>
            )}
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">Step 1. Validation</span>
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="block text-xs mb-1 text-slate-600 font-medium leading-relaxed">We found similar addresses. Please select the correct one to continue.</label>
            <select
              value={address.selectedAddress || ''}
              onChange={(e) => handleAddressSelect(e.target.value)}
              onFocus={() => setIsSelectFocused(true)}
              onBlur={() => setIsSelectFocused(false)}
              className="w-full px-3 py-2 bg-white/95 backdrop-blur-sm border border-slate-300/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.15)] hover:border-slate-400/60 font-medium text-slate-700"
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
          ref={step2Ref}
          className={`p-3 bg-white/90 backdrop-blur-md rounded-2xl border transition-all duration-500 flex flex-col relative ${
            !doorEnabled ? 'opacity-60' : ''
          } ${
            justCompleted.has(2) 
              ? 'border-emerald-400/80 shadow-[0_0_0_4px_rgba(16,185,129,0.2),0_4px_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-50/50 to-white/90 scale-[1.02]' 
              : isStepCompleted(2)
              ? 'border-emerald-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
              : 'border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
          }`}
        >
          {isStepCompleted(2) && (
            <div className={`absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(16,185,129,0.4)] ring-2 ring-emerald-100/50 transition-all duration-500 ${
              justCompleted.has(2)
                ? 'animate-[bounce_0.6s_ease-out,scale_0.8s_ease-out] scale-125 ring-4 ring-emerald-200/60'
                : 'scale-100'
            }`}>
              <svg className={`w-4 h-4 text-white transition-all duration-300 ${
                justCompleted.has(2) ? 'animate-[checkmark_0.5s_ease-out_0.2s_both]' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="flex items-center text-sm font-bold mb-2 text-slate-800">
            {(getActiveStep() === 2 || isEditingDoor) && (
              <span className="mr-1.5 text-blue-600 text-sm animate-pulse">▶</span>
            )}
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">Step 2. Placing Door</span>
          </div>
          <div className="text-xs text-slate-600 flex-1 flex items-center leading-relaxed font-medium">
            {address.doorPosition ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {isEditingDoor ? 'Click on the map to change the door position' : 'Door placed at ' + address.doorPosition.lat.toFixed(4) + ', ' + address.doorPosition.lng.toFixed(4)}
              </div>
            ) : (
              <div className="text-slate-500">
                Click on the map to place the door. The door icon will follow your mouse cursor.
              </div>
            )}
          </div>
        </div>

        {/* Scenarios Step */}
        <div ref={step3Ref} className={`p-3 bg-white/90 backdrop-blur-md rounded-2xl border transition-all duration-500 flex flex-col relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          !scenariosEnabled ? 'opacity-60' : 'hover:scale-[1.01]'
        } ${
          justCompleted.has(3) 
            ? 'border-emerald-400/80 shadow-[0_0_0_4px_rgba(16,185,129,0.2),0_4px_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-50/50 to-white/90 scale-[1.02]' 
            : isStepCompleted(3)
            ? 'border-emerald-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            : 'border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        } hover:border-slate-300/60`}>
          {isStepCompleted(3) && (
            <div className={`absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(16,185,129,0.4)] ring-2 ring-emerald-100/50 transition-all duration-500 ${
              justCompleted.has(3)
                ? 'animate-[bounce_0.6s_ease-out,scale_0.8s_ease-out] scale-125 ring-4 ring-emerald-200/60'
                : 'scale-100'
            }`}>
              <svg className={`w-4 h-4 text-white transition-all duration-300 ${
                justCompleted.has(3) ? 'animate-[checkmark_0.5s_ease-out_0.2s_both]' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="flex items-center text-sm font-bold mb-2 text-slate-800">
            {getActiveStep() === 3 && !activeScenario && !isEditingDoor && (
              <span className="mr-1.5 text-blue-600 text-sm animate-pulse">▶</span>
            )}
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">Step 3. Draw Path</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-slate-600 font-medium leading-relaxed">There are 4 scenarios, each represents a path.</label>
            {(() => {
              const completedScenarios = SCENARIOS.filter(s => !!address.scenarioPaths?.[s]).length
              const totalScenarios = SCENARIOS.length
              return (
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-600 font-bold">
                    {completedScenarios}/{totalScenarios}
                  </div>
                  <div className="w-24 h-1.5 bg-slate-200/70 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 transition-all duration-500 ease-out shadow-[0_2px_4px_rgba(16,185,129,0.3)] relative overflow-hidden"
                      style={{ width: `${(completedScenarios / totalScenarios) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {SCENARIOS.map((scenario) => {
              const hasPath = !!address.scenarioPaths?.[scenario]
              const stepEnabled = isCategoryEnabled('Scenarios')
              const isActive = activeScenario === scenario

              return (
                <div
                  key={scenario}
                  className={`flex items-center p-2.5 rounded-xl border transition-all duration-300 ${
                    hasPath 
                      ? 'bg-gradient-to-r from-emerald-50/90 via-green-50/80 to-teal-50/70 border-emerald-300/60 backdrop-blur-sm shadow-[0_2px_6px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50 hover:shadow-[0_4px_10px_rgba(16,185,129,0.2)]' 
                      : isActive && stepEnabled
                      ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/70 border-blue-400/70 ring-2 ring-blue-200/50 backdrop-blur-sm shadow-[0_2px_8px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)] scale-[1.02]' 
                      : stepEnabled
                      ? 'bg-slate-50/70 border-slate-200/60 hover:border-slate-300/70 hover:bg-slate-100/80 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]' 
                      : 'bg-slate-50/40 border-slate-200/30 opacity-60'
                  } ${stepEnabled ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-not-allowed'}`}
                  onClick={() => {
                    if (stepEnabled && address.doorPosition && onScenarioSelect) {
                      onScenarioSelect(isActive ? null : scenario)
                    }
                  }}
                >
                  {isActive && stepEnabled && !hasPath && !isEditingDoor && (
                    <span className="mr-2 text-blue-600 text-xs animate-pulse">▶</span>
                  )}
                  {hasPath && (
                    <svg className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="text-xs font-semibold capitalize text-slate-700">{scenario}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Parking Spot Step */}
        <div ref={step4Ref} className={`p-3 bg-white/90 backdrop-blur-md rounded-2xl border transition-all duration-500 flex flex-col relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          !parkingEnabled ? 'opacity-60' : 'hover:scale-[1.01]'
        } ${
          justCompleted.has(4) 
            ? 'border-emerald-400/80 shadow-[0_0_0_4px_rgba(16,185,129,0.2),0_4px_20px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-50/50 to-white/90 scale-[1.02]' 
            : isStepCompleted(4)
            ? 'border-emerald-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            : 'border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        } hover:border-slate-300/60`}>
          {isStepCompleted(4) && (
            <div className={`absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(16,185,129,0.4)] ring-2 ring-emerald-100/50 transition-all duration-500 ${
              justCompleted.has(4)
                ? 'animate-[bounce_0.6s_ease-out,scale_0.8s_ease-out] scale-125 ring-4 ring-emerald-200/60'
                : 'scale-100'
            }`}>
              <svg className={`w-4 h-4 text-white transition-all duration-300 ${
                justCompleted.has(4) ? 'animate-[checkmark_0.5s_ease-out_0.2s_both]' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="flex items-center text-sm font-bold mb-2 text-slate-800">
            {getActiveStep() === 4 && (
              <span className="mr-1.5 text-blue-600 text-sm animate-pulse">▶</span>
            )}
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">Step 4. Parking Spot</span>
          </div>
          <div className="text-xs text-slate-600 flex-1 flex items-center font-medium">
            {address.parkingSpotSet ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Parking spot set
              </div>
            ) : (
              <div className="text-slate-500">Click on the map to set the parking spot.</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-shrink-0 px-3 py-2.5 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-t border-slate-200/40 shadow-[0_-1px_0_0_rgba(255,255,255,0.8)]">
        <div className="flex items-center justify-between gap-2.5">
          {/* Previous Button */}
          <button
            onClick={() => onNavigate('prev')}
            className="group flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur-sm border border-slate-300/60 rounded-xl cursor-pointer text-xs font-bold hover:border-blue-400/60 hover:bg-blue-50/80 hover:shadow-[0_2px_8px_rgba(59,130,246,0.2)] transition-all duration-300 flex-shrink-0 hover:scale-[1.02] text-slate-700 hover:text-blue-700"
          >
            <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-slate-700 group-hover:text-blue-700 transition-colors">Prev</span>
          </button>

          {/* Address Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-slate-100/50">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-1 ${
                completedCount === totalAddresses && totalAddresses > 0
                  ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 ring-emerald-200/50'
                  : completedCount > 0
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 ring-blue-200/50'
                  : 'bg-gradient-to-br from-slate-400 to-slate-500 ring-slate-200/50'
              }`}>
                {completedCount === totalAddresses && totalAddresses > 0 ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide"></div>
                <div className={`text-xs font-bold ${
                  completedCount === totalAddresses && totalAddresses > 0
                    ? 'text-emerald-700'
                    : completedCount > 0
                    ? 'text-blue-700'
                    : 'text-slate-700'
                }`}>
                  {completedCount}/{totalAddresses}
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => onNavigate('next')}
            className="group flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer text-xs font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <span className="text-white">Next</span>
            <svg className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(WizardView)

