export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7']
export const OTHER = '#9ca3af'

export function colorMap(members) {
  const ids = [...members].map((m) => m.id).sort((a, b) => a - b)
  return Object.fromEntries(ids.map((id, i) => [id, SERIES[i] ?? OTHER]))
}