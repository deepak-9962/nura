export function BreakingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return <div className="breaking-banner">BREAKING: Major update queued for next cycle</div>
}
