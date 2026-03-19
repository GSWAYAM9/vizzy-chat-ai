/**
 * DASP Onboarding Flow Types - DASP 1.2
 * Defines the conversational onboarding experience
 * Estimated completion: 8-12 minutes
 * Covers: Aesthetic taste, life context, emotional needs, frame intent
 */

export type OnboardingStage = 
  | 'welcome'
  | 'aesthetic_visual_style'
  | 'aesthetic_color'
  | 'aesthetic_artists'
  | 'identity_basic'
  | 'identity_life_stage'
  | 'identity_goals'
  | 'emotional_state'
  | 'emotional_needs'
  | 'intellectual_interests'
  | 'behavioral_context'
  | 'creative_identity'
  | 'frame_intent'
  | 'consent'
  | 'complete'

export interface OnboardingStep {
  stage: OnboardingStage
  title: string
  description: string
  estimatedDuration: number // in seconds
  inputType: 'images' | 'text' | 'selection' | 'slider' | 'toggle' | 'multiselect'
  question: string
  helpText?: string
  options?: {
    label: string
    value: string
    description?: string
    icon?: string
  }[]
  imageGallery?: {
    category: string
    images: {
      id: string
      url: string
      label: string
    }[]
  }
  required: boolean
  fieldMap: string // which Deep User Profile field this maps to
  nextStage?: OnboardingStage
  skipAllowed: boolean
}

export interface OnboardingSession {
  userId: string
  sessionId: string
  startedAt: Date
  completedAt?: Date
  currentStage: OnboardingStage
  stagesCompleted: OnboardingStage[]
  responses: {
    stage: OnboardingStage
    answer: any
    timestamp: Date
  }[]
  profileCompleteness: number
  isMinimumViable: boolean
}

