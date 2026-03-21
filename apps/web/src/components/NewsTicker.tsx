interface NewsTickerProps {
  headlines: string[]
}

export function NewsTicker({ headlines }: NewsTickerProps) {
  return (
    <div className="ticker-wrap" role="status" aria-live="polite">
      <div className="ticker-track">
        {headlines.concat(headlines).map((headline, index) => (
          <span className="ticker-item" key={`${headline}-${index}`}>
            {headline}
          </span>
        ))}
      </div>
    </div>
  )
}
