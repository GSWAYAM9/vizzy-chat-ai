/**
 * Deep User Profile (DUP) Schema - DASP 1.2
 * This is the core data structure that powers all personalization in DASP
 * Stores user identity, aesthetics, emotions, interests, behavior, and creative identity
 * Format: Structured JSON with versioned schema
 */

import type { UUID } from 'crypto'

// Layer 1: Identity & Life Context
export interface IdentityLayer {
  name: string
  age?: number
  pronouns?: string
  location?: string
  timezone?: string
  livingSituation: 'solo' | 'partner' | 'family' | 'housemates'
  lifeStage: 'student' | 'professional' | 'parent' | 'retired' | 'creative' | 'founder' | 'other'
  culturalBackground?: string
  languagePreferences: string[]
  significantRelationships?: {
    name: string
    nature: string
  }[]
  currentLifeChapter: string
  lifeGoals: string[]
  longTermAspirations: string[]
}

// Layer 2: Aesthetic Profile
export interface AestheticProfile {
  visualStylePreferences: string[] // abstract, figurative, minimal, maximalist, surreal, organic, geometric
  colourPaletteAffinities: string[] // warm, cool, earthy, neon, monochrome, pastel, dark
  preferredArtists: string[]
  preferredArtMovements: string[]
  preferredPhotographyStyles: string[] // documentary, fineart, nature, urban, portrait
  typographyPreferences: string[] // serif, sans-serif, expressive, minimal
  musicGenrePreferences: string[]
  musicMoods: string[]
  interiorAestheticPreferences: string[]
  aestheticDislikes: string[] // explicitly excluded styles
  aestheticEvolutionLog: {
    timestamp: Date
    change: string
  }[]
}

// Layer 3: Emotional & Psychological Profile
export interface EmotionalProfile {
  currentEmotionalState?: string
  emotionalPatterns: {
    mood: string
    timeOfDay?: string
    dayOfWeek?: string
    triggers: string[]
  }[]
  emotionalNeeds: string[] // comfort, stimulation, calm, inspiration, joy
  energyLevelByTime: {
    timeRange: string // e.g., "6am-9am"
    energyLevel: number // 1-10
  }[]
  stressIndicators: string[]
  stressPatterns: string[]
  groundingVsActivating: {
    grounding: string[]
    activating: string[]
  }
  emotionalHistoryLog: {
    timestamp: Date
    state: string
    trigger?: string
    intensity: number // 1-10
  }[]
  sensitivityFlags: string[] // topics or content types to avoid
}

// Layer 4: Intellectual & Interest Profile
export interface IntellectualProfile {
  primaryIntellectualInterests: string[] // philosophy, science, technology, nature, history, literature
  secondaryInterests: string[]
  hobbies: string[]
  currentFocusAreas: string[]
  recentlyEngagedContent: {
    type: 'book' | 'film' | 'article' | 'podcast' | 'other'
    title: string
    date: Date
  }[]
  beliefSystems: string[]
  worldViews: string[]
  inspiringIdeas: string[]
}

// Layer 5: Behavioral & Contextual Profile
export interface BehavioralProfile {
  dailyRhythm: {
    wakeTime?: string
    sleepTime?: string
    workHours?: { start: string; end: string }
    mealPatterns?: string[]
  }
  weeklyPatterns: {
    gymDays?: string[]
    socialDays?: string[]
    workFromHome?: boolean
    officeLocation?: boolean
  }
  seasonalPatterns: {
    season: string
    behaviorChanges: string[]
    moodShifts: string[]
  }[]
  displayRoomContext: string // bedroom, livingroom, studio, office
  cohabitants?: {
    relationship: string
    frequencyInSpace: string
  }[]
  deviceUsagePatterns: string
  contentInteractionHistory: {
    contentId: string
    action: 'paused' | 'liked' | 'skipped' | 'dismissed' | 'saved'
    timestamp: Date
  }[]
}

// Layer 6: Creative Identity
export interface CreativeIdentity {
  isCreative: boolean
  creativeDisciplines?: string[] // painting, writing, music, design, photography
  creativeAspirations?: string[]
  currentProjects?: string[]
  whatSpaceSaysAboutThem?: string
  personalSymbols?: string[]
  recurringThemes?: string[]
  roleOfArtInLife: 'decorative' | 'emotional' | 'intellectual' | 'spiritual' | 'mixed'
}

// Main Deep User Profile Structure
export interface DeepUserProfile {
  // Metadata
  userId: UUID
  version: number
  schemaVersion: string // e.g., "1.2"
  createdAt: Date
  updatedAt: Date
  lastRefinedAt: Date

  // Privacy & Consent
  consentSettings: {
    hasConsented: boolean
    dataUsageConsent: boolean
    thirdPartyIntegrationConsent: boolean
    wearableDataConsent: boolean
    journalConnectionConsent: boolean
    musicConnectionConsent: boolean
  }

  // Profile Layers
  identity: IdentityLayer
  aesthetic: AestheticProfile
  emotional: EmotionalProfile
  intellectual: IntellectualProfile
  behavioral: BehavioralProfile
  creative: CreativeIdentity

  // System Fields
  profileCompleteness: number // 0-100, percentage of fields filled
  onboardingStatus: 'incomplete' | 'minimum' | 'complete' | 'extended'
  isActive: boolean

  // Connected Data Sources
  connectedDataSources: {
    spotify?: boolean
    journal?: {
      platform: string
      connected: boolean
    }
    calendar?: {
      platform: string
      connected: boolean
    }
    wearable?: {
      type: string // fitbit, apple_watch, oura_ring
      connected: boolean
    }
  }
}

// Profile Update Event (for refinement engine)
export interface ProfileUpdateEvent {
  userId: UUID
  timestamp: Date
  updateType: 'explicit' | 'implicit' | 'connected_data' | 'ai_synthesis'
  field: string
  oldValue: any
  newValue: any
  confidence: number // 0-1, how confident we are in this change
  source: string
  userApproved?: boolean
}

// Monthly Profile Summary (for user review)
export interface ProfileSummary {
  userId: UUID
  month: string
  keyInsights: string[]
  suggestedUpdates: {
    field: string
    suggestion: string
    confidence: number
  }[]
  emotionalTrends: string[]
  aestheticEvolution: string[]
  generatedAt: Date
}
