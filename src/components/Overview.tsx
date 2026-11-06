import { formatAverage, formatCount, formatMonth, formatPercent } from '../lib/format.ts'
import { averageRating, monthlySeries, oneStarRate, ratingCounts, topWords, versionStats } from '../lib/stats.ts'
import { APP_CHOICE, APP_SHORT, type AppId, type Review } from '../lib/types.ts'

type OverviewProps = {
  reviews: Review[]
  apps: AppId[]
  onInspectWord: (word: string, band: 'low' | 'high') => void
}

type MonthPoint = { month: string; count: number; average: number }

function fillMonths(series: MonthPoint[]): MonthPoint[] {
  if (series.length === 0) return []
  const byMonth = new Map(series.map((item) => [item.month, item]))
  const cursor = new Date(`${series[0]!.month}-01T00:00:00Z`)
  const end = new Date(`${series[series.length - 1]!.month}-01T00:00:00Z`)
  const filled: MonthPoint[] = []

  while (cursor <= end) {
    const month = cursor.toISOString().slice(0, 7)
    filled.push(byMonth.get(month) ?? { month, count: 0, average: 0 })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return filled
}

export function Overview({ reviews, apps, onInspectWord }: OverviewProps) {
  const counts = ratingCounts(reviews)
  const total = reviews.length
  const maxRating = Math.max(...Object.values(counts), 1)
  const months = fillMonths(monthlySeries(reviews))
  const versions = versionStats(reviews)
  const lowWords = topWords(reviews.filter((review) => review.rating <= 2), 12)
  const highWords = topWords(reviews.filter((review) => review.rating >= 4), 12)
  const busiest = [...months].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="stack">
      <section className="metric-grid" aria-label="Özet sayılar">
        <article className="metric">
          <p className="metric-label">Yorum</p>
          <p className="metric-value">{formatCount(total)}</p>
        </article>
        <article className="metric">
          <p className="metric-label">Ortalama</p>
          <p className="metric-value">{total ? formatAverage(averageRating(reviews)) : '—'}</p>
          <p className="metric-note">5 üzerinden</p>
        </article>
        <article className="metric">
          <p className="metric-label">1 yıldız</p>
          <p className="metric-value">{total ? formatPercent(oneStarRate(reviews)) : '—'}</p>
          <p className="metric-note">{formatCount(counts[1] ?? 0)} yorum</p>
        </article>
      </section>

      <section className="split">
        {apps.map((appId) => {
          const subset = reviews.filter((review) => review.appId === appId)
          return (
            <article key={appId} className="panel">
              <p className="eyebrow">{APP_SHORT[appId]}</p>
              <h2>{APP_CHOICE[appId].split(' · ')[1]}</h2>
              <p className="metric-value metric-value-small">
                {subset.length ? formatAverage(averageRating(subset)) : '—'}
              </p>
              <p className="metric-note">
                {formatCount(subset.length)} yorum · 1 yıldız{' '}
                {subset.length ? formatPercent(oneStarRate(subset)) : '—'}
              </p>
            </article>
          )
        })}
      </section>

      <section className="panel">
        <h2>Yıldız dağılımı</h2>
        <div className="dist">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = counts[rating] ?? 0
            const width = total === 0 ? 0 : (count / maxRating) * 100
            return (
              <div key={rating} className="dist-row">
                <span>{rating} ★</span>
                <div className="dist-track" aria-hidden="true">
                  <div className={`dist-fill tone-${rating}`} style={{ width: `${width}%` }} />
                </div>
                <span className="dist-count">
                  {formatCount(count)}
                  {total ? ` · ${formatPercent(count / total)}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Aylık hacim ve ortalama</h2>
        {months.length === 0 ? (
          <p className="empty">Bu aralıkta tarihli yorum yok.</p>
        ) : (
          <>
            <div className="chart-scroll">
              <MonthChart months={months} />
            </div>
            <p className="hint">
              Çubuk yorum sayısı, çizgi ortalama yıldız. En yoğun ay {formatMonth(busiest!.month)},{' '}
              {formatCount(busiest!.count)} yorum.
            </p>
          </>
        )}
      </section>

      <section className="split words">
        <WordColumn
          title="1–2 yıldızda sık geçenler"
          words={lowWords}
          onPick={(word) => onInspectWord(word, 'low')}
        />
        <WordColumn
          title="4–5 yıldızda sık geçenler"
          words={highWords}
          onPick={(word) => onInspectWord(word, 'high')}
        />
      </section>

      <section className="panel">
        <h2>Sürümler</h2>
        <p className="hint">Aynı sürüm numarası iOS ve Android’de ayrı satırdır. Sürümü boş kayıtlar “Sürüm yok”.</p>
        {versions.length === 0 ? (
          <p className="empty">Sürüm kırılımı yok.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Uygulama</th>
                  <th scope="col">Sürüm</th>
                  <th scope="col">Adet</th>
                  <th scope="col">Ortalama</th>
                  <th scope="col">1 yıldız</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((row) => (
                  <tr key={`${row.appId}-${row.version}`}>
                    <td>{APP_SHORT[row.appId]}</td>
                    <td>{row.version}</td>
                    <td>{formatCount(row.count)}</td>
                    <td>{formatAverage(row.average)}</td>
                    <td className={row.oneStarRate >= 0.5 ? 'is-weak' : undefined}>
                      {formatPercent(row.oneStarRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function MonthChart({ months }: { months: MonthPoint[] }) {
  const slot = 18
  const barWidth = 10
  const plotHeight = 128
  const width = Math.max(months.length * slot, 280)
  const height = plotHeight + 72
  const max = Math.max(...months.map((month) => month.count), 1)
  const segments: string[][] = []
  let current: string[] = []

  months.forEach((month, index) => {
    if (month.count === 0) {
      if (current.length > 0) segments.push(current)
      current = []
      return
    }
    const x = index * slot + barWidth / 2
    const y = plotHeight - (month.average / 5) * (plotHeight - 10)
    current.push(`${x},${y}`)
  })
  if (current.length > 0) segments.push(current)

  return (
    <svg
      className="month-chart"
      width={width}
      height={height}
      role="img"
      aria-label="Aylık yorum sayısı ve ortalama yıldız"
    >
      {months.map((month, index) => {
        const barHeight = month.count === 0 ? 0 : Math.max(2, (month.count / max) * (plotHeight - 10))
        const x = index * slot
        const showLabel = month.month.endsWith('-01') || index === 0 || index === months.length - 1
        return (
          <g key={month.month}>
            <rect
              x={x}
              y={plotHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx="2"
              className="bar"
            >
              <title>
                {`${formatMonth(month.month)}: ${formatCount(month.count)} yorum${
                  month.count ? `, ortalama ${formatAverage(month.average)}` : ''
                }`}
              </title>
            </rect>
            {showLabel && (
              <text
                x={x + barWidth / 2}
                y={plotHeight + 14}
                className="chart-label"
                transform={`rotate(65 ${x + barWidth / 2} ${plotHeight + 14})`}
              >
                {formatMonth(month.month)}
              </text>
            )}
          </g>
        )
      })}
      {segments.map((segment) => (
        <polyline key={segment.join(' ')} points={segment.join(' ')} className="average-line" />
      ))}
      {months.map((month, index) => {
        if (month.count === 0) return null
        const x = index * slot + barWidth / 2
        const y = plotHeight - (month.average / 5) * (plotHeight - 10)
        return <circle key={`${month.month}-avg`} cx={x} cy={y} r="2.4" className="average-dot" />
      })}
    </svg>
  )
}

function WordColumn({
  title,
  words,
  onPick,
}: {
  title: string
  words: { word: string; count: number }[]
  onPick: (word: string) => void
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {words.length === 0 ? (
        <p className="empty">Bu aralıkta ayırt edici kelime yok.</p>
      ) : (
        <div className="word-list">
          {words.map((entry) => (
            <button key={entry.word} type="button" className="word" onClick={() => onPick(entry.word)}>
              {entry.word}
              <span>{formatCount(entry.count)}</span>
            </button>
          ))}
        </div>
      )}
      <p className="hint">Kelimeye basınca yorum listesi o kelimeye iner.</p>
    </section>
  )
}