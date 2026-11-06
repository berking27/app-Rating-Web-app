import { downloadReviewsCsv, SORT_OPTIONS, type SortKey } from '../lib/csv.ts'
import { formatCount, formatDay } from '../lib/format.ts'
import { APP_SHORT, type Review } from '../lib/types.ts'
import { Stars } from './Stars.tsx'

const PAGE_SIZE = 20

type ReviewListProps = {
  reviews: Review[]
  sort: SortKey
  page: number
  onSort: (sort: SortKey) => void
  onPage: (page: number) => void
}

export function ReviewList({ reviews, sort, page, onSort, onPage }: ReviewListProps) {
  const pageCount = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const visible = reviews.slice(start, start + PAGE_SIZE)

  function go(next: number) {
    onPage(next)
    document.getElementById('yorum-listesi')?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="stack" id="yorum-listesi">
      <div className="list-toolbar">
        <p>
          {reviews.length === 0
            ? '0 yorum'
            : `${formatCount(start + 1)}–${formatCount(start + visible.length)} / ${formatCount(reviews.length)}`}
        </p>
        <div className="toolbar-actions">
          <label>
            Sıralama
            <select value={sort} onChange={(event) => onSort(event.target.value as SortKey)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="chip" disabled={reviews.length === 0} onClick={() => downloadReviewsCsv(reviews)}>
            CSV indir
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty panel">Bu filtreye uyan yorum yok.</p>
      ) : (
        <ol className="review-list">
          {visible.map((review) => (
            <li key={review.id} className={`review tone-border-${review.rating}`}>
              <div className="review-top">
                <Stars rating={review.rating} />
                <time dateTime={review.createdAt}>{formatDay(review.createdAt)}</time>
              </div>
              <p className="review-meta">
                {APP_SHORT[review.appId]} · {review.storeLabel} · {review.version}
                {review.country ? ` · ${review.country.toLocaleUpperCase('tr-TR')}` : ''}
                {review.language ? ` · ${review.language}` : ''}
                {review.thumbsUp > 0 ? ` · ${formatCount(review.thumbsUp)} beğeni` : ''}
              </p>
              <p className="author">{review.author}</p>
              {review.title && <h2 className="review-title">{review.title}</h2>}
              {review.text && <p className="review-text">{review.text}</p>}
              {review.replyText && (
                <blockquote className="reply">
                  <footer>
                    Geliştirici yanıtı
                    {review.replyDate ? ` · ${formatDay(review.replyDate)}` : ''}
                  </footer>
                  {review.replyText}
                </blockquote>
              )}
            </li>
          ))}
        </ol>
      )}

      {reviews.length > PAGE_SIZE && (
        <div className="pager">
          <button type="button" className="text-button" disabled={current === 1} onClick={() => go(current - 1)}>
            Önceki
          </button>
          <span>
            Sayfa {formatCount(current)} / {formatCount(pageCount)}
          </span>
          <button
            type="button"
            className="text-button"
            disabled={current === pageCount}
            onClick={() => go(current + 1)}
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  )
}