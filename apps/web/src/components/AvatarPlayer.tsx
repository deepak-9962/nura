import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { BroadcastPayload } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'
// Use local model because ReadyPlayerMe CORS/DNS was failing
const RPM_MODEL_URL = '/assets/models/anchor.glb'

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function toMediaUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

function RpmAvatar({
  energyRef,
  audioRef,
  visemeFrames
}: {
  energyRef: React.MutableRefObject<number>
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  visemeFrames: BroadcastPayload['visemeFrames']
}) {
  const { scene } = useGLTF(RPM_MODEL_URL)
  const [modelOffset, setModelOffset] = useState<[number, number, number]>([0, 0, 0])
  const [modelScale, setModelScale] = useState(1)
  const visemeIndexRef = useRef(0)

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    if (box.isEmpty()) {
      return
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const tallestSide = Math.max(size.y, 1)

    // Anchor to chest level so upper body remains the visual focus.
    const normalizedScale = Math.min(1.75, Math.max(1.4, 2.8 / tallestSide))
    const chestY = box.max.y - size.y * 0.2
    setModelScale(normalizedScale)
    setModelOffset([
      -center.x,
      -chestY,
      -center.z,
    ])
  }, [scene])

  useEffect(() => {
    visemeIndexRef.current = 0
  }, [visemeFrames])
  
  useFrame(() => {
    const targetEnergy = energyRef.current
    const frames = visemeFrames ?? []
    let activeViseme: 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' = targetEnergy > 0.05 ? 'V1' : 'V0'

    const audio = audioRef.current
    if (audio && !audio.paused && frames.length > 0) {
      const tMs = Math.round(audio.currentTime * 1000)
      let idx = visemeIndexRef.current

      while (idx < frames.length - 1 && tMs > frames[idx].endMs) {
        idx += 1
      }
      while (idx > 0 && tMs < frames[idx].startMs) {
        idx -= 1
      }

      visemeIndexRef.current = idx
      const frame = frames[idx]
      if (frame && tMs >= frame.startMs && tMs <= frame.endMs) {
        activeViseme = frame.id
      } else {
        activeViseme = 'V0'
      }
    }

    const visemeShapes: Record<typeof activeViseme, Record<string, number>> = {
      V0: { jawOpen: 0.02, mouthOpen: 0.02, viseme_aa: 0, viseme_O: 0, viseme_E: 0, viseme_I: 0, viseme_CH: 0 },
      V1: { jawOpen: 0.08, mouthOpen: 0.09, viseme_aa: 0.14, viseme_O: 0.04, viseme_E: 0, viseme_I: 0, viseme_CH: 0 },
      V2: { jawOpen: 0.1, mouthOpen: 0.12, viseme_aa: 0.06, viseme_O: 0, viseme_E: 0.5, viseme_I: 0.35, viseme_CH: 0 },
      V3: { jawOpen: 0.22, mouthOpen: 0.24, viseme_aa: 0.58, viseme_O: 0.06, viseme_E: 0.05, viseme_I: 0, viseme_CH: 0 },
      V4: { jawOpen: 0.14, mouthOpen: 0.16, viseme_aa: 0.15, viseme_O: 0.62, viseme_E: 0, viseme_I: 0, viseme_CH: 0 },
      V5: { jawOpen: 0.06, mouthOpen: 0.08, viseme_aa: 0, viseme_O: 0, viseme_E: 0.08, viseme_I: 0.08, viseme_CH: 0.52 }
    }

    const speechDrive = audio && !audio.paused ? 0.6 + targetEnergy * 0.7 : 0
    const activeTargets = visemeShapes[activeViseme]

    scene.traverse((node: any) => {
      if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
        const dict = node.morphTargetDictionary

        Object.entries(activeTargets).forEach(([shape, weight]) => {
          if (dict[shape] !== undefined) {
            const idx = dict[shape]
            const current = node.morphTargetInfluences[idx]
            const target = Math.min(1, weight * speechDrive)
            node.morphTargetInfluences[idx] += (target - current) * 0.33
          }
        })

        const decayShapes = ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O', 'viseme_E', 'viseme_I', 'viseme_CH']
        decayShapes.forEach((shape) => {
          if (dict[shape] === undefined || Object.prototype.hasOwnProperty.call(activeTargets, shape)) {
            return
          }
          const idx = dict[shape]
          node.morphTargetInfluences[idx] += (0 - node.morphTargetInfluences[idx]) * 0.24
        })
      }
    })
  })

  return <primitive object={scene} position={modelOffset} scale={modelScale} />
}

function CameraAim() {
  const { camera } = useThree()

  useEffect(() => {
    camera.lookAt(0, 0.72, 0)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}

// Preload the 3D model for performance
useGLTF.preload(RPM_MODEL_URL)

interface AvatarPlayerProps {
  broadcast: BroadcastPayload | null
}

interface CanvasErrorBoundaryProps {
  onRenderError: (error: Error) => void
  children: React.ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    this.props.onRenderError(error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function AvatarPlayer({ broadcast }: AvatarPlayerProps) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [webglBlocked, setWebglBlocked] = useState(false)
  const shellRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const analyzerCleanupRef = useRef<(() => void) | null>(null)
  const energyRef = useRef(0)

  const resolvedVideoUrl = useMemo(() => toMediaUrl(broadcast?.videoUrl), [broadcast?.videoUrl])
  const resolvedAudioUrl = useMemo(() => toMediaUrl(broadcast?.audioUrl), [broadcast?.audioUrl])

  const hasVideo = useMemo(() => {
    return Boolean(resolvedVideoUrl) && !videoFailed
  }, [resolvedVideoUrl, videoFailed])
  const webglSupported = useMemo(() => supportsWebGL(), [])

  const onCanvasError = (error: Error) => {
    const message = error.message ?? ''
    if (message.includes('WebGL context') || message.includes('Error creating WebGL')) {
      setWebglBlocked(true)
    }
  }

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = String(event.message ?? '')
      if (message.includes('Error creating WebGL context') || message.includes('A WebGL context could not be created')) {
        setWebglBlocked(true)
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  useEffect(() => {
    const shell = shellRef.current
    const audio = audioRef.current

    if (!shell || !audio || !resolvedAudioUrl) {
      return
    }

    shell.style.setProperty('--speech-energy', '0')
    energyRef.current = 0

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) {
      return
    }

    let cancelled = false
    const context = new AudioCtx()
    const source = context.createMediaElementSource(audio)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.85
    source.connect(analyser)
    analyser.connect(context.destination)
    const bins = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (cancelled) {
        return
      }

      analyser.getByteFrequencyData(bins)
      let sum = 0
      for (let i = 0; i < bins.length; i += 1) {
        const normalized = bins[i] / 255
        sum += normalized * normalized
      }

      const rms = Math.sqrt(sum / bins.length)
      const energy = Math.min(1, rms * 2.8) // boosted slightly for 3D model
      
      energyRef.current = energy
      shell.style.setProperty('--speech-energy', energy.toFixed(3))
      rafRef.current = window.requestAnimationFrame(tick)
    }

    const onPlay = async () => {
      if (context.state === 'suspended') {
        await context.resume()
      }
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(tick)
      }
    }

    const onStop = () => {
      shell.style.setProperty('--speech-energy', '0')
      energyRef.current = 0
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onStop)
    audio.addEventListener('ended', onStop)

    analyzerCleanupRef.current = () => {
      cancelled = true
      onStop()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onStop)
      audio.removeEventListener('ended', onStop)
      source.disconnect()
      analyser.disconnect()
      void context.close()
      shell.style.setProperty('--speech-energy', '0')
      energyRef.current = 0
    }

    return () => {
      analyzerCleanupRef.current?.()
      analyzerCleanupRef.current = null
    }
  }, [resolvedAudioUrl])

  return (
    <section ref={shellRef} className="avatar-shell" aria-label="AI anchor player">
      {hasVideo ? (
        <video
          className="anchor-video"
          controls
          autoPlay
          muted
          playsInline
          src={resolvedVideoUrl}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className={`avatar-portrait-shell ${isSpeaking ? 'is-speaking' : ''}`}>
          {!webglSupported || webglBlocked ? (
            <div className="avatar-fallback" role="status" aria-live="polite">
              <div className="avatar-face">
                <div className="eyes" />
                <div className="mouth" />
              </div>
              <p>WebGL is blocked in this browser session. Reload the tab or enable hardware acceleration to view 3D.</p>
            </div>
          ) : (
            <CanvasErrorBoundary onRenderError={onCanvasError}>
              <Canvas
                camera={{ position: [0, 1.05, 2.35], fov: 27 }}
                dpr={[1, 1.25]}
                gl={{ antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true }}
              >
                <CameraAim />
                <ambientLight intensity={1} />
                <hemisphereLight intensity={0.7} groundColor="#1e2230" color="#b8c6ff" />
                <directionalLight position={[1.5, 3, 2.5]} intensity={1.1} color="#ffffff" />

                <Suspense fallback={null}>
                  <RpmAvatar
                    energyRef={energyRef}
                    audioRef={audioRef}
                    visemeFrames={broadcast?.visemeFrames}
                  />
                </Suspense>
              </Canvas>
            </CanvasErrorBoundary>
          )}
          <span className="avatar-voice-glow" aria-hidden="true" />
        </div>
      )}

      {resolvedAudioUrl ? (
        <audio
          ref={audioRef}
          className="anchor-audio"
          crossOrigin="anonymous"
          controls
          preload="none"
          src={resolvedAudioUrl}
          onPlay={() => setIsSpeaking(true)}
          onPause={() => setIsSpeaking(false)}
          onEnded={() => setIsSpeaking(false)}
        />
      ) : null}

      <div className="player-details">
        <h2>AI News Anchor</h2>
        <p>{broadcast ? `Broadcast ${broadcast.broadcastId.slice(0, 8)}` : 'Live 3D Render'}</p>
      </div>
    </section>
  )
}
