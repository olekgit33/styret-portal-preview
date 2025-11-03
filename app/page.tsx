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
    givenAddress: 'Karl Johans gate 1, 0161 Oslo',
    validatedAddress: 'Karl Johans gate 1, 0161 Oslo, Norge',
    wizardStatus: 'completed',
    stepsCompleted: 4,
    selectedScenarios: ['Door to taxi', 'car/truck to Door', 'bicycle to Door', 'ambulance to Door'],
    doorPosition: { lat: 59.9139, lng: 10.7522 },
    parkingSpotSet: true,
    scenarioPaths: {
      'Door to taxi': { points: [{ lat: 59.9139, lng: 10.7522 }, { lat: 59.9141, lng: 10.7520 }] },
      'car/truck to Door': { points: [{ lat: 59.9139, lng: 10.7522 }, { lat: 59.9137, lng: 10.7524 }] },
      'bicycle to Door': { points: [{ lat: 59.9139, lng: 10.7522 }, { lat: 59.9140, lng: 10.7521 }] },
      'ambulance to Door': { points: [{ lat: 59.9139, lng: 10.7522 }, { lat: 59.9138, lng: 10.7523 }] },
    },
  },
  {
    id: '2',
    givenAddress: 'Storgata 15, 0155 Oslo',
    wizardStatus: 'not-started',
    selectedScenarios: [],
  },
  {
    id: '3',
    givenAddress: 'Aker Brygge 10, 0250 Oslo',
    validatedAddress: 'Aker Brygge 10, 0250 Oslo, Norge',
    wizardStatus: 'in-progress',
    stepsCompleted: 2,
    selectedScenarios: ['Door to taxi', 'car/truck to Door'],
    doorPosition: { lat: 59.9097, lng: 10.7238 },
  },
  {
    id: '4',
    givenAddress: 'Frognerveien 67, 0266 Oslo',
    validatedAddress: 'Frognerveien 67, 0266 Oslo, Norge',
    wizardStatus: 'completed',
    stepsCompleted: 4,
    selectedScenarios: ['Door to taxi', 'car/truck to Door', 'bicycle to Door', 'ambulance to Door'],
    doorPosition: { lat: 59.9244, lng: 10.6996 },
    parkingSpotSet: true,
    scenarioPaths: {
      'Door to taxi': { points: [{ lat: 59.9244, lng: 10.6996 }, { lat: 59.9246, lng: 10.6994 }] },
      'car/truck to Door': { points: [{ lat: 59.9244, lng: 10.6996 }, { lat: 59.9242, lng: 10.6998 }] },
      'bicycle to Door': { points: [{ lat: 59.9244, lng: 10.6996 }, { lat: 59.9245, lng: 10.6995 }] },
      'ambulance to Door': { points: [{ lat: 59.9244, lng: 10.6996 }, { lat: 59.9243, lng: 10.6997 }] },
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
