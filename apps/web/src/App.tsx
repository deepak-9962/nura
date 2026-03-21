import { useEffect, useMemo, useState } from 'react'
import { AvatarPlayer } from './components/AvatarPlayer'
import { BreakingBanner } from './components/BreakingBanner'
import { NewsTicker } from './components/NewsTicker'
import { StoryCard } from './components/StoryCard'
import { fetchCurrentBroadcast, fetchState, triggerBroadcastCycle } from './api/broadcastApi'
import type { BroadcastPayload, BroadcastState } from './types'
import './App.css'

function App() {
  const [broadcast, setBroadcast] = useState<BroadcastPayload | null>(null)
  const [state, setState] = useState<BroadcastState>('IDLE')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headlines = useMemo(
    () => (broadcast ? broadcast.top5.map((item) => item.headline) : ['Loading headlines...']),
    [broadcast]
  )

  const refresh = async () => {
    const [current, currentState] = await Promise.all([fetchCurrentBroadcast(), fetchState()])
    setBroadcast(current)
    setState(currentState)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        await refresh()
        setError(null)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void load()

    const poll = window.setInterval(() => {
      void refresh().catch((pollError) => {
        setError(pollError instanceof Error ? pollError.message : 'Polling failed')
      })
    }, 30_000)

    return () => window.clearInterval(poll)
  }, [])

  const onTrigger = async () => {
    setState('INGESTING')
    try {
      const next = await triggerBroadcastCycle()
      setBroadcast(next)
      setState(next.state)
      setError(null)
    } catch (triggerError) {
      setState('ERROR')
      setError(triggerError instanceof Error ? triggerError.message : 'Failed to trigger next cycle')
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <h1>Nura AI News Anchor</h1>
        <div className="status-group">
          <span className={`status status-${state.toLowerCase()}`}>{state}</span>
          <button onClick={onTrigger} disabled={loading}>
            Trigger Cycle
          </button>
        </div>
      </header>

      <BreakingBanner visible={state === 'BREAKING_ALERT'} />

      <AvatarPlayer broadcast={broadcast} />

      <NewsTicker headlines={headlines} />

      {error && <p className="error">{error}</p>}

      <section className="stories-grid">
        {broadcast?.top5.map((event) => (
          <StoryCard event={event} key={event.eventId} />
        ))}
      </section>

      <section className="subtitles-panel">
        <h2>Tamil Subtitles</h2>
        <ul>
          {(broadcast?.subtitles ?? []).map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
