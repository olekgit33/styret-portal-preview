'use client'

import { useState, memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Address } from '@/types'
import DoorConfirmation from './DoorConfirmation'

// Dynamically import MapContainer to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('./MapContainer'), { ssr: false })

interface RightSectionProps {
  selectedAddress: Address | null
  selectedAddressId: string | null
  onUpdateAddress: (id: string, updates: Partial<Address>) => void
  addressCoordinates?: { lat: number; lng: number } | null
}

function RightSection({
  selectedAddress,
  selectedAddressId,
  onUpdateAddress,
  addressCoordinates,
}: RightSectionProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [isMouseOverMap, setIsMouseOverMap] = useState(false)
  const [pendingDoorPosition, setPendingDoorPosition] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null)

  // Check if we should show door icon (only when Placing Door step is active)
  const shouldShowDoor =
    selectedAddress &&
    (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
    !selectedAddress.doorPosition &&
    !pendingDoorPosition &&
    isMouseOverMap

  const handleMouseEnter = useCallback(() => {
    setIsMouseOverMap(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsMouseOverMap(false)
    setMousePosition(null)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Only update mouse position if door placement is active and no pending position
    if (selectedAddress &&
      (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
      !selectedAddress.doorPosition &&
      !pendingDoorPosition) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [selectedAddress, pendingDoorPosition])

  const handleMapClick = useCallback((lat: number, lng: number, mapType: 'outline' | 'satellite' | 'street') => {
    if (!selectedAddress || !selectedAddressId) return

    // Handle door placement - show confirmation UI
    if (
      (selectedAddress.validatedAddress || selectedAddress.selectedAddress) &&
      !selectedAddress.doorPosition &&
      !pendingDoorPosition
    ) {
      setPendingDoorPosition({ lat, lng, x: mousePosition?.x || window.innerWidth / 2, y: mousePosition?.y || window.innerHeight / 2 })
      setMousePosition(null)
      return
    }

    // Handle parking spot placement (only if scenarios are selected)
    if (
      selectedAddress.doorPosition &&
      selectedAddress.selectedScenarios &&
      selectedAddress.selectedScenarios.length > 0 &&
      !selectedAddress.parkingSpotSet
    ) {
      onUpdateAddress(selectedAddressId, { parkingSpotSet: true })
    }
  }, [selectedAddress, selectedAddressId, onUpdateAddress, pendingDoorPosition, mousePosition])

  const handleConfirmDoor = useCallback(() => {
    if (!selectedAddressId || !pendingDoorPosition) return
    onUpdateAddress(selectedAddressId, { doorPosition: { lat: pendingDoorPosition.lat, lng: pendingDoorPosition.lng } })
    setPendingDoorPosition(null)
    setIsMouseOverMap(false)
    setMousePosition(null)
  }, [selectedAddressId, pendingDoorPosition, onUpdateAddress])

  const handleCancelDoor = useCallback(() => {
    setPendingDoorPosition(null)
    setMousePosition(null)
  }, [])

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

      {/* Door Confirmation UI */}
      {pendingDoorPosition && (
        <DoorConfirmation
          position={{ x: pendingDoorPosition.x, y: pendingDoorPosition.y }}
          onConfirm={handleConfirmDoor}
          onCancel={handleCancelDoor}
        />
      )}
    </div>
  )
}

export default memo(RightSection)

