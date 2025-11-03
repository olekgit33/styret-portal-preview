import { Address, WizardStatus } from '@/types'

export const calculateWizardStatus = (address: Address): {
  wizardStatus: WizardStatus
  stepsCompleted: number
} => {
  let stepsCompleted = 0
  
  if (address.validatedAddress || address.selectedAddress) stepsCompleted++
  if (address.doorPosition) stepsCompleted++
  if (address.selectedScenarios && address.selectedScenarios.length > 0) stepsCompleted++
  if (address.parkingSpotSet) stepsCompleted++
  
  let wizardStatus: WizardStatus
  if (stepsCompleted === 0) {
    wizardStatus = 'not-started'
  } else if (stepsCompleted === 4) {
    wizardStatus = 'completed'
  } else {
    wizardStatus = 'in-progress'
  }
  
  return { wizardStatus, stepsCompleted }
}

export const getStatusColor = (status: WizardStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'in-progress':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

export const getStatusLabel = (address: Address): string => {
  if (address.wizardStatus === 'in-progress' && address.stepsCompleted !== undefined) {
    return `In Progress (${address.stepsCompleted} steps completed)`
  }
  return address.wizardStatus.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
