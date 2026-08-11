export const BUSINESS_CATEGORIES = [
  'Dental Clinic',
  'Medical Clinic',
  'Coffee Shop',
  'Hardware Store',
  'Restaurant',
  'Auto Repair',
  'Salon',
  'Gym / Fitness',
  'Veterinary Clinic',
  'Accounting Office',
  'Law Office',
  'Massage / Spa',
] as const

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]

export function matchBusinessCategory(input: string): BusinessCategory | undefined {
  const text = input.toLowerCase()

  if (text.includes('dental') || text.includes('dentist')) return 'Dental Clinic'
  if (text.includes('medical') || text.includes('doctor') || text.includes('hospital')) return 'Medical Clinic'
  if (text.includes('coffee') || text.includes('cafe')) return 'Coffee Shop'
  if (text.includes('hardware')) return 'Hardware Store'
  if (text.includes('restaurant') || text.includes('food')) return 'Restaurant'
  if (text.includes('auto repair') || text.includes('car repair') || text.includes('mechanic')) return 'Auto Repair'
  if (text.includes('salon') || text.includes('barber') || text.includes('hairdresser')) return 'Salon'
  if (text.includes('gym') || text.includes('fitness')) return 'Gym / Fitness'
  if (text.includes('veterinary') || text.includes('veterinarian') || text.includes('vet clinic')) return 'Veterinary Clinic'
  if (text.includes('accounting') || text.includes('accountant')) return 'Accounting Office'
  if (text.includes('law office') || text.includes('lawyer') || text.includes('attorney')) return 'Law Office'
  if (text.includes('massage') || text.includes('spa')) return 'Massage / Spa'

  return undefined
}
