export type WizardStatus = 'not-started' | 'in-progress' | 'completed'

export type Category = 'Validation' | 'Placing Door' | 'Scenarios' | 'Parking Spot'

export type ScenarioType = 'taxi' | 'car/truck' | 'bicycle' | 'ambulance'

export interface ScenarioPath {
  points: { lat: number; lng: number }[] // Array of points starting from door
}

export interface Address {
  id: string
  givenAddress: string
  validatedAddress?: string
  wizardStatus: WizardStatus
  stepsCompleted?: number
  selectedAddress?: string
  coordinates?: { lat: number; lng: number } // Coordinates for the address location
  doorPosition?: { lat: number; lng: number }
  selectedScenarios: ScenarioType[]
  parkingSpotSet?: boolean
  pendingDoorPosition?: { lat: number; lng: number }
  scenarioPaths?: Partial<Record<ScenarioType, ScenarioPath[]>> // Multiple paths for each scenario
}

export interface WizardStep {
  category: Category
  enabled: boolean
  completed: boolean
}

export interface MapPosition {
  lat: number
  lng: number
  zoom: number
}
