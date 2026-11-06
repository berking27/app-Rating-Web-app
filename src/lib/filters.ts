import { matchesTheme } from './themes.ts'
import { casefold, foldTr } from './text.ts'
import type { AppId, Review } from './types.ts'

export type ReviewFilters = {
  apps: AppId[]
  ratings: number[]
  dateFrom: string
  dateTo: string
  version: string
  country: string
  language: string
  query: string
  hasReply: boolean
  themeId: string
}

export const defaultFilters: ReviewFilters = {
  apps: ['ios', 'android'],
  ratings: [],
  dateFrom: '',
  dateTo: '',
  version: '',
  country: '',
  language: '',
  query: '',
  hasReply: false,
  themeId: '',
}

export function selectRating(current: number[], rating: number): number[] {
  if (!current.includes(rating)) return [...current, rating].sort((a, b) => a - b)
  return current.filter((value) => value !== rating)
}

export function applyFilters(reviews: Review[], filters: ReviewFilters): Review[] {
  const query = filters.query.trim()
  const queryCase = casefold(query)
  const queryFolded = foldTr(query)

  return reviews.filter((review) => {
    if (!filters.apps.includes(review.appId)) return false
    if (filters.ratings.length > 0 && !filters.ratings.includes(review.rating)) return false
    if (filters.version && review.version !== filters.version) return false
    if (filters.country && review.country !== filters.country) return false
    if (filters.language === '__none__') {
      if (review.language) return false
    } else if (filters.language && review.language !== filters.language) {
      return false
    }
    if (filters.hasReply && !review.replyText) return false
    if (filters.dateFrom && review.day < filters.dateFrom) return false
    if (filters.dateTo && review.day > filters.dateTo) return false
    if (queryCase) {
      const matchesCase = review.caseText.includes(queryCase)
      const matchesAscii = queryFolded === queryCase && review.searchText.includes(queryFolded)
      if (!matchesCase && !matchesAscii) return false
    }
    if (filters.themeId && !matchesTheme(review, filters.themeId)) return false
    return true
  })
}