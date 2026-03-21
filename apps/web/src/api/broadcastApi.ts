import type { ApiEnvelope, BroadcastPayload, BroadcastState, NewsEvent } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'

async function unwrapResponse<T>(response: Response): Promise<T> {
  const envelope = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !envelope.ok) {
    const message = envelope.ok ? 'Request failed' : envelope.error.message
    throw new Error(message)
  }
  return envelope.data
}

export async function fetchCurrentBroadcast(): Promise<BroadcastPayload> {
  const response = await fetch(`${API_BASE}/api/broadcast/current`)
  return unwrapResponse<BroadcastPayload>(response)
}

export async function triggerBroadcastCycle(): Promise<BroadcastPayload> {
  const response = await fetch(`${API_BASE}/api/broadcast/trigger`, {
    method: 'POST'
  })
  return unwrapResponse<BroadcastPayload>(response)
}

export async function fetchTopEvents(): Promise<{ top5: NewsEvent[]; generatedAt: string }> {
  const response = await fetch(`${API_BASE}/api/broadcast/events`)
  return unwrapResponse<{ top5: NewsEvent[]; generatedAt: string }>(response)
}

export async function fetchState(): Promise<BroadcastState> {
  const response = await fetch(`${API_BASE}/api/broadcast/state`)
  const data = await unwrapResponse<{ state: BroadcastState }>(response)
  return data.state
}
