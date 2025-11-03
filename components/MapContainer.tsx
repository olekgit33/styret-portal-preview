'use client'

import React, { useEffect } from 'react'
import { MapContainer as LeafletMap, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Address } from '@/types'

interface MapContainerProps {
  mapType: 'outline' | 'satellite' | 'street'
  selectedAddress: Address | null
  onMapClick: (lat: number, lng: number, mapType: 'outline' | 'satellite' | 'street') => void
  pendingDoorPosition?: { lat: number; lng: number }
  addressCoordinates?: { lat: number; lng: number } | null
}

// Fix for default marker icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

function MapClickHandler({
  onMapClick,
  mapType,
}: {
  onMapClick: (lat: number, lng: number, mapType: 'outline' | 'satellite' | 'street') => void
  mapType: 'outline' | 'satellite' | 'street'
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng, mapType)
    },
  })
  return null
}

// Component to update map center when address coordinates change
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
      duration: 0.5,
    })
  }, [center, map])
  
  return null
}

function getTileLayerUrl(mapType: 'outline' | 'satellite' | 'street'): string {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  
  switch (mapType) {
    case 'satellite':
      // Using Google Maps satellite imagery
      return 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
    case 'street':
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    case 'outline':
      // Using Mapbox Light style for outline/minimal map from mapbox.com
      // Mapbox requires an access token - get one from https://account.mapbox.com/access-tokens/
      if (mapboxToken) {
        return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
      }
      // Fallback to OpenStreetMap if no token provided
      return 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
    default:
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }
}

function getTileLayerAttribution(mapType: 'outline' | 'satellite' | 'street'): string {
  switch (mapType) {
    case 'outline':
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (mapboxToken) {
        return '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    case 'satellite':
      return '&copy; <a href="https://www.google.com/maps">Google</a>'
    case 'street':
    default:
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
}

export default function MapContainer({
  mapType,
  selectedAddress,
  onMapClick,
  pendingDoorPosition,
  addressCoordinates,
}: MapContainerProps) {
  const defaultCenter: [number, number] = [40.7128, -74.006] // Default to New York
  const defaultZoom = 13

  // Priority: addressCoordinates > doorPosition > defaultCenter
  const center: [number, number] = addressCoordinates
    ? [addressCoordinates.lat, addressCoordinates.lng]
    : selectedAddress?.doorPosition
    ? [selectedAddress.doorPosition.lat, selectedAddress.doorPosition.lng]
    : defaultCenter

  const doorIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#4caf50" opacity="0.3" rx="16"/>
        <path d="M16 8 L20 8 L20 24 L16 24 Z" fill="#4caf50"/>
        <circle cx="18" cy="16" r="2" fill="#fff"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  const pendingDoorIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#ff9800" opacity="0.3" rx="16"/>
        <path d="M16 8 L20 8 L20 24 L16 24 Z" fill="#ff9800"/>
        <circle cx="18" cy="16" r="2" fill="#fff"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  const parkingIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#2196f3" opacity="0.3" rx="16"/>
        <path d="M8 12 L24 12 L24 20 L8 20 Z" fill="#2196f3"/>
        <text x="16" y="18" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">P</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  return (
    <div className="w-full h-full relative">
      <LeafletMap
        center={center}
        zoom={defaultZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={getTileLayerAttribution(mapType)}
          url={getTileLayerUrl(mapType)}
          tileSize={mapType === 'satellite' ? 256 : (mapType === 'outline' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? 512 : 256)}
          zoomOffset={mapType === 'outline' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? -1 : 0}
          subdomains={mapType === 'satellite' ? ['0', '1', '2', '3'] : (mapType === 'outline' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? [] : ['a', 'b', 'c'])}
          maxZoom={mapType === 'satellite' ? 20 : 19}
        />
        <MapCenterUpdater center={center} />
        <MapClickHandler onMapClick={onMapClick} mapType={mapType} />
        
        {/* Pending door position (orange) */}
        {pendingDoorPosition && (
          <Marker
            position={[pendingDoorPosition.lat, pendingDoorPosition.lng]}
            icon={pendingDoorIcon}
          />
        )}
        
        {/* Confirmed door position (green) */}
        {selectedAddress?.doorPosition && !pendingDoorPosition && (
          <Marker
            position={[selectedAddress.doorPosition.lat, selectedAddress.doorPosition.lng]}
            icon={doorIcon}
          />
        )}
        
        {/* Parking spot */}
        {selectedAddress?.parkingSpotSet && selectedAddress.doorPosition && !pendingDoorPosition && (
          <Marker
            position={[
              selectedAddress.doorPosition.lat + 0.0005,
              selectedAddress.doorPosition.lng + 0.0005,
            ]}
            icon={parkingIcon}
          />
        )}
        
        {/* Address location marker */}
        {addressCoordinates && !selectedAddress?.doorPosition && !pendingDoorPosition && (
          <Marker
            position={[addressCoordinates.lat, addressCoordinates.lng]}
            icon={new L.Icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="#2196f3" opacity="0.3"/>
                  <circle cx="16" cy="16" r="8" fill="#2196f3"/>
                  <circle cx="16" cy="16" r="3" fill="#fff"/>
                </svg>
              `),
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            })}
          />
        )}
      </LeafletMap>
    </div>
  )
}

