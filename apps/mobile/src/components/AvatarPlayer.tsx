import React, { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

function RpmAvatar({ energy }: { energy: Animated.SharedValue<number> }) {
  // Uses Metro bundler extension to resolve the GLB 
  const { scene } = useGLTF(require('../../assets/models/anchor.glb') as any);
  const { animations } = useGLTF(require('../../assets/models/idle.glb') as any);

  // Fix Mixamo track names
  const cleanAnimations = useMemo(() => {
    if (!animations) return []
    const cloned = [...animations]
    cloned.forEach(clip => {
      clip.tracks.forEach(track => {
        track.name = track.name.replace('mixamorig', '')
      })
    })
    return cloned
  }, [animations])

  const { actions } = useAnimations(cleanAnimations, scene)

  useEffect(() => {
    if (cleanAnimations && cleanAnimations.length > 0) {
      const actionName = cleanAnimations[0].name
      actions[actionName]?.reset().fadeIn(0.5).play()
    }
  }, [actions, cleanAnimations])
  
  useFrame(() => {
    // energy.value fluctuates between 1 and 1.05 according to simulateLipSync
    // We map that [1, 1.05] range to [0, 1.0] to drive the visemes.
    const targetEnergy = Math.max(0, (energy.value - 1) * 20);
    
    scene.traverse((node: any) => {
      if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
        const dict = node.morphTargetDictionary
        const targets = ['viseme_O', 'viseme_aa', 'jawOpen', 'mouthOpen']
        
        targets.forEach((t) => {
          if (dict[t] !== undefined) {
            const current = node.morphTargetInfluences[dict[t]]
            node.morphTargetInfluences[dict[t]] += (targetEnergy - current) * 0.35
          }
        })
      }
    })
  })

  // Position chest/head down slightly so the face stays centered in frame.
  return <primitive object={scene} position={[0, -1.6, 2.5]} scale={1.2} />
}

interface AvatarPlayerProps {
  audioUrl?: string; // We'll pass the generated TTS MP3 here later
  isLive?: boolean;
}

export default function AvatarPlayer({ audioUrl, isLive = true }: AvatarPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Reanimated shared values to drive the "lip sync" / presence pulse
  const imageScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);

  // Load and play the audio
  useEffect(() => {
    async function loadAudio() {
      if (!audioUrl) return;

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, isLooping: false },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        simulateLipSync();
      } catch (error) {
        console.error("Failed to load audio", error);
      }
    }

    loadAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  // Hook into playback status to sync animations
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        // Reset scale when done
        imageScale.value = withTiming(1, { duration: 300 });
        glowOpacity.value = withTiming(0.2, { duration: 300 });
      }
    }
  };

  // Mock viseme/amplitude extraction (M1 / M2 integration)
  // Since we aren't hooking native AudioContext easily in Expo without native modules,
  // we simulate the "speech energy" pulse while playing.
  // In a full M2 integration, we would read the Word-level timestamps JSON from the backend.
  const simulateLipSync = () => {
    if (!isPlaying) return;

    // Randomize scale to mimic speech energy/visemes
    const randomScale = 1 + (Math.random() * 0.05); // Subtle scale between 1 and 1.05
    const randomOpacity = 0.3 + (Math.random() * 0.5); 

    imageScale.value = withTiming(randomScale, { duration: 150 });
    glowOpacity.value = withTiming(randomOpacity, { duration: 150 });

    setTimeout(() => {
      if (isPlaying) simulateLipSync();
    }, 150);
  };

  // Reanimated styles
  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: imageScale.value + 0.05 }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Dynamic Glow indicating speech activity */}
      <Animated.View style={[styles.glowRing, animatedGlowStyle]} />
      
      <View style={styles.avatarWrapper}>
        <Canvas camera={{ position: [0, 0, 4.5], fov: 40 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[0, 4, 2]} intensity={1.5} color="#DFE2F3" />
          <pointLight position={[-3, 0, 0]} intensity={1.5} color="#3062FF" />
          <pointLight position={[3, 0, -1]} intensity={1} color="#E02424" />
          
          <Suspense fallback={null}>
            <RpmAvatar energy={imageScale} />
          </Suspense>
        </Canvas>
      </View>

      {/* Broadcast UI Overlays */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a', // Midnight Dispatch lowest surface
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 16,
  },
  glowRing: {
    position: 'absolute',
    width: '75%',
    height: '75%',
    borderRadius: 200,
    backgroundColor: '#3062FF', // Active broadcast pulse color
    filter: 'blur(20px)',
  },
  avatarWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1b1f2c', // surface container
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#E02424', // Urgent Red
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF9F8',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF9F8',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'sans-serif', // Replaced with Manrope/Inter if fonts loaded
    letterSpacing: 1,
  },
});