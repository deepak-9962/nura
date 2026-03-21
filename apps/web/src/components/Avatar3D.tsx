import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface Avatar3DProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>
}

// Ensure the GLTF is properly typed when traversing
interface GLTFResult {
  scene: THREE.Group
}

export function Avatar3D({ analyserRef }: Avatar3DProps) {
  // Local TalkingHead brunette avatar with ARKit facial blendshapes enabled
  const { scene } = useGLTF('/assets/models/anchor.glb') as unknown as GLTFResult
  
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null)
  const dataArray = useRef(new Uint8Array(64))

  // Traverse the 3D model on load to find the mesh with facial morph targets (blendshapes)
  useEffect(() => {
    scene.traverse((node) => {
      // Look for SkinnedMeshes that have a morphTargetDictionary
      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinnedMesh = node as THREE.SkinnedMesh
        if (skinnedMesh.morphTargetDictionary) {
          // We specifically want the main Avatar/Head mesh
          if (skinnedMesh.name.includes('Head') || skinnedMesh.name.includes('Avatar')) {
            headMeshRef.current = skinnedMesh
          }
        }
      }
    })
  }, [scene])

  // Animation loop runs at ~60fps
  useFrame(() => {
    const analyser = analyserRef.current
    const mesh = headMeshRef.current

    // If there's no mesh or morph targets to manipulate, early exit
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
      return
    }

    const jawOpenIndex = mesh.morphTargetDictionary['jawOpen'] ?? mesh.morphTargetDictionary['viseme_aa'] ?? mesh.morphTargetDictionary['mouthOpen']
    const mouthSmileIndex = mesh.morphTargetDictionary['mouthSmile']

    // If no audio is currently playing/analyzing, smoothly return face to resting state
    if (!analyser) {
      if (jawOpenIndex !== undefined) {
        mesh.morphTargetInfluences[jawOpenIndex] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[jawOpenIndex], 0, 0.1)
      }
      return
    }

    // Get current audio frequency data
    analyser.getByteFrequencyData(dataArray.current)
    
    // Calculate the overall volume (energy) in the current frame
    let sum = 0
    for (let i = 0; i < dataArray.current.length; i++) {
      sum += dataArray.current[i]
    }
    const volume = sum / dataArray.current.length

    // Normalize and scale energy linearly/exponentially to make lip syncing visibly distinct
    const rawEnergy = Math.min(1, volume / 80)
    const energy = Math.pow(rawEnergy, 1.5) // Curve to make quiet sounds quieter and loud louder

    // Apply Jaw/Mouth movement based on audio volume
    if (jawOpenIndex !== undefined) {
      const targetMouthOpen = Math.min(1, energy * 1.5)
      // Lerp (Linear Interpolation) creates a realistic smooth transition rather than instant snappy mechanical movement
      mesh.morphTargetInfluences[jawOpenIndex] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[jawOpenIndex], 
        targetMouthOpen, 
        0.5
      )
    }

    // Optional: Add a gentle rest-smile when the avatar is not speaking loudly
    if (mouthSmileIndex !== undefined) {
      const targetSmile = energy > 0.1 ? 0.05 : 0.4
      mesh.morphTargetInfluences[mouthSmileIndex] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[mouthSmileIndex],
        targetSmile,
        0.05
      )
    }
  })

  // Adjust Y offset and scale depending on avatar proportions
  return (
    <group dispose={null} position={[0, -1.3, 0]} scale={2.8}>
      <primitive object={scene} />
    </group>
  )
}
