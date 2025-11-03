'use client'

import { useState, memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Address, ScenarioType } from '@/types'
import DoorConfirmation from './DoorConfirmation'

// Dynamically import MapContainer to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('./MapContainer'), { ssr: false })

interface RightSectionProps {
  selectedAddress: Address | null
  selectedAddressId: string | null
  onUpdateAddress: (id: string, updates: Partial<Address>) => void
  addressCoordinates?: { lat: number; lng: number } | null
  activeScenario?: ScenarioType | null
  onScenarioSelect?: (scenario: ScenarioType | null) => void
  isEditingDoor?: boolean
  onEditDoorChange?: (isEditing: boolean) => void
}

function RightSection({
  selectedAddress,
  selectedAddressId,
  onUpdateAddress,
  addressCoordinates,
  activeScenario,
  onScenarioSelect,
  isEditingDoor,
  onEditDoorChange,
}: RightSectionProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [isMouseOverMap, setIsMouseOverMap] = useState(false)
  const [pendingDoorPosition, setPendingDoorPosition] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null)
  const [currentPathPoints, setCurrentPathPoints] = useState<{ lat: number; lng: number }[]>([])
  const [pendingPathConfirmation, setPendingPathConfirmation] = useState<{ x: number; y: number } | null>(null)
  const [lastPathClickPosition, setLastPathClickPosition] = useState<{ x: number; y: number } | null>(null)

  // Check if we should show door icon (only when Placing Door step is active or editing door)
  const shouldShowDoor =
    selectedAddress &&
    (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
    ((!selectedAddress.doorPosition || isEditingDoor) && !pendingDoorPosition && !pendingPathConfirmation) &&
    isMouseOverMap

  const handleMouseEnter = useCallback(() => {
    setIsMouseOverMap(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsMouseOverMap(false)
    setMousePosition(null)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update mouse position for door placement or path drawing
    if (selectedAddress &&
      (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
      ((!selectedAddress.doorPosition || isEditingDoor || activeScenario) && !pendingDoorPosition && !pendingPathConfirmation)) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [selectedAddress, pendingDoorPosition, pendingPathConfirmation, isEditingDoor, activeScenario])

  const handleMapClick = useCallback((lat: number, lng: number, mapType: 'outline' | 'satellite' | 'street') => {
    if (!selectedAddress || !selectedAddressId) return

    // Handle door placement - show confirmation UI (either first time or when editing)
    if (
      (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
      ((!selectedAddress.doorPosition || isEditingDoor) && !pendingDoorPosition && !activeScenario)
    ) {
      setPendingDoorPosition({ lat, lng, x: mousePosition?.x || window.innerWidth / 2, y: mousePosition?.y || window.innerHeight / 2 })
      setMousePosition(null)
      return
    }

    // Handle scenario path drawing (when activeScenario is set)
    if (activeScenario && selectedAddress.doorPosition && !pendingPathConfirmation) {
      // Add point immediately to show line
      const newPoints = currentPathPoints.length === 0 
        ? [{ lat: selectedAddress.doorPosition.lat, lng: selectedAddress.doorPosition.lng }, { lat, lng }]
        : [...currentPathPoints, { lat, lng }]
      
      setCurrentPathPoints(newPoints)
      
      // Store the last click position for showing confirmation UI
      if (mousePosition) {
        setLastPathClickPosition(mousePosition)
      }
      
      setMousePosition(null)
      return
    }

    // Handle parking spot placement (only if scenarios are selected)
    if (
      selectedAddress.doorPosition &&
      !isEditingDoor &&
      !activeScenario &&
      !pendingPathConfirmation &&
      selectedAddress.selectedScenarios &&
      selectedAddress.selectedScenarios.length > 0 &&
      !selectedAddress.parkingSpotSet
    ) {
      onUpdateAddress(selectedAddressId, { parkingSpotSet: true })
    }
  }, [selectedAddress, selectedAddressId, onUpdateAddress, pendingDoorPosition, pendingPathConfirmation, currentPathPoints, mousePosition, isEditingDoor, activeScenario])

  const handleConfirmDoor = useCallback(() => {
    if (!selectedAddressId || !pendingDoorPosition) return
    onUpdateAddress(selectedAddressId, { doorPosition: { lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng } })
    setPendingDoorPosition(null)
    setIsMouseOverMap(false)
    setMousePosition(null)
    // Turn off editing mode after confirming
    if (onEditDoorChange) {
      onEditDoorChange(false)
    }
  }, [selectedAddressId, pendingDoorPosition, onUpdateAddress, onEditDoorChange])

  const handleCancelDoor = useCallback(() => {
    setPendingDoorPosition(null)
    setMousePosition(null)
  }, [])

  const handleShowFinishConfirmation = useCallback(() => {
    // Show confirmation UI at the last clicked position (or center if no position stored)
    setPendingPathConfirmation(lastPathClickPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }, [lastPathClickPosition])

  const handleConfirmFinishPath = useCallback(() => {
    if (!selectedAddressId || !activeScenario || currentPathPoints.length === 0) return
    
    // Save the current path to the scenario
    onUpdateAddress(selectedAddressId, {
      scenarioPaths: {
        ...selectedAddress?.scenarioPaths,
        [activeScenario]: { points: currentPathPoints }
      }
    })
    
    // Clear current path and hide confirmation UI
    setCurrentPathPoints([])
    setPendingPathConfirmation(null)
    setLastPathClickPosition(null)
  }, [selectedAddressId, activeScenario, currentPathPoints, selectedAddress, onUpdateAddress])

  const handleCancelFinishPath = useCallback(() => {
    // Remove the last point from current path
    if (currentPathPoints.length > 0) {
      if (currentPathPoints.length === 2) {
        // Only door position and first click, clear everything and hide UI
        setCurrentPathPoints([])
        setPendingPathConfirmation(null)
        setLastPathClickPosition(null)
      } else if (currentPathPoints.length > 2) {
        // Remove just the last clicked point (keep door position and previous points)
        setCurrentPathPoints(currentPathPoints.slice(0, -1))
        setPendingPathConfirmation(null)
      }
    }
  }, [currentPathPoints])

  return (
    <div className="w-[70%] h-full flex bg-white rounded-lg shadow-lg overflow-hidden gap-2 p-2 min-w-0">
      {/* Left Map - Outline */}
      <div
        className="w-1/3 h-full relative rounded-md overflow-hidden border border-gray-200"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
                <MapContainer
                  mapType="outline"
                  selectedAddress={selectedAddress}
                  onMapClick={handleMapClick}
                  pendingDoorPosition={pendingDoorPosition ? { lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng } : undefined}
                  addressCoordinates={addressCoordinates}
                  currentPathPoints={currentPathPoints}
                  activeScenario={activeScenario}
                />
      </div>

      {/* Right Section - Satellite and Street */}
      <div className="w-2/3 h-full flex flex-col gap-2">
        {/* Top Map - Satellite */}
        <div
          className="h-1/2 relative rounded-md overflow-hidden border border-gray-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <MapContainer
            mapType="satellite"
            selectedAddress={selectedAddress}
            onMapClick={handleMapClick}
            pendingDoorPosition={pendingDoorPosition ? { lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng } : undefined}
            addressCoordinates={addressCoordinates}
            currentPathPoints={currentPathPoints}
            activeScenario={activeScenario}
          />
        </div>

        {/* Bottom Map - Street */}
        <div
          className="h-1/2 relative rounded-md overflow-hidden border border-gray-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <MapContainer
            mapType="street"
            selectedAddress={selectedAddress}
            onMapClick={handleMapClick}
            pendingDoorPosition={pendingDoorPosition ? { lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng } : undefined}
            addressCoordinates={addressCoordinates}
            currentPathPoints={currentPathPoints}
            activeScenario={activeScenario}
          />
        </div>
      </div>

      {/* Door Icon Cursor - only shows when mouse is over maps */}
      {shouldShowDoor && mousePosition && (
        <div
          className="fixed w-6 h-6 pointer-events-none z-[9999] text-2xl"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
          }}
        >
          🚪
        </div>
      )}

      {/* Path Drawing Cursor - shows when a scenario is selected */}
      {activeScenario && isMouseOverMap && selectedAddress?.doorPosition && mousePosition && !pendingPathConfirmation && (
        <div
          className="fixed w-6 h-6 pointer-events-none z-[9999] text-2xl"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
          }}
        >
          ✏️
        </div>
      )}

      {/* Door Confirmation UI */}
      {pendingDoorPosition && (
        <DoorConfirmation
          position={{ x: pendingDoorPosition.x, y: pendingDoorPosition.y }}
          onConfirm={handleConfirmDoor}
          onCancel={handleCancelDoor}
        />
      )}

      {/* Finish Path Button */}
      {currentPathPoints.length > 0 && activeScenario && !pendingPathConfirmation && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[10001]">
          <button
            onClick={handleShowFinishConfirmation}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg shadow-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            ✓ Finish Path
          </button>
        </div>
      )}

      {/* Path Finish Confirmation UI */}
      {pendingPathConfirmation && (
        <DoorConfirmation
          position={{ x: pendingPathConfirmation.x, y: pendingPathConfirmation.y }}
          onConfirm={handleConfirmFinishPath}
          onCancel={handleCancelFinishPath}
        />
      )}
    </div>
  )
}

export default memo(RightSection)

