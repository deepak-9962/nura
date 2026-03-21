import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import AvatarPlayer from './src/components/AvatarPlayer';

export default function App() {
  // To use your exact image, you can download it to the apps/mobile/assets folder 
  // and pass source={require('./assets/your-avatar-image.png')} to the AvatarPlayer!

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NURA AI LIVE</Text>
        </View>

        {/* M1: Avatar Video Player */}
        {/* We use a placeholder audio URL here just to test the pulsing logic. 
            Once backend is bridged, it takes the actual TTS MP3. */}
        <AvatarPlayer 
          audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          isLive={true} 
        />

        {/* Breaking News Banner */}
        <View style={styles.breakingBanner}>
          <Text style={styles.breakingLabel}>BREAKING</Text>
          <Text style={styles.breakingText} numberOfLines={1}>
            Global Markets volatility detected amidst recent updates.
          </Text>
        </View>

        {/* News Cards (M5 Top Stories) */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>Top Stories</Text>

          {/* Example Card 1 */}
          <View style={styles.newsCard}>
            <Text style={styles.cardCategory}>WORLD</Text>
            <Text style={styles.cardHeadline}>International Trade Corridor Opens New Pathways</Text>
            <Text style={styles.cardSummary} numberOfLines={2}>
              New infrastructure gains regulatory approval resulting in sweeping economic shifts.
            </Text>
          </View>

          {/* Example Card 2 */}
          <View style={styles.newsCard}>
            <Text style={styles.cardCategory}>TECH</Text>
            <Text style={styles.cardHeadline}>AI System Deployed in Live Broadcast Environment</Text>
            <Text style={styles.cardSummary} numberOfLines={2}>
              A new React Native architecture successfully integrates lip-sync rendering on edge devices.
            </Text>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A', // Midnight Dispatch base surface
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#DFE2F3',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  breakingBanner: {
    marginTop: -8, // Slight overlap aesthetic for broadcast
    backgroundColor: '#E02424',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    zIndex: 10,
  },
  breakingLabel: {
    color: '#FFF9F8',
    fontWeight: '900',
    marginRight: 10,
    fontSize: 12,
    letterSpacing: 1,
  },
  breakingText: {
    color: '#FFF9F8',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  newsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#B7C4FF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  newsCard: {
    backgroundColor: '#1B1F2C', // Surface container
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3062FF',
  },
  cardCategory: {
    color: '#B7C4FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardHeadline: {
    color: '#DFE2F3',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardSummary: {
    color: '#C6C6C7', // Tertiary text
    fontSize: 14,
    lineHeight: 20,
  },
});
