'use client'

import { useState, memo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Address, ScenarioType } from '@/types'
import DoorConfirmation from './DoorConfirmation'
import ElevatorModal from './ElevatorModal'

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
  const [pathPointPositions, setPathPointPositions] = useState<{ x: number; y: number }[]>([])
  const [showElevatorModal, setShowElevatorModal] = useState(false)
  const [pendingDoorForElevator, setPendingDoorForElevator] = useState<{ lat: number; lng: number } | null>(null)
  
  // Auto-place door at center when editing an existing door (not when placing for the first time)
  useEffect(() => {
    if (isEditingDoor && selectedAddress && !pendingDoorPosition) {
      // Only auto-place if door already exists (editing mode), not when placing for the first time
      if (selectedAddress.doorPosition && !pendingDoorPosition) {
        // Door exists, start editing by showing it as pending (convert confirmed to pending)
        const screenX = window.innerWidth * 0.15
        const screenY = window.innerHeight * 0.5
        setPendingDoorPosition({
          lat: selectedAddress.doorPosition.lat,
          lng: selectedAddress.doorPosition.lng,
          x: screenX,
          y: screenY,
        })
      }
      // If door doesn't exist yet, don't auto-place - let user click on map to place it
    }
  }, [isEditingDoor, selectedAddress, addressCoordinates, pendingDoorPosition])

  // Check if we should show door icon (only when Place Door step is active or editing door)
  const shouldShowDoor =
    selectedAddress &&
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
      ((!selectedAddress.doorPosition || isEditingDoor || activeScenario) && !pendingDoorPosition)) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [selectedAddress, pendingDoorPosition, isEditingDoor, activeScenario])

  const handleMapClick = useCallback((lat: number, lng: number, mapType: 'outline' | 'satellite' | 'street') => {
    if (!selectedAddress || !selectedAddressId) return

    // Handle door placement - show confirmation UI (either first time or when editing)
    if (
      ((!selectedAddress.doorPosition || isEditingDoor) && !pendingDoorPosition && !activeScenario)
    ) {
      setPendingDoorPosition({ lat, lng, x: mousePosition?.x || window.innerWidth / 2, y: mousePosition?.y || window.innerHeight / 2 })
      setMousePosition(null)
      return
    }

    // Handle scenario path drawing (when activeScenario is set)
    if (activeScenario && selectedAddress.doorPosition && !pendingDoorPosition) {
      // Add point immediately to show line
      const newPoints = currentPathPoints.length === 0 
        ? [{ lat: selectedAddress.doorPosition.lat, lng: selectedAddress.doorPosition.lng }, { lat, lng }]
        : [...currentPathPoints, { lat, lng }]
      
      setCurrentPathPoints(newPoints)
      
      // Store screen position for this point
      const clickPosition = mousePosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const newPositions = currentPathPoints.length === 0
        ? [clickPosition, clickPosition] // Door position and first click
        : [...pathPointPositions, clickPosition]
      
      setPathPointPositions(newPositions)
      
      // Show confirmation UI immediately at the clicked position
      setPendingPathConfirmation(clickPosition)
      
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

  const handleDoorDragEnd = useCallback((lat: number, lng: number) => {
    if (pendingDoorPosition) {
      // Update pending door position after drag
      setPendingDoorPosition({ ...pendingDoorPosition, lat, lng })
    } else if (selectedAddressId && selectedAddress?.doorPosition) {
      // Update confirmed door position after drag
      onUpdateAddress(selectedAddressId, { 
        doorPosition: { lat, lng }
      })
    }
  }, [pendingDoorPosition, selectedAddressId, selectedAddress, onUpdateAddress])

  const handleScreenPositionUpdate = useCallback((lat: number, lng: number, screenPos: { x: number; y: number }) => {
    if (pendingDoorPosition) {
      // Update screen position for confirmation UI (works for both initial position and after drag)
      setPendingDoorPosition(prev => {
        if (!prev) return null
        // If lat/lng matches or this is an update after drag, update the position
        const shouldUpdate = (prev.lat === lat && prev.lng === lng) || 
                            (Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001)
        if (shouldUpdate) {
          return { ...prev, x: screenPos.x, y: screenPos.y, lat, lng }
        }
        return prev
      })
    }
  }, [pendingDoorPosition])

  const handleConfirmDoor = useCallback(() => {
    if (!selectedAddressId || !pendingDoorPosition) return
    // Store door position and show elevator modal
    setPendingDoorForElevator({ lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng })
    setPendingDoorPosition(null)
    setIsMouseOverMap(false)
    setMousePosition(null)
    setShowElevatorModal(true)
  }, [selectedAddressId, pendingDoorPosition])

  const handleElevatorYes = useCallback(() => {
    if (!selectedAddressId || !pendingDoorForElevator) return
    onUpdateAddress(selectedAddressId, { 
      doorPosition: pendingDoorForElevator,
      hasElevator: true 
    })
    setPendingDoorForElevator(null)
    setShowElevatorModal(false)
    // Turn off editing mode after confirming
    if (onEditDoorChange) {
      onEditDoorChange(false)
    }
  }, [selectedAddressId, pendingDoorForElevator, onUpdateAddress, onEditDoorChange])

  const handleElevatorNo = useCallback(() => {
    if (!selectedAddressId || !pendingDoorForElevator) return
    onUpdateAddress(selectedAddressId, { 
      doorPosition: pendingDoorForElevator,
      hasElevator: false 
    })
    setPendingDoorForElevator(null)
    setShowElevatorModal(false)
    // Turn off editing mode after confirming
    if (onEditDoorChange) {
      onEditDoorChange(false)
    }
  }, [selectedAddressId, pendingDoorForElevator, onUpdateAddress, onEditDoorChange])

  const handleCancelDoor = useCallback(() => {
    setPendingDoorPosition(null)
    setMousePosition(null)
  }, [])

  const handleConfirmFinishPath = useCallback(() => {
    if (!selectedAddressId || !activeScenario || currentPathPoints.length === 0) return
    
    // Save the current path to the scenario
    const updatedScenarioPaths = {
      ...selectedAddress?.scenarioPaths,
      [activeScenario]: { points: currentPathPoints }
    }
    
    onUpdateAddress(selectedAddressId, {
      scenarioPaths: updatedScenarioPaths
    })
    
    // Clear current path and hide confirmation UI
    setCurrentPathPoints([])
    setPendingPathConfirmation(null)
    setPathPointPositions([])
    
    // Exit draw mode after completing one path
    if (onScenarioSelect) {
      onScenarioSelect(null)
    }
  }, [selectedAddressId, activeScenario, currentPathPoints, selectedAddress, onUpdateAddress, onScenarioSelect])

  const handleCancelFinishPath = useCallback(() => {
    // Remove the last point from current path
    if (currentPathPoints.length > 0) {
      if (currentPathPoints.length === 2) {
        // Only door position and first click, clear everything and hide UI
        setCurrentPathPoints([])
        setPendingPathConfirmation(null)
        setPathPointPositions([])
      } else if (currentPathPoints.length > 2) {
        // Remove just the last clicked point (keep door position and previous points)
        const updatedPoints = currentPathPoints.slice(0, -1)
        const updatedPositions = pathPointPositions.slice(0, -1)
        setCurrentPathPoints(updatedPoints)
        setPathPointPositions(updatedPositions)
        // Move confirmation UI to the previous point's position
        if (updatedPositions.length > 0) {
          setPendingPathConfirmation(updatedPositions[updatedPositions.length - 1])
        }
      }
    }
  }, [currentPathPoints, pathPointPositions])

  return (
    <div className="w-[70%] h-full flex bg-white rounded-lg shadow-lg overflow-hidden min-w-0">
      {/* Single Mapbox Map */}
      <div
        className="w-full h-full relative rounded-md overflow-hidden border border-gray-200"
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
          isEditingDoor={isEditingDoor}
          onDoorDragEnd={handleDoorDragEnd}
          onScreenPositionUpdate={handleScreenPositionUpdate}
        />
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
      {activeScenario && isMouseOverMap && selectedAddress?.doorPosition && mousePosition && (
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

      {/* Path Finish Confirmation UI */}
      {pendingPathConfirmation && (
        <DoorConfirmation
          position={{ x: pendingPathConfirmation.x, y: pendingPathConfirmation.y }}
          onConfirm={handleConfirmFinishPath}
          onCancel={handleCancelFinishPath}
        />
      )}

      {/* Elevator Modal */}
      {showElevatorModal && (
        <ElevatorModal
          onYes={handleElevatorYes}
          onNo={handleElevatorNo}
        />
      )}
    </div>
  )
}

export default memo(RightSection)