export const ONBOARDING_FLOW: OnboardingStep[] = [
  {
    stage: 'welcome',
    title: 'Welcome to Deckoviz',
    description: 'Let\'s get to know you so we can create deeply personal content',
    estimatedDuration: 30,
    inputType: 'text',
    question: 'What\'s your name?',
    helpText: 'We\'ll use this to personalize your experience',
    required: true,
    fieldMap: 'identity.name',
    skipAllowed: false,
    nextStage: 'aesthetic_visual_style',
  },

  {
    stage: 'aesthetic_visual_style',
    title: 'Your Visual Aesthetic',
    description: 'Let\'s explore the visual styles that resonate with you',
    estimatedDuration: 60,
    inputType: 'images',
    question: 'Which of these visual styles appeal to you? (Select at least 2)',
    helpText: 'Choose images that make you feel something. There are no wrong answers.',
    imageGallery: {
      category: 'visual_styles',
      images: [
        { id: 'abstract', url: '/onboarding/abstract.jpg', label: 'Abstract & Geometric' },
        { id: 'figurative', url: '/onboarding/figurative.jpg', label: 'Figurative & Representational' },
        { id: 'minimal', url: '/onboarding/minimal.jpg', label: 'Minimal & Clean' },
        { id: 'maximalist', url: '/onboarding/maximalist.jpg', label: 'Maximalist & Ornate' },
        { id: 'surreal', url: '/onboarding/surreal.jpg', label: 'Surreal & Dreamlike' },
        { id: 'organic', url: '/onboarding/organic.jpg', label: 'Organic & Nature-inspired' },
        { id: 'geometric', url: '/onboarding/geometric.jpg', label: 'Geometric & Structured' },
        { id: 'photorealistic', url: '/onboarding/photorealistic.jpg', label: 'Photorealistic' },
      ],
    },
    required: true,
    fieldMap: 'aesthetic.visualStylePreferences',
    skipAllowed: false,
    nextStage: 'aesthetic_color',
  },

  {
    stage: 'aesthetic_color',
    title: 'Your Color Palette',
    description: 'What color atmospheres draw you in?',
    estimatedDuration: 45,
    inputType: 'selection',
    question: 'Which color palettes resonate with you? (Select 1-3)',
    helpText: 'Think about the moods these colors create for you',
    options: [
      { label: 'Warm & Earthy', value: 'warm', description: 'Oranges, terracottas, warm browns' },
      { label: 'Cool & Serene', value: 'cool', description: 'Blues, teals, cool greens' },
      { label: 'Bold & Neon', value: 'neon', description: 'Vibrant, electric colors' },
      { label: 'Monochrome', value: 'monochrome', description: 'Black, white, grays' },
      { label: 'Pastel & Soft', value: 'pastel', description: 'Soft, muted colors' },
      { label: 'Dark & Moody', value: 'dark', description: 'Deep, rich tones' },
    ],
    required: true,
    fieldMap: 'aesthetic.colourPaletteAffinities',
    skipAllowed: false,
    nextStage: 'aesthetic_artists',
  },

  {
    stage: 'aesthetic_artists',
    title: 'Artistic Inspiration',
    description: 'Are there artists or movements that inspire you?',
    estimatedDuration: 30,
    inputType: 'multiselect',
    question: 'Any artists or art movements you love? (Optional)',
    helpText: 'The more we know, the better we can personalize your content',
    options: [
      { label: 'Contemporary', value: 'contemporary' },
      { label: 'Abstract Expressionism', value: 'abstract_expressionism' },
      { label: 'Impressionism', value: 'impressionism' },
      { label: 'Surrealism', value: 'surrealism' },
      { label: 'Japanese Art', value: 'japanese_art' },
      { label: 'Street Art', value: 'street_art' },
      { label: 'Photography', value: 'photography' },
      { label: 'Digital Art', value: 'digital_art' },
    ],
    required: false,
    fieldMap: 'aesthetic.preferredArtMovements',
    skipAllowed: true,
    nextStage: 'identity_basic',
  },

  {
    stage: 'identity_basic',
    title: 'A Bit About You',
    description: 'Help us understand your world',
    estimatedDuration: 45,
    inputType: 'selection',
    question: 'What best describes your current life stage?',
    helpText: 'This helps us understand your context and needs',
    options: [
      { label: 'Student', value: 'student' },
      { label: 'Professional', value: 'professional' },
      { label: 'Parent', value: 'parent' },
      { label: 'Creative', value: 'creative' },
      { label: 'Founder', value: 'founder' },
      { label: 'Retired', value: 'retired' },
      { label: 'Other', value: 'other' },
    ],
    required: true,
    fieldMap: 'identity.lifeStage',
    skipAllowed: false,
    nextStage: 'identity_life_stage',
  },

  {
    stage: 'identity_life_stage',
    title: 'Your Living Situation',
    description: 'Understanding your space helps us tailor content',
    estimatedDuration: 30,
    inputType: 'selection',
    question: 'Who do you live with?',
    helpText: 'This affects how we display and curate content',
    options: [
      { label: 'Living alone', value: 'solo' },
      { label: 'With a partner', value: 'partner' },
      { label: 'With family', value: 'family' },
      { label: 'With housemates', value: 'housemates' },
    ],
    required: true,
    fieldMap: 'identity.livingSituation',
    skipAllowed: false,
    nextStage: 'identity_goals',
  },

  {
    stage: 'identity_goals',
    title: 'Your Aspirations',
    description: 'What matters most to you?',
    estimatedDuration: 45,
    inputType: 'text',
    question: 'What are some of your goals or aspirations right now?',
    helpText: 'These can be personal, professional, creative, or anything that matters to you',
    required: false,
    fieldMap: 'identity.lifeGoals',
    skipAllowed: true,
    nextStage: 'emotional_state',
  },

  {
    stage: 'emotional_state',
    title: 'How Are You Feeling?',
    description: 'Your emotional world shapes what resonates with you',
    estimatedDuration: 30,
    inputType: 'selection',
    question: 'How would you describe your emotional state right now?',
    helpText: 'Deckoviz learns your patterns over time',
    options: [
      { label: 'Energized & Inspired', value: 'inspired' },
      { label: 'Calm & Peaceful', value: 'calm' },
      { label: 'Contemplative', value: 'contemplative' },
      { label: 'Stressed or Overwhelmed', value: 'stressed' },
      { label: 'Creative & Flowing', value: 'creative' },
      { label: 'Melancholic or Reflective', value: 'melancholic' },
    ],
    required: true,
    fieldMap: 'emotional.currentEmotionalState',
    skipAllowed: false,
    nextStage: 'emotional_needs',
  },

  {
    stage: 'emotional_needs',
    title: 'What Content Helps You?',
    description: 'We\'ll create content that meets you where you are',
    estimatedDuration: 45,
    inputType: 'multiselect',
    question: 'What kind of content helps you feel better? (Select 1-4)',
    helpText: 'Choose what resonates most with you',
    options: [
      { label: 'Comfort & Coziness', value: 'comfort' },
      { label: 'Stimulation & Inspiration', value: 'stimulation' },
      { label: 'Calm & Grounding', value: 'calm' },
      { label: 'Inspiration & Creativity', value: 'inspiration' },
      { label: 'Joy & Celebration', value: 'joy' },
      { label: 'Reflection & Depth', value: 'reflection' },
    ],
    required: true,
    fieldMap: 'emotional.emotionalNeeds',
    skipAllowed: false,
    nextStage: 'intellectual_interests',
  },

  {
    stage: 'intellectual_interests',
    title: 'What Captivates Your Mind?',
    description: 'Your intellectual interests shape your visual world',
    estimatedDuration: 45,
    inputType: 'multiselect',
    question: 'What topics or ideas fascinate you? (Select 2-4)',
    helpText: 'These will influence the themes in your content',
    options: [
      { label: 'Philosophy & Spirituality', value: 'philosophy' },
      { label: 'Science & Technology', value: 'science' },
      { label: 'Nature & Environment', value: 'nature' },
      { label: 'History & Culture', value: 'history' },
      { label: 'Literature & Words', value: 'literature' },
      { label: 'Psychology & Human Nature', value: 'psychology' },
      { label: 'Art & Creativity', value: 'art' },
      { label: 'Health & Wellness', value: 'wellness' },
    ],
    required: true,
    fieldMap: 'intellectual.primaryIntellectualInterests',
    skipAllowed: false,
    nextStage: 'behavioral_context',
  },

  {
    stage: 'behavioral_context',
    title: 'Your Display Space',
    description: 'Where will Deckoviz live in your home?',
    estimatedDuration: 30,
    inputType: 'selection',
    question: 'Where will your Deckoviz frame be displayed?',
    helpText: 'This helps us choose content that fits your space',
    options: [
      { label: 'Bedroom', value: 'bedroom' },
      { label: 'Living Room', value: 'livingroom' },
      { label: 'Studio / Creative Space', value: 'studio' },
      { label: 'Office', value: 'office' },
      { label: 'Entryway', value: 'entryway' },
    ],
    required: true,
    fieldMap: 'behavioral.displayRoomContext',
    skipAllowed: false,
    nextStage: 'creative_identity',
  },

  {
    stage: 'creative_identity',
    title: 'Your Creative Side',
    description: 'Are you a creator?',
    estimatedDuration: 30,
    inputType: 'toggle',
    question: 'Do you identify as a creative person?',
    helpText: 'This helps us personalize content around your creative practice',
    required: false,
    fieldMap: 'creative.isCreative',
    skipAllowed: true,
    nextStage: 'frame_intent',
  },

  {
    stage: 'frame_intent',
    title: 'Your Intent',
    description: 'What will you use Deckoviz for?',
    estimatedDuration: 30,
    inputType: 'multiselect',
    question: 'What are you hoping to get from Deckoviz? (Select 1-3)',
    helpText: 'Your intent shapes how we create and curate',
    options: [
      { label: 'Daily Inspiration', value: 'inspiration' },
      { label: 'Ambient Beauty', value: 'beauty' },
      { label: 'Reflection & Meditation', value: 'meditation' },
      { label: 'Creative Fuel', value: 'creative' },
      { label: 'Mood Regulation', value: 'mood' },
      { label: 'Storytelling', value: 'storytelling' },
    ],
    required: true,
    fieldMap: 'identity.currentLifeChapter',
    skipAllowed: false,
    nextStage: 'consent',
  },

  {
    stage: 'consent',
    title: 'Privacy & Consent',
    description: 'How we protect and respect your data',
    estimatedDuration: 45,
    inputType: 'toggle',
    question: 'I consent to Deckoviz learning from my interactions to improve my experience',
    helpText: 'Your data is encrypted and never sold. You can change this anytime in settings.',
    required: true,
    fieldMap: 'consentSettings.dataUsageConsent',
    skipAllowed: false,
    nextStage: 'complete',
  },

  {
    stage: 'complete',
    title: 'Welcome to Deckoviz',
    description: 'Your profile is ready. Let\'s create something beautiful.',
    estimatedDuration: 30,
    inputType: 'text',
    question: 'Ready to begin?',
    helpText: 'Your profile will grow smarter and more personalized over time.',
    required: false,
    fieldMap: 'onboardingStatus',
    skipAllowed: false,
  },
]

// Helper to get next stage
export function getNextStage(currentStage: OnboardingStage): OnboardingStage | null {
  const currentStep = ONBOARDING_FLOW.find(step => step.stage === currentStage)
  return currentStep?.nextStage || null
}

// Helper to get stage progress
export function getOnboardingProgress(completedStages: OnboardingStage[]): {
  completedCount: number
  totalCount: number
  percentage: number
} {
  return {
    completedCount: completedStages.length,
    totalCount: ONBOARDING_FLOW.length,
    percentage: Math.round((completedStages.length / ONBOARDING_FLOW.length) * 100),
  }
}

// Check if minimum viable profile is complete
export function isMinimumViableProfileComplete(completedStages: OnboardingStage[]): boolean {
  const requiredStages: OnboardingStage[] = [
    'welcome',
    'aesthetic_visual_style',
    'identity_basic',
    'emotional_state',
    'emotional_needs',
    'behavioral_context',
    'consent',
  ]
  return requiredStages.every(stage => completedStages.includes(stage))
}
