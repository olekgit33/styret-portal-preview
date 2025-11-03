'use client'

import { memo, useState, useEffect } from 'react'
import AddressListView from './AddressListView'
import WizardView from './WizardView'
import ProgressBar from './ProgressBar'
import { Address, ScenarioType } from '@/types'

interface LeftSectionProps {
  addresses: Address[]
  selectedAddress: Address | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectAddress: (id: string) => void
  onBackToList: () => void
  onUpdateAddress: (id: string, updates: Partial<Address>) => void
  onNavigateAddress: (direction: 'prev' | 'next') => void
  totalAddresses: number
  completedCount: number
  activeScenario?: ScenarioType | null
  onScenarioSelect?: (scenario: ScenarioType | null) => void
  isEditingDoor?: boolean
  onEditDoorChange?: (isEditing: boolean) => void
}

function LeftSection({
  addresses,
  selectedAddress,
  searchQuery,
  onSearchChange,
  onSelectAddress,
  onBackToList,
  onUpdateAddress,
  onNavigateAddress,
  totalAddresses,
  completedCount,
  activeScenario,
  onScenarioSelect,
  isEditingDoor,
  onEditDoorChange,
}: LeftSectionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    if (selectedAddress && !showWizard) {
      setIsTransitioning(true)
      // Trigger slide-in animation
      setTimeout(() => {
        setShowWizard(true)
        setIsTransitioning(false)
      }, 50)
    } else if (!selectedAddress && showWizard) {
      setIsTransitioning(true)
      // Trigger slide-out animation
      setTimeout(() => {
        setShowWizard(false)
        setIsTransitioning(false)
      }, 50)
    }
  }, [selectedAddress, showWizard])

  return (
    <div className="w-[30%] h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden min-w-0">
      <div className="w-full h-full flex flex-col">
        {!selectedAddress && (
          <ProgressBar completedCount={completedCount} totalCount={totalAddresses} />
        )}

        <div className="flex-1 relative overflow-hidden">
          {/* Address List View */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              showWizard ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
            } ${isTransitioning ? 'pointer-events-none' : ''}`}
          >
            <AddressListView
              addresses={addresses}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onSelectAddress={onSelectAddress}
            />
          </div>

          {/* Wizard View */}
          {selectedAddress && (
            <div
              className={`absolute inset-0 flex flex-col min-h-0 transition-transform duration-300 ease-in-out ${
                showWizard ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
              } ${isTransitioning ? 'pointer-events-none' : ''}`}
            >
              <WizardView
                address={selectedAddress}
                onBack={onBackToList}
                onUpdate={(updates) => onUpdateAddress(selectedAddress.id, updates)}
                onNavigate={onNavigateAddress}
                totalAddresses={totalAddresses}
                completedCount={completedCount}
                activeScenario={activeScenario}
                onScenarioSelect={onScenarioSelect}
                isEditingDoor={isEditingDoor}
                onEditDoorChange={onEditDoorChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(LeftSection)

