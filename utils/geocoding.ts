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
 * Get approximate coordinates for common Norwegian addresses (fallback)
 */
export function getFallbackCoordinates(address: string): { lat: number; lng: number } | null {
  const addressMap: Record<string, { lat: number; lng: number }> = {
    'Karl Johans gate': { lat: 59.9139, lng: 10.7522 },
    'Storgata': { lat: 59.9153, lng: 10.7525 },
    'Aker Brygge': { lat: 59.9097, lng: 10.7238 },
    'Frognerveien': { lat: 59.9244, lng: 10.6996 },
    'Oslo': { lat: 59.9139, lng: 10.7522 },
  }

  for (const [key, coords] of Object.entries(addressMap)) {
    if (address.includes(key)) {
      return coords
    }
  }

  // Default to Oslo, Norway
  return { lat: 59.9139, lng: 10.7522 }
}

