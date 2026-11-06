import type { AppId } from './types.ts'

export function formatCount(value: number): string {
  return value.toLocaleString('tr-TR')
}

export function formatAverage(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export function formatPercent(rate: number): string {
  return `%${Math.round(rate * 100)}`
}

export function formatDay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-')
  const date = new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1))
  return date.toLocaleDateString('tr-TR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function excerpt(value: string, max = 220): string {
  const flat = value.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max).trimEnd()}…`
}

export function compareVersions(a: string, b: string): number {
  if (a === 'Sürüm yok') return 1
  if (b === 'Sürüm yok') return -1
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const delta = (right[index] ?? 0) - (left[index] ?? 0)
    if (delta !== 0) return delta
  }
  return a.localeCompare(b, 'tr')
}

export function appTone(appId: AppId): string {
  return appId === 'ios' ? 'ios' : 'android'
}