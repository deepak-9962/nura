# PRODUCT REQUIREMENTS DOCUMENT
## AI News Anchor — Real-Time, Synchronized, and Trustworthy Broadcast

**Nura AI Labs Hackathon | Problem Statement 3**
**Platform: React Native (iOS + Android)**
**Version 1.0 | March 2026**

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Architecture](#2-system-architecture)
3. [Feature Specifications by Milestone](#3-feature-specifications-by-milestone)
   - [M1 — Avatar Speech Playback](#m1--avatar-speech-playback)
   - [M2 — High-Precision Lip Sync](#m2--high-precision-lip-sync)
   - [M3 — Live News Ingestion with Reliability Awareness](#m3--live-news-ingestion-with-reliability-awareness)
   - [M4 — News De-duplication & Event Linking](#m4--news-de-duplication--event-linking)
   - [M5 — Importance Ranking Under Ambiguity](#m5--importance-ranking-under-ambiguity)
   - [M6 — Speech-Aware Tamil Script Generation](#m6--speech-aware-tamil-script-generation)
   - [M7 — Controlled Tamil Audio Generation](#m7--controlled-tamil-audio-generation)
   - [M8 — Continuous News Broadcast System](#m8--continuous-news-broadcast-system)
4. [React Native Implementation Guide](#4-react-native-implementation-guide)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Testing Requirements](#6-testing-requirements)
7. [Milestone Delivery Plan](#7-milestone-delivery-plan)
8. [Glossary](#8-glossary)

---

## 1. Product Overview

This PRD defines the complete requirements for building an AI-powered Tamil News Anchor application using React Native. The system ingests live news, processes it into Tamil language scripts, generates broadcast-quality audio, and presents delivery through a synchronized digital avatar — all within a mobile application.

The product is designed for a hackathon context and must be implemented end-to-end, from news ingestion through avatar video output. Every milestone in the problem statement maps to a discrete feature module described in this document.

### 1.1 Vision Statement

Deliver a fully autonomous, continuously broadcasting Tamil AI news anchor that runs on React Native — credible, coherent, synchronized, and trustworthy.

### 1.2 Key Design Principles

- **Credibility:** All content must be verifiable, source-attributed, and reliability-scored.
- **Coherence:** News scripts must flow naturally as spoken Tamil, not translated text.
- **Synchronization:** Avatar lip movement must match audio output with no perceptible lag.
- **Continuity:** The system must run continuously, avoid repetition, and handle breaking news.
- **Modularity:** Each milestone is a self-contained module with a defined interface.

### 1.3 Platform

| Attribute | Value |
|---|---|
| Framework | React Native (Expo or bare workflow) |
| Target Platforms | iOS 15+ and Android 12+ |
| Language (UI) | TypeScript |
| Minimum Node | 18.x LTS |
| State Management | Zustand or Redux Toolkit |
| API Communication | REST + WebSocket for live updates |
| Video Rendering | expo-av / react-native-video |
| Audio Output | expo-av or react-native-sound |

---

## 2. System Architecture

The system is organized as an eight-module pipeline. Each module receives a well-defined input and produces a well-defined output. The React Native app acts as both orchestrator and rendering layer.

### 2.1 High-Level Pipeline

| # | Module | Input | Output |
|---|---|---|---|
| M1 | Avatar Renderer | Audio file (.mp3/.wav) | Video with lip-sync |
| M2 | Lip Sync Engine | Phoneme-timestamped audio | Mouth shape keyframes |
| M3 | News Ingestion | RSS / APIs / Web | Normalized article JSON |
| M4 | De-duplication | Normalized articles | Clustered event objects |
| M5 | Importance Ranker | Event clusters | Top-5 ranked events |
| M6 | Script Generator | Top-5 events | Tamil broadcast script |
| M7 | TTS Audio Engine | Tamil script text | MP3 audio + timestamps |
| M8 | Broadcast Loop | All modules | Live video + UI feed |

### 2.2 Data Flow

```
News Sources (RSS/API)
  --> [M3 Ingestion] --> Raw JSON
  --> [M4 De-dup] --> Event Clusters
  --> [M5 Ranker] --> Top 5
  --> [M6 Script Gen] --> Tamil Script
  --> [M7 TTS] --> Audio + Timestamps
  --> [M2 Lip Sync] --> Keyframes
  --> [M1 Avatar Renderer] --> Video
  --> [M8 Broadcast Loop] --> React Native UI
```

### 2.3 Backend vs On-Device Split

| Backend Service (Node.js / Python) | React Native (On-Device) |
|---|---|
| News ingestion & normalization (M3) | Video playback (M1 render output) |
| De-duplication & clustering (M4) | Real-time broadcast UI (M8) |
| Importance ranking (M5) | User settings & preferences |
| Tamil script generation (M6) | Push notification for breaking news |
| TTS audio generation (M7) | Offline caching of last broadcast |
| Lip sync keyframe export (M2) | Live feed polling / WebSocket client |

---

## 3. Feature Specifications by Milestone

---

### M1 — Avatar Speech Playback

#### 3.1.1 Functional Requirements

- The app must render a 2D or 3D digital avatar with a visible face, including animated mouth region.
- The avatar must accept a local or remote .mp3 / .wav audio URL and begin playback.
- Mouth open/close animation must be driven by audio amplitude in real time.
- Output video must be at minimum 480p, 30fps, in MP4 or WebM format.
- Rendering must be stable: no dropped frames exceeding 100ms under normal device load.

#### 3.1.2 Non-Functional Requirements

- Initial frame must render within 1 second of audio start.
- Audio-to-visual lag must not exceed 80ms.

#### 3.1.3 Recommended Libraries

- **Avatar:** Three.js via expo-gl, or a pre-built avatar SDK such as D-ID API or HeyGen embed.
- **Audio analysis:** expo-av with metering enabled, or Web Audio API via react-native-webview.
- **Fallback:** Lottie animation driven by audio amplitude if full 3D is out of scope.

#### 3.1.4 Acceptance Criteria

1. Load any local audio file and see avatar mouth move in sync.
2. Video output plays without stuttering on a mid-range Android device (Snapdragon 695 class).
3. No lip movement occurs during silent periods.

---

### M2 — High-Precision Lip Sync

#### 3.2.1 Functional Requirements

- Audio must be analyzed at phoneme or viseme level, not just amplitude.
- Each viseme must be tagged with a start and end timestamp in milliseconds.
- Avatar must render distinct mouth shapes for key Tamil phoneme groups (open, mid-open, rounded, closed, fricative).
- System must handle: varying speech speeds (0.7x–1.5x), deliberate pauses > 500ms, emphasis/stress.
- During silence or noise-only segments, avatar mouth must be closed.

#### 3.2.2 Viseme Mapping Table (Minimum Required)

| Viseme ID | Mouth Shape | Example Phonemes |
|---|---|---|
| V0 | Closed / Rest | silence, m, b, p |
| V1 | Slightly Open | n, d, t, l |
| V2 | Mid Open | e, i, ee |
| V3 | Open | a, aa, o |
| V4 | Rounded | oo, u, uu |
| V5 | Teeth / Fricative | s, sh, z, zh |

#### 3.2.3 Recommended Tools

- **Whisper (OpenAI)** with word-level timestamps for phoneme approximation.
- **CMU Pronouncing Dictionary** lookup for English transliterations.
- **rhubarb-lip-sync** (open source) — outputs viseme JSON from audio if running locally.
- **Azure Cognitive Services Speech SDK** — provides built-in viseme events for supported languages.

#### 3.2.4 Acceptance Criteria

1. Viseme JSON is generated for a 2-minute audio clip within 10 seconds.
2. Mouth shape changes at least 15 distinct times per 10 seconds of continuous speech.
3. No visible mouth movement during 300ms+ silence segments.

---

### M3 — Live News Ingestion with Reliability Awareness

#### 3.3.1 Functional Requirements

- Fetch news from a minimum of 3 distinct source types: RSS feed, public API, and web scrape.
- Normalize all articles into a unified ArticleSchema (see below).
- Assign a reliability score (0–100) to each source based on a configurable trust registry.
- Fetch cycle: poll every 5 minutes in background. On foreground resume, trigger immediate fetch.
- Handle conflicting information: flag articles that contradict a fact already stored.

#### 3.3.2 ArticleSchema

| Field | Type | Description |
|---|---|---|
| id | string (uuid) | Unique hash of (url + publishedAt) |
| title | string | Original headline |
| body | string | Full article text (truncated to 2000 chars) |
| source | string | Source name (e.g. 'The Hindu') |
| sourceUrl | string | Source homepage URL |
| articleUrl | string | Direct article URL |
| publishedAt | ISO 8601 string | Publication timestamp |
| fetchedAt | ISO 8601 string | When this system fetched it |
| category | string enum | POLITICS \| BUSINESS \| TECH \| SPORTS \| HEALTH \| WORLD \| LOCAL |
| reliabilityScore | number 0–100 | Trust score of the source |
| language | string | ISO 639-1 code (e.g. 'en', 'ta') |
| conflictFlag | boolean | True if contradicts existing event |

#### 3.3.3 Suggested Tamil News Sources

- **RSS:** Dinamalar, Vikatan, Puthiyathalaimurai (Tamil RSS feeds)
- **API:** NewsAPI.org (English, free tier), GNews API
- **Web:** BBC Tamil (https://www.bbc.com/tamil), The Hindu Tamil section

#### 3.3.4 Acceptance Criteria

1. At least 20 articles ingested within 60 seconds of app first launch.
2. All articles conform to ArticleSchema with no undefined fields.
3. Reliability score is present and non-zero for every article.

---

### M4 — News De-duplication & Event Linking

#### 3.4.1 Functional Requirements

- Detect semantically similar articles (not just keyword matches) and merge them into a single NewsEvent.
- A NewsEvent groups 1–N articles covering the same real-world occurrence.
- When a new article arrives that matches an existing event, update the event (do not create a new one).
- Track version history of each event so the script generator can highlight 'updates'.
- Resolve minor factual discrepancies by preferring the highest-reliability source.

#### 3.4.2 NewsEvent Schema

| Field | Type | Description |
|---|---|---|
| eventId | string (uuid) | Stable ID across updates |
| headline | string | Best representative headline |
| summary | string | 3–5 sentence factual summary |
| articles | ArticleRef[] | List of contributing article IDs |
| category | string enum | Same as ArticleSchema |
| firstSeenAt | ISO 8601 | When event was first ingested |
| lastUpdatedAt | ISO 8601 | When event last received a new article |
| versionCount | number | How many times this event was updated |
| isBreaking | boolean | Flagged as breaking news |
| avgReliability | number 0–100 | Mean reliability of contributing sources |

#### 3.4.3 De-duplication Algorithm

1. Compute TF-IDF or sentence embedding for each article title + body.
2. Compare cosine similarity against all existing event summaries.
3. If similarity >= 0.75, assign article to matching event; else create new event.
4. Re-compute event summary using extractive summarization of all contributing articles.
5. Recommended: Use Claude API (claude-sonnet) for semantic similarity and summarization to meet hackathon speed requirements.

#### 3.4.4 Acceptance Criteria

1. Same news story covered by 3 sources produces exactly 1 event, not 3.
2. An update to an existing story increments versionCount, does not create a new event.
3. De-duplication runs within 2 seconds for a batch of 50 articles.

---

### M5 — Importance Ranking Under Ambiguity

#### 3.5.1 Functional Requirements

- Score each NewsEvent on a composite importance scale (0–1).
- Select the top 5 events for broadcast, ensuring category diversity.
- No more than 2 events from the same category in any top-5 selection.
- Ranking must balance recency and significance — a 1-hour-old major event beats a 5-minute minor update.

#### 3.5.2 Ranking Formula

```
ImportanceScore = (0.35 × RecencyScore)
                + (0.30 × ReliabilityScore)
                + (0.25 × FrequencyScore)
                + (0.10 × BreakingBonus)
```

| Factor | Calculation |
|---|---|
| RecencyScore | Decay function: 1 / (1 + hours_since_first_seen). Max 1.0 at t=0. |
| ReliabilityScore | avgReliability / 100 |
| FrequencyScore | min(articleCount / 10, 1.0) — capped at 10 sources |
| BreakingBonus | 1.0 if isBreaking, 0.0 otherwise |

#### 3.5.3 Diversity Enforcement

1. Sort all events by ImportanceScore descending.
2. Iterate through sorted list, greedily selecting events.
3. Skip an event if its category already has 2 selections in the current top-5.
4. If fewer than 5 events exist, select all available.

#### 3.5.4 Acceptance Criteria

1. Top-5 list is produced within 500ms for a pool of up to 200 events.
2. Category distribution: at most 2 events per category in any given broadcast cycle.
3. Breaking news with isBreaking=true always appears in top-5 unless 5 breaking events already selected.

---

### M6 — Speech-Aware Tamil Script Generation

#### 3.6.1 Functional Requirements

- Generate a fully spoken Tamil script from the top-5 ranked events.
- Script must include: opening greeting, story segments (one per event), transitions, and closing statement.
- Total spoken duration must be approximately 120 seconds (target word count: 300–360 Tamil words at average reading speed).
- Adjust dynamically: if initial generation is < 90s worth, expand with context; if > 150s worth, compress.
- Avoid transliteration artifacts — script must be pure Tamil Unicode suitable for TTS.

#### 3.6.2 Script Template Structure

| Section | Duration (s) | Content Guidelines |
|---|---|---|
| Opening Greeting | ~8s | Formal news anchor greeting in Tamil. Include time of day. |
| Story 1 (Top story) | ~30s | Most important event. Slightly longer treatment. |
| Transition 1→2 | ~3s | Natural spoken bridge phrase. |
| Story 2 | ~20s | Second ranked event. |
| Transition 2→3 | ~3s | Natural spoken bridge phrase. |
| Stories 3, 4, 5 | ~15s each | Briefer treatment for lower-ranked stories. |
| Closing Statement | ~8s | Formal sign-off with channel/program name. |

#### 3.6.3 LLM Prompt Engineering Requirements

- System prompt must specify: Tamil language only, formal news register, spoken delivery style.
- Include example transitions as few-shot examples in the prompt.
- Request word count estimate alongside script to enable duration validation.
- If duration constraint fails on first attempt, pass the word count back and request expansion/compression.

#### 3.6.4 Recommended Stack

- **Primary:** Claude API (claude-sonnet) — strong Tamil language support, fast generation.
- **Fallback:** Google Gemini 1.5 Flash (Tamil support, generous free tier for hackathon).

#### 3.6.5 Acceptance Criteria

1. Generated script is entirely in Tamil Unicode characters (no ASCII fallback words).
2. Script word count falls between 280–400 Tamil words.
3. All 5 story topics are covered in the script.
4. Script does not repeat the same sentence or phrase within a single broadcast.

---

### M7 — Controlled Tamil Audio Generation

#### 3.7.1 Functional Requirements

- Convert the Tamil script to audio using a neural TTS engine with Tamil voice support.
- Voice must sound like a broadcast news anchor: formal, measured pace (140–160 WPM), minimal artifacts.
- Output format: MP3 at 44.1kHz, stereo, 128kbps minimum. Also export word-level timestamp JSON alongside the audio.
- Handle quality checks: reject audio where silence exceeds 5 consecutive seconds (TTS failure indicator).

#### 3.7.2 TTS Vendor Comparison

| Vendor | Tamil Voice | Timestamps | Notes |
|---|---|---|---|
| Google Cloud TTS | Yes (WaveNet) | Yes (SSML marks) | Best quality; free tier limited |
| Azure Cognitive Services | Yes (Neural) | Yes (viseme events) | Viseme events built-in — ideal for M2 integration |
| ElevenLabs | Partial (custom clone) | Yes | High quality; requires paid plan for Tamil |
| Amazon Polly | Yes (Standard) | Yes (speech marks) | Reliable; Tamil voice less natural |
| OpenAI TTS | No Tamil | No | Not suitable for this milestone |

#### 3.7.3 SSML Requirements

- Wrap script in SSML tags to control prosody.
- Use `<break time='500ms'/>` between major story transitions.
- Use `<emphasis level='moderate'>` for headline keywords.
- Set global speaking rate to 0.95 (slightly slower than default for clarity).

#### 3.7.4 Acceptance Criteria

1. Audio duration is between 100–140 seconds for a 2-minute script.
2. Word-level timestamp JSON is produced alongside the audio file.
3. No robotic artifacts audible on Apple AirPods or standard phone speaker.
4. Audio file size does not exceed 4MB (for mobile streaming efficiency).

---

### M8 — Continuous News Broadcast System

#### 3.8.1 Functional Requirements

- Orchestrate all modules (M3–M7) into a repeating broadcast loop.
- Broadcast cycle: Ingest → De-dup → Rank → Script → TTS → Lip Sync → Render → Playback.
- Cycle interval: Every 30 minutes under normal conditions.
- Breaking news override: If isBreaking event arrives during playback, queue it for next cycle start within 5 minutes.
- Do not repeat any event that was broadcast in the last 3 cycles unless it has been updated (versionCount increased).
- Maintain a broadcast log of all delivered events with timestamps.

#### 3.8.2 Broadcast State Machine

| State | Trigger | Action |
|---|---|---|
| IDLE | App launch / cycle end | Begin news ingestion |
| INGESTING | Fetch complete | Run de-dup and ranking |
| SCRIPTING | Top-5 selected | Generate Tamil script via LLM |
| SYNTHESIZING | Script ready | Call TTS, generate audio + timestamps |
| RENDERING | Audio + timestamps ready | Generate lip sync keyframes, render avatar video |
| BROADCASTING | Video ready | Play video in UI, stream to user |
| BREAKING_ALERT | isBreaking event detected | Inject alert banner; queue early next cycle |
| ERROR | Any module failure | Log error, skip failed module, attempt fallback or skip cycle |

#### 3.8.3 UI Requirements

- **Video player:** Full-screen or large-card avatar video, auto-play on mute (optional sound toggle).
- **Ticker:** Scrolling news headlines at bottom of screen, sourced from top-5 list.
- **Story cards:** Below the video, display 5 tappable cards for current broadcast stories.
- **Status indicator:** Small badge showing current broadcast state (LIVE / UPDATING / ERROR).
- **Breaking news banner:** Red banner overlay when isBreaking event queued.
- **Last updated timestamp:** Visible in UI header.

#### 3.8.4 Acceptance Criteria

1. System completes a full cycle (M3 through M8) within 3 minutes on a stable connection.
2. No story is repeated in two consecutive broadcast cycles without being updated.
3. Breaking news appears in the next cycle within 5 minutes of detection.
4. App recovers from a single-module failure without crashing — graceful error state.
5. Broadcast log persists across app restarts (AsyncStorage or SQLite).

---

## 4. React Native Implementation Guide

### 4.1 Project Structure

```
/src
  api/              — all external API clients (newsApi.ts, ttsApi.ts, llmApi.ts)
  modules/
    ingestion/      — M3: news fetching & normalization
    dedup/          — M4: de-duplication & event clustering
    ranker/         — M5: importance scoring & top-5 selection
    scriptGen/      — M6: Tamil script generation via LLM
    tts/            — M7: TTS audio generation & SSML
    lipSync/        — M2: viseme extraction & keyframe export
    avatar/         — M1: avatar rendering & animation
    broadcast/      — M8: orchestration loop & state machine
  store/
    broadcastStore.ts
    newsStore.ts
  screens/
    BroadcastScreen.tsx
    SettingsScreen.tsx
    HistoryScreen.tsx
  components/
    AvatarPlayer.tsx
    NewsTicker.tsx
    StoryCard.tsx
    BreakingBanner.tsx
  utils/
    timing.ts
    reliability.ts
    scriptValidator.ts
  hooks/
    useBroadcastLoop.ts
    useNewsEvents.ts
  types/
    article.types.ts
    event.types.ts
    broadcast.types.ts
```

### 4.2 Core Dependencies

| Package | Version | Purpose |
|---|---|---|
| expo-av | ^14.x | Audio playback, metering for lip sync |
| react-native-video | ^6.x | Avatar video playback |
| zustand | ^4.x | Global state management |
| expo-background-fetch | ^12.x | Background news polling |
| @react-native-async-storage/async-storage | ^1.x | Broadcast log persistence |
| react-native-reanimated | ^3.x | Smooth avatar mouth animations |
| expo-three / expo-gl | latest | 3D avatar rendering (optional) |
| lottie-react-native | ^6.x | 2D animated avatar fallback |
| axios | ^1.x | HTTP client for news APIs / TTS |
| rss-parser (backend) | ^3.x | RSS feed parsing (Node.js backend) |

### 4.3 Key Implementation Patterns

#### 4.3.1 Broadcast Loop Hook

Implement a `useBroadcastLoop` React hook that manages the broadcast state machine. The hook should expose: `currentState`, `currentBroadcast`, `triggerCycle()`, and `skipToNext()`. Use `useEffect` with cleanup to prevent memory leaks. Schedule cycles with a ref-stored `setTimeout` to allow cancellation on breaking news.

```typescript
const useBroadcastLoop = () => {
  const [state, setState] = useState<BroadcastState>('IDLE');
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCycle = useCallback(async () => {
    setState('INGESTING');
    const articles = await ingestNews();
    const events = await deduplicateEvents(articles);
    const top5 = await rankEvents(events);
    setState('SCRIPTING');
    const script = await generateTamilScript(top5);
    setState('SYNTHESIZING');
    const { audioUrl, timestamps } = await generateAudio(script);
    setState('RENDERING');
    const videoUrl = await renderAvatarVideo(audioUrl, timestamps);
    setState('BROADCASTING');
    setCurrentBroadcast({ videoUrl, top5 });
    cycleTimerRef.current = setTimeout(triggerCycle, 30 * 60 * 1000);
  }, []);

  useEffect(() => {
    triggerCycle();
    return () => { if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current); };
  }, []);

  return { state, currentBroadcast, triggerCycle };
};
```

#### 4.3.2 Avatar Lip Sync Pattern

Use the viseme JSON from M2 and a `useAnimatedStyle` hook from react-native-reanimated. Map each viseme ID to a mouth shape scale value (e.g., V3 Open = scaleY 1.4). Use `withTiming` transitions of 80ms between shapes. Drive the animation by comparing `Audio.getStatusAsync()` position against the viseme timestamp array.

```typescript
const getMouthScale = (visemeId: string): number => {
  const map: Record<string, number> = {
    V0: 1.0, V1: 1.1, V2: 1.2, V3: 1.4, V4: 1.25, V5: 1.15
  };
  return map[visemeId] ?? 1.0;
};

// In your animation loop:
const currentViseme = visemes.find(v =>
  audioPosition >= v.startMs && audioPosition <= v.endMs
);
mouthScale.value = withTiming(getMouthScale(currentViseme?.id ?? 'V0'), { duration: 80 });
```

#### 4.3.3 Backend Communication

All heavy pipeline work (M3–M7) should run on a small Node.js or Python backend. The React Native app calls:

- `GET /api/broadcast/current` — returns latest video URL + metadata
- `POST /api/broadcast/trigger` — requests an early refresh
- `GET /api/broadcast/events` — returns current top-5 event summaries

Use Server-Sent Events (SSE) or WebSocket to push broadcast state changes to the client without polling.

```typescript
// SSE client in React Native
const eventSource = new EventSource(`${API_BASE}/api/broadcast/stream`);
eventSource.addEventListener('state_change', (e) => {
  const { state, broadcastId } = JSON.parse(e.data);
  broadcastStore.setState(state);
});
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Full broadcast cycle (M3–M8): complete within 180 seconds on stable 4G connection.
- App launch to first video frame: under 3 seconds on mid-range device.
- Audio-to-viseme lag: under 80ms.
- News ingestion API response timeout: 10 seconds per source.

### 5.2 Reliability

- If any single module fails, the system must log the error, display a fallback UI, and attempt retry within 60 seconds.
- Network unavailability: serve the last successfully generated broadcast from local cache.
- TTS failure: fall back to text display of the Tamil script.

### 5.3 Security

- All API keys (news APIs, LLM, TTS) must be stored in environment variables — never hardcoded.
- Use HTTPS for all external API calls.
- No user PII is collected or stored.

### 5.4 Accessibility

- Tamil subtitles must be displayed below the avatar video during playback.
- Font size minimum 14sp for subtitle text.
- App must support Dynamic Type scaling on iOS.

---

## 6. Testing Requirements

### 6.1 Unit Tests

- **NewsIngestion:** mock API responses, verify ArticleSchema conformance.
- **DeDuplication:** feed 10 near-duplicate articles, verify single event output.
- **Ranker:** verify top-5 selection with correct category diversity under edge cases (all same category).
- **ScriptValidator:** verify word count, Tamil Unicode check, section presence.

### 6.2 Integration Tests

- Full pipeline smoke test: trigger cycle, verify video URL produced within 3 minutes.
- Breaking news injection: set isBreaking flag, verify next cycle triggers within 5 minutes.
- Repeat prevention: run 4 cycles, verify no event repeated in cycle 4 that appeared in cycles 1–3 without update.

### 6.3 Device Tests

- Test avatar video playback on: iOS simulator, Android emulator, physical Android device.
- Test audio playback with phone speaker and Bluetooth headphones.
- Test background fetch: minimize app for 6 minutes, re-open, verify cycle ran.

---

## 7. Milestone Delivery Plan

| MS | Milestone | Key Deliverable | Priority |
|---|---|---|---|
| M1 | Avatar Speech Playback | Avatar renders with basic lip sync | P0 — Core hook |
| M3 | News Ingestion | 20+ normalized articles fetched | P0 — Data pipeline start |
| M6 | Tamil Script Generation | 2-min Tamil script from top stories | P0 — Language core |
| M7 | TTS Audio | Broadcast-quality Tamil audio file | P0 — Audio output |
| M4 | De-duplication | Events clustered correctly | P1 |
| M5 | Importance Ranking | Diverse top-5 list | P1 |
| M2 | High-Precision Lip Sync | Phoneme-aligned mouth animation | P1 |
| M8 | Continuous Broadcast Loop | Full auto-cycling system | P2 — Integration |

> **Recommended build order for hackathon:** M3 → M6 → M7 → M1 → M4 → M5 → M2 → M8
>
> This ensures you have a working end-to-end demo (data → script → audio → avatar) as early as possible, with precision and polish added in later passes.

---

## 8. Glossary

| Term | Definition |
|---|---|
| Viseme | A visual representation of a phoneme — the mouth shape position corresponding to a sound. |
| Phoneme | The smallest unit of sound in speech. E.g., the word 'cat' has 3 phonemes: /k/, /æ/, /t/. |
| TTS | Text-to-Speech — software that synthesizes spoken audio from written text. |
| SSML | Speech Synthesis Markup Language — XML-based format to control TTS prosody, pacing, and pauses. |
| RSS | Really Simple Syndication — XML-based web feed format used by news sites to publish headlines. |
| ArticleSchema | The normalized JSON structure used internally to represent a single news article. |
| NewsEvent | A de-duplicated cluster of articles covering the same real-world story. |
| ImportanceScore | Composite score (0–1) used to rank NewsEvents for broadcast selection. |
| Broadcast Cycle | One complete run of the pipeline: ingest → script → audio → video → playback. |
| Breaking News Override | An interrupt mechanism that triggers an early broadcast cycle when a high-priority event arrives. |

---

*AI News Anchor PRD | Nura AI Labs Hackathon | v1.0 | March 2026*
