export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= rating ? 'star is-on' : 'star'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}