'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import LeftSection from '@/components/LeftSection'
import RightSection from '@/components/RightSection'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Address, ScenarioType } from '@/types'
import { calculateWizardStatus } from '@/utils/addressUtils'
import { geocodeAddress, getFallbackCoordinates } from '@/utils/geocoding'

// Sample addresses - in production, this would come from a database
const initialAddresses: Address[] = [
  {
    id: '1',
    givenAddress: '123 Main St, New York, NY 10001',
    validatedAddress: '123 Main Street, New York, NY 10001',
    wizardStatus: 'completed',
    stepsCompleted: 4,
    selectedScenarios: ['Door to taxi', 'car/truck to Door', 'bicycle to Door', 'ambulance to Door'],
    doorPosition: { lat: 40.7128, lng: -74.0060 },
    parkingSpotSet: true,
    scenarioPaths: {
      'Door to taxi': { points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.7130, lng: -74.0058 }] },
      'car/truck to Door': { points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.7126, lng: -74.0062 }] },
      'bicycle to Door': { points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.7129, lng: -74.0059 }] },
      'ambulance to Door': { points: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.7127, lng: -74.0061 }] },
    },
  },
  {
    id: '2',
    givenAddress: '456 Oak Ave, Los Angeles, CA 90001',
    wizardStatus: 'not-started',
    selectedScenarios: [],
  },
  {
    id: '3',
    givenAddress: '789 Pine Rd, Chicago, IL 60601',
    validatedAddress: '789 Pine Road, Chicago, IL 60601',
    wizardStatus: 'in-progress',
    stepsCompleted: 2,
    selectedScenarios: ['Door to taxi', 'car/truck to Door'],
    doorPosition: { lat: 41.8781, lng: -87.6298 },
  },
  {
    id: '4',
    givenAddress: '321 Elm St, Houston, TX 77001',
    validatedAddress: '321 Elm Street, Houston, TX 77001',
    wizardStatus: 'completed',
    stepsCompleted: 4,
    selectedScenarios: ['Door to taxi', 'car/truck to Door', 'bicycle to Door', 'ambulance to Door'],
    doorPosition: { lat: 29.7604, lng: -95.3698 },
    parkingSpotSet: true,
    scenarioPaths: {
      'Door to taxi': { points: [{ lat: 29.7604, lng: -95.3698 }, { lat: 29.7606, lng: -95.3696 }] },
      'car/truck to Door': { points: [{ lat: 29.7604, lng: -95.3698 }, { lat: 29.7602, lng: -95.3700 }] },
      'bicycle to Door': { points: [{ lat: 29.7604, lng: -95.3698 }, { lat: 29.7605, lng: -95.3697 }] },
      'ambulance to Door': { points: [{ lat: 29.7604, lng: -95.3698 }, { lat: 29.7603, lng: -95.3699 }] },
    },
  },
]

export default function Home() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [activeScenario, setActiveScenario] = useState<ScenarioType | null>(null)
  const [isEditingDoor, setIsEditingDoor] = useState(false)

  const handleScenarioSelect = useCallback((scenario: ScenarioType | null) => {
    setActiveScenario(scenario)
  }, [])

  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return addresses
    const query = searchQuery.toLowerCase()
    return addresses.filter(
      (addr) =>
        addr.givenAddress.toLowerCase().includes(query) ||
        addr.validatedAddress?.toLowerCase().includes(query)
    )
  }, [addresses, searchQuery])

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((addr) => addr.id === selectedAddressId) || null
  }, [addresses, selectedAddressId])

  const completedCount = useMemo(() => {
    return addresses.filter((addr) => addr.wizardStatus === 'completed').length
  }, [addresses])

  const updateAddress = useCallback((id: string, updates: Partial<Address>) => {
    setAddresses((prev) =>
      prev.map((addr) => {
        if (addr.id !== id) return addr
        
        const updated = { ...addr, ...updates }
        const { wizardStatus, stepsCompleted } = calculateWizardStatus(updated)
        updated.wizardStatus = wizardStatus
        updated.stepsCompleted = stepsCompleted
        return updated
      })
    )
  }, [])

  const navigateToAddress = useCallback((direction: 'prev' | 'next') => {
    if (!selectedAddressId) return
    
    const currentIndex = addresses.findIndex((addr) => addr.id === selectedAddressId)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : addresses.length - 1
    } else {
      newIndex = currentIndex < addresses.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedAddressId(addresses[newIndex].id)
  }, [addresses, selectedAddressId])

  // Geocode address when an address is selected
  useEffect(() => {
    const geocodeSelectedAddress = async () => {
      if (!selectedAddress) {
        setAddressCoordinates(null)
        return
      }

      // If address already has coordinates, use them
      if (selectedAddress.coordinates) {
        setAddressCoordinates(selectedAddress.coordinates)
        return
      }

      // Otherwise, geocode the address
      setIsGeocoding(true)
      const addressToGeocode = selectedAddress.validatedAddress || selectedAddress.selectedAddress || selectedAddress.givenAddress
      
      const coords = await geocodeAddress(addressToGeocode)
      
      if (coords) {
        setAddressCoordinates(coords)
        // Cache the coordinates in the address
        updateAddress(selectedAddress.id, { coordinates: coords })
      } else {
        // Use fallback coordinates if geocoding fails
        const fallbackCoords = getFallbackCoordinates(addressToGeocode)
        if (fallbackCoords) {
          setAddressCoordinates(fallbackCoords)
          updateAddress(selectedAddress.id, { coordinates: fallbackCoords })
        }
      }
      
      setIsGeocoding(false)
    }

    geocodeSelectedAddress()
  }, [selectedAddress, updateAddress])

  const handleSelectAddress = useCallback((id: string) => {
    setSelectedAddressId(id)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Section */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        <LeftSection
          addresses={filteredAddresses}
          selectedAddress={selectedAddress}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectAddress={handleSelectAddress}
          onBackToList={() => {
            setSelectedAddressId(null)
            setActiveScenario(null)
            setIsEditingDoor(false)
          }}
          onUpdateAddress={updateAddress}
          onNavigateAddress={navigateToAddress}
          totalAddresses={addresses.length}
          completedCount={completedCount}
          activeScenario={activeScenario}
          onScenarioSelect={handleScenarioSelect}
          isEditingDoor={isEditingDoor}
          onEditDoorChange={setIsEditingDoor}
        />
        <RightSection
          selectedAddress={selectedAddress}
          selectedAddressId={selectedAddressId}
          onUpdateAddress={updateAddress}
          addressCoordinates={addressCoordinates}
          activeScenario={activeScenario}
          onScenarioSelect={handleScenarioSelect}
          isEditingDoor={isEditingDoor}
          onEditDoorChange={setIsEditingDoor}
        />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
