/**
 * System Card - DASP 1.2
 * A transparent declaration of what DASP is, what it does, and its boundaries
 * Based on the official Deckoviz documentation
 */

export const SYSTEM_CARD = {
  identity: {
    systemName: 'DASP',
    fullName: 'Deep Adaptive System Platform',
    version: '1.2',
    hostProduct: 'Deckoviz',
    platforms: ['SmartArtFrame', 'AndroidTV', 'Web', 'Mobile'],
    parentVision: 'SpaceLabs - emotionally intelligent technology for self-actualisation',
  },

  purpose: {
    primaryFunction: 'AI-powered personal content creation, curation, and contextual display',
    secondaryFunctions: [
      'Deep user modelling',
      'Agent orchestration',
      'Peripheral integration',
      'Ritual management',
      'Emotional resonance assessment',
    ],
  },

  operatingContext: {
    primaryUsers: 'Individual owner or household using a Deckoviz frame',
    environments: ['Bedroom', 'Living room', 'Studio', 'Office', 'Ambient display spaces'],
  },

  coreDesignPrinciples: {
    deepPersonalisation: 'Every output is shaped by a living model of the user. Generic content is a failure state.',
    proactiveIntelligence: 'The system acts on the user\'s behalf—creating, curating, and scheduling—without being asked.',
    emotionalResonance: 'Content is assessed not only for quality but for emotional fit with the user\'s current state and context.',
    privacyByDesign: 'The Deep User Profile is the system\'s most sensitive asset. All data flows are built around user consent and sovereignty.',
    gracefulDegradation: 'Every agent and sub-system must have a fallback. The system must function at reduced capability, never crash.',
    iterativeRefinement: 'Every interaction teaches the system more. The model of the user improves continuously.',
    unifiedChatInterface: 'All creation, curation, and control is accessible through a single, elegant chat interface: the Vizzy Creation Canvas.',
  },

  capabilities: {
    canDo: [
      'Generate original visual artwork, posters, and images personalised to the user',
      'Generate short-form video and animated visual sequences',
      'Generate and curate music, ambient audio, and soundscapes',
      'Learn and maintain a Deep User Profile from onboarding and ongoing interactions',
      'Proactively create content without explicit user instruction',
      'Proactively curate third-party content (art, photography, news, media) aligned to user taste',
      'Schedule and orchestrate display rituals—morning, evening, seasonal, emotional state-based',
      'Respond to natural language instructions via the Vizzy Creation Canvas chat interface',
      'Connect to external data sources: journals, calendars, wearables, newsfeeds, weather',
      'Coordinate multiple specialised AI agents in parallel or in sequence',
      'Support multiple Deckoviz frames across a home or space',
      'Adapt to household vs. individual display contexts',
    ],

    cannotDo: [
      'Generate or display content involving real individuals without explicit consent',
      'Access device cameras or microphones without user-initiated activation',
      'Share user data with third parties without explicit opt-in',
      'Operate without a valid user session and authenticated Deep User Profile',
      'Generate content that violates Deckoviz content policy',
      'Make autonomous decisions that override user preferences',
      'Store unencrypted sensitive user data',
    ],

    boundaries: [
      'DASP learns from user behaviour and external signals. The quality of outputs is dependent on the quality of the Deep User Profile.',
      'During early usage, outputs may not fully reflect user preferences. This improves rapidly over time.',
      'System functionality degrades gracefully when external APIs are unavailable.',
      'Content safety applies: All generative outputs pass through a content safety layer before display.',
      'Users can flag and remove content at any time.',
    ],
  },

  dataArchitecture: {
    inputs: [
      'Onboarding responses',
      'In-app interactions',
      'Connected journal entries',
      'Calendar events',
      'Wearable data (heart rate, sleep)',
      'Weather data',
      'Time of day',
      'User-initiated chat prompts',
    ],

    outputs: [
      'Visual artworks',
      'Posters',
      'Videos',
      'Audio tracks',
      'Curated content playlists',
      'Display schedules',
      'Ritual programmes',
    ],

    storage: [
      'Deep User Profile (encrypted, user-owned)',
      'Content history',
      'Interaction logs',
      'Agent outputs',
      'Profile version history (90-day retention)',
    ],

    externalAPIs: [
      'Image generation (Flux Pro, SDXL)',
      'Video generation (Runway Gen-3, Kling)',
      'Music generation (Suno, Udio)',
      'LLM backbone (Claude, GPT)',
      'News/weather/content feeds',
      'Spotify/music platforms',
      'Journal platforms (DayOne, Notion)',
      'Calendar providers (Google, Apple, Outlook)',
      'Wearable APIs (Fitbit, Apple Health, Oura)',
    ],
  },

  riskAndResponsibility: {
    contentSafety: {
      description: 'All generative outputs pass through a content safety layer before display',
      mechanism: 'Safety classifier + user override capability',
      userControl: 'Users can flag and remove content at any time',
    },

    dataSensitivity: {
      description: 'The Deep User Profile contains emotionally sensitive data',
      protections: [
        'Stored encrypted',
        'Never used for advertising',
        'Never sold to third parties',
        'User consent required for all data uses',
      ],
    },

    autonomy: {
      description: 'Users maintain full control over system behaviour',
      capabilities: [
        'Pause all proactive behaviour at any time',
        'System can operate in fully manual mode',
        'Manual mode: All creation requires explicit user instruction',
        'Full opt-out available for any feature',
      ],
    },

    childrenAndSharedSpaces: {
      householdMode: 'Applies conservative content filter',
      individualProfiles: 'Not shared across users without explicit consent',
      parentalControls: 'Available for household contexts',
    },

    regulatoryCompliance: {
      GDPR: 'Full compliance with data subject rights',
      CCPA: 'Full compliance with California privacy requirements',
      childSafety: 'Content policies protect minors',
      accessibility: 'WCAG 2.1 AA compliance target',
    },
  },

  agentNetwork: {
    agents: [
      {
        name: 'Vizzy Visual Agent (VVA)',
        capability: 'Generates original visual artworks and compositions',
        models: ['Flux Pro', 'SDXL'],
      },
      {
        name: 'Vizzy Poster & Typography Agent (VPTA)',
        capability: 'Generates designed posters, quote cards, and typographic layouts',
        models: ['LLM for text generation', 'Image generation for layout'],
      },
      {
        name: 'Vizzy Video & Motion Agent (VVMA)',
        capability: 'Generates short-form videos and animated sequences',
        models: ['Runway Gen-3', 'Kling'],
      },
      {
        name: 'Vizzy Music & Audio Agent (VMAA)',
        capability: 'Generates original music, soundscapes, and audio atmospheres',
        models: ['Suno', 'Udio'],
      },
      {
        name: 'Vizzy Curation Agent (VCA)',
        capability: 'Discovers and surfaces third-party content aligned to user profile',
        sources: ['Artsy', 'Unsplash', 'Museum APIs', 'Photography collections'],
      },
      {
        name: 'Vizzy Narrative & Context Agent (VNCA)',
        capability: 'Generates contextual narratives and meaning-layers for content',
        outputs: ['Poetic descriptions', 'Creator notes', 'Contextual information'],
      },
      {
        name: 'DASP Orchestrator (DO)',
        capability: 'Coordinates all other agents on behalf of DASP',
        role: 'Master coordinator (not user-facing)',
      },
    ],
  },

  performanceTargets: {
    responseTime: {
      simpleVisualRequest: '10-20 seconds',
      complexMultiElementRequest: '30-45 seconds',
      iterativeRefinement: '5-10 seconds',
    },

    qualityMetrics: {
      emotionalResonance: 'Scored by user feedback (target: >70% resonance rating)',
      aestheticAccuracy: 'Alignment with user aesthetic profile (target: >80%)',
      contentSafety: 'False positive rate <5%, false negative rate <2%',
      uptimeTarget: '99.5% availability',
    },
  },

  versioning: {
    currentVersion: '1.2',
    releaseDate: 'Q1 2024',
    roadmap: {
      v1.3: 'Enhanced emotional modelling, real-time wearable integration',
      v1.4: 'Multi-frame household coordination, social features',
      v2.0: 'Advanced generative capabilities, voice interface',
    },
  },
}

// Helper function to get capability description
export function getCapabilityDescription(capabilityName: string): string | undefined {
  return SYSTEM_CARD.capabilities.canDo.find(c =>
    c.toLowerCase().includes(capabilityName.toLowerCase())
  )
}

// Helper function to check if operation is within boundaries
export function isOperationAllowed(operation: string): boolean {
  const disallowed = SYSTEM_CARD.capabilities.cannotDo.some(c =>
    operation.toLowerCase().includes(c.toLowerCase())
  )
  return !disallowed
}

// Export for runtime checks
export const DASP_VERSION = SYSTEM_CARD.identity.version
export const DASP_NAME = SYSTEM_CARD.identity.fullName
