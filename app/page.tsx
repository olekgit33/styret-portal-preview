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
    wizardStatus: 'in-progress',
    stepsCompleted: 2,
    selectedScenarios: [],
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
    wizardStatus: 'completed',
    selectedScenarios: ['taxi', 'car/truck'],
  },
  {
    id: '4',
    givenAddress: '321 Elm St, Houston, TX 77001',
    wizardStatus: 'not-started',
    selectedScenarios: [],
  },
]

export default function Home() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [activeScenario, setActiveScenario] = useState<ScenarioType | null>(null)

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
          }}
          onUpdateAddress={updateAddress}
          onNavigateAddress={navigateToAddress}
          totalAddresses={addresses.length}
          completedCount={completedCount}
          activeScenario={activeScenario}
          onScenarioSelect={handleScenarioSelect}
        />
        <RightSection
          selectedAddress={selectedAddress}
          selectedAddressId={selectedAddressId}
          onUpdateAddress={updateAddress}
          addressCoordinates={addressCoordinates}
          activeScenario={activeScenario}
          onScenarioSelect={handleScenarioSelect}
        />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
