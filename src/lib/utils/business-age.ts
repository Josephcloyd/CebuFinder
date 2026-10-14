export function formatBusinessAge(establishedYear?: number | null): string {
  if (!establishedYear) return 'Not available'

  const age = new Date().getFullYear() - establishedYear
  if (age < 0) return 'Not available'
  if (age === 0) return 'Started this year'
  return `About ${age} year${age === 1 ? '' : 's'}`
}

export function formatBusinessAgeWithYear(establishedYear?: number | null): string {
  if (!establishedYear) return 'Not found in public data'
  return `${formatBusinessAge(establishedYear)} · Since ${establishedYear}`
}
