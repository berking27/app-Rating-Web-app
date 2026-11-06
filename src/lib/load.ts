import { normalizeExport, type ExportFile } from './normalize.ts'
import type { AppId, Review } from './types.ts'

export type LoadedReviews = {
  reviews: Review[]
  exportedAt: Record<AppId, string>
}

const FILES: { appId: AppId; file: string }[] = [
  { appId: 'ios', file: 'museums-of-t-rkiye-official-reviews.json' },
  { appId: 'android', file: 'm-zekart-t-rkiye-nin-m-zeleri-reviews.json' },
]

function dataUrl(file: string): string {
  const base = import.meta.env.BASE_URL
  return `${base.endsWith('/') ? base : `${base}/`}data/${file}`
}

export async function loadReviews(): Promise<LoadedReviews> {
  const loaded = await Promise.all(
    FILES.map(async (source) => {
      const response = await fetch(dataUrl(source.file))
      if (!response.ok) throw new Error(`${source.file} okunamadı`)
      const file = (await response.json()) as ExportFile
      return {
        appId: source.appId,
        exportedAt: file.exportedAt,
        reviews: normalizeExport(file, source.appId),
      }
    }),
  )

  return {
    reviews: loaded.flatMap((item) => item.reviews),
    exportedAt: {
      ios: loaded.find((item) => item.appId === 'ios')?.exportedAt ?? '',
      android: loaded.find((item) => item.appId === 'android')?.exportedAt ?? '',
    },
  }
}