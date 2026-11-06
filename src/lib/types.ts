export type AppId = 'ios' | 'android'

export type Review = {
  id: string
  appId: AppId
  appName: string
  storeLabel: string
  rating: number
  title: string
  text: string
  author: string
  country: string
  language: string
  version: string
  createdAt: string
  createdAtMs: number
  day: string
  replyText: string
  replyDate: string
  thumbsUp: number
  caseText: string
  searchText: string
}

export const APP_ORDER: AppId[] = ['ios', 'android']

export const APP_SHORT: Record<AppId, string> = {
  ios: 'iOS',
  android: 'Android',
}

export const APP_CHOICE: Record<AppId, string> = {
  ios: 'iOS · Museums of Türkiye',
  android: 'Android · MüzeKart',
}