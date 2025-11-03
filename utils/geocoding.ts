/**
 * Geocode an address string to coordinates using OpenStreetMap Nominatim API
 * This is a free geocoding service - use responsibly (rate limit: 1 request/second)
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'ManagerDataEntryApp/1.0', // Required by Nominatim
        },
      }
    )

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Get approximate coordinates for common US cities (fallback)
 */
export function getFallbackCoordinates(address: string): { lat: number; lng: number } | null {
  const cityMap: Record<string, { lat: number; lng: number }> = {
    'New York': { lat: 40.7128, lng: -74.006 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Houston': { lat: 29.7604, lng: -95.3698 },
  }

  for (const [city, coords] of Object.entries(cityMap)) {
    if (address.includes(city)) {
      return coords
    }
  }

  // Default to New York
  return { lat: 40.7128, lng: -74.006 }
}

