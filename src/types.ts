import React from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  subGenres: string[];
  moods: string[];
  mediaUsage?: string[]; // Media usage types for deep media search
  duration: string;
  bpm: number;
  key?: string;
  hasStingEnding: boolean;
  isOneStop: boolean;
  audioUrl: string;
  image: string;
  mp3Url?: string;
  trackoutsUrl?: string;
  stemsUrl?: string;
  splitSheetUrl?: string;
  hasVocals?: boolean;
  vocalsUsageType?: 'normal' | 'sync_only';
  isSyncOnly?: boolean;
  producerId: string; // Added explicit producerId field
  producer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarPath?: string;
  };
  fileFormats: {
    stereoMp3: {
      format: string[];
      url: string;
    };
    stems: {
      format: string[];
      url: string;
    };
    stemsWithVocals: {
      format: string[];
      url: string;
    };
  };
  pricing: {
    stereoMp3: number;
    stems: number;
    stemsWithVocals: number;
  };
  leaseAgreementUrl: string;
  // Sync proposal related fields
  sync_fee?: number;
  payment_terms?: string;
  is_exclusive?: boolean;
}

export interface SyncProposal {
  id: string;
  trackId: string;
  clientId: string;
  projectType: string;
  duration: string;
  isExclusive: boolean;
  syncFee: number;
  paymentTerms: 'immediate' | 'net30' | 'net60' | 'net90';
  expirationDate: string;
  isUrgent: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

// Updated genres to be lowercase and match database constraint pattern
export const GENRES = [
  'Hiphop',
  'Rnb',
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'World',
  'Religious',
  'Childrens',
  'Country',
] as const;

export const SUB_GENRES = {
  'hiphop': ['trap', 'boom bap', 'lo fi', 'drill', 'west coast', 'east coast'],
  'rnb': ['soul', 'neo soul', 'contemporary', 'gospel'],
  'pop': ['indie pop', 'synth pop', 'k pop', 'dance pop'],
  'rock': ['alternative', 'indie rock', 'metal', 'punk'],
  'electronic': ['house', 'techno', 'ambient', 'drum and bass', 'dubstep'],
  'jazz': ['smooth jazz', 'bebop', 'fusion', 'contemporary'],
  'classical': ['orchestral', 'chamber', 'contemporary', 'minimalist'],
  'world': ['latin', 'african', 'asian', 'middle eastern'],
  'religious': ['gospel', 'contemporary christian', 'worship', 'sacred', 'spiritual'],
  'childrens': [
    'playful',
    'whimsical',
    'educational',
    'nursery rhyme',
    'lullaby',
    'adventure fantasy',
    'silly and goofy',
    'interactive'
  ],
} as const;

export const MUSICAL_KEYS = [
  'C Major',
  'C♯ Major / D♭ Major',
  'D Major',
  'D♯ Major / E♭ Major',
  'E Major',
  'F Major',
  'F♯ Major / G♭ Major',
  'G Major',
  'G♯ Major / A♭ Major',
  'A Major',
  'A♯ Major / B♭ Major',
  'B Major',
  'A Minor',
  'A♯ Minor / B♭ Minor',
  'B Minor',
  'C Minor',
  'C♯ Minor / D♭ Minor',
  'D Minor',
  'D♯ Minor / E♭ Minor',
  'E Minor',
  'F Minor',
  'F♯ Minor / G♭ Minor',
  'G Minor',
  'G♯ Minor / A♭ Minor'
] as const;

export const MOODS_CATEGORIES = {
  'Happy & Upbeat': [
    'joyful', 'energetic', 'cheerful', 'playful', 'optimistic', 'excited', 
    'celebratory', 'triumphant', 'uplifting', 'bouncy', 'bright', 'carefree', 
    'euphoric', 'lively'
  ],
  'Sad & Melancholic': [
    'heartbroken', 'melancholy', 'nostalgic', 'somber', 'depressed', 'reflective',
    'gloomy', 'bitter', 'yearning', 'mournful', 'haunting', 'regretful', 'lonely',
    'poignant'
  ],
  'Calm & Relaxing': [
    'peaceful', 'serene', 'soothing', 'meditative', 'dreamy', 'gentle', 'tranquil',
    'ethereal', 'laid back', 'floating', 'mellow', 'soft', 'cozy', 'chill'
  ],
  'Dark & Mysterious': [
    'ominous', 'creepy', 'foreboding', 'brooding', 'tense', 'haunting', 'moody',
    'sinister', 'suspenseful', 'menacing', 'eerie', 'shadowy'
  ],
  'Romantic & Intimate': [
    'loving', 'passionate', 'sensual', 'tender', 'intimate', 'lustful', 'heartfelt',
    'longing', 'sweet', 'sentimental', 'gentle', 'warm'
  ],
  'Aggressive & Intense': [
    'angry', 'furious', 'chaotic', 'explosive', 'fierce', 'powerful', 'rebellious',
    'savage', 'heavy', 'relentless', 'unstoppable', 'wild'
  ],
  'Epic & Heroic': [
    'majestic', 'triumphant', 'victorious', 'grand', 'inspirational', 'dramatic',
    'cinematic', 'monumental', 'glorious', 'adventurous', 'powerful'
  ],
  'Quirky & Fun': [
    'wacky', 'silly', 'funky', 'playful', 'bizarre', 'eccentric', 'whimsical',
    'goofy', 'zany', 'cheerful'
  ],
  'Inspirational & Hopeful': [
    'motivational', 'encouraging', 'uplifting', 'aspirational', 'bright',
    'confident', 'positive', 'driving', 'determined'
  ],
  'Mysterious & Suspenseful': [
    'enigmatic', 'secretive', 'cryptic', 'suspenseful', 'intriguing',
    'tense', 'unresolved'
  ],
  'Groovy & Funky': [
    'smooth', 'cool', 'retro', 'stylish', 'sassy', 'funky', 'catchy', 'hypnotic'
  ],
  'Otherworldly & Fantasy': [
    'mystical', 'ethereal', 'enchanted', 'magical', 'cosmic', 'dreamlike',
    'celestial', 'floating'
  ]
} as const;

export const MOODS = Array.from(
  new Set(
    Object.values(MOODS_CATEGORIES).flat()
  )
).sort() as readonly string[];

export const FILE_FORMATS = ['MP3', 'WAV', 'AIFF'] as const;

// Media Usage Types for Deep Media Search
export const MEDIA_USAGE_CATEGORIES = {
  'Television (TV)': {
    'Network Shows': ['Primetime Drama', 'Late Night', 'Morning Shows', 'News Programs'],
    'Streaming Originals': ['Netflix Originals', 'Hulu Originals', 'Amazon Prime', 'Disney+'],
    'Trailers & Bumpers': ['Show Trailers', 'Network Bumpers', 'Season Promos'],
    'Reality TV': ['Competition Shows', 'Dating Shows', 'Lifestyle/Makeover Shows', 'Survival Shows'],
    'Cooking Shows': ['Instructional Cooking', 'Travel & Food', 'Competition Cooking', 'Celebrity Chefs'],
    'Sports Broadcasting': ['Game Coverage', 'Highlights & Recaps', 'Athlete Features', 'Sports Analysis'],
    'Drama': ['Teen/YA Drama', 'Crime/Thriller', 'Medical/Legal Drama', 'Family Drama'],
    'Comedy': ['Sitcoms', 'Sketch Comedy', 'Dark Comedy', 'Stand-up Specials'],
    'Documentary': ['True Crime', 'Nature & Wildlife', 'Historical/Political', 'Biographical']
  },
  'Streaming Platforms': {
    'Original Series': ['Youth/YA Originals', 'Sci-fi & Fantasy', 'Adult Animation', 'Drama Series'],
    'Feature Films': ['Romantic Comedies', 'Action & Thriller', 'Indie/Arthouse', 'Family Films'],
    'Mini-Series/Anthologies': ['Limited Series', 'Anthology Shows', 'Documentary Series'],
    'Music-driven Stories': ['Musical Films', 'Biographical Films', 'Concert Films'],
    'Period Pieces': ['Historical Drama', 'Period Comedy', 'Costume Drama']
  },
  'Film & Cinema': {
    'Trailers/Teasers': ['Movie Trailers', 'Teaser Trailers', 'TV Spots', 'International Trailers'],
    'End Credits': ['Main Credits', 'End Credit Sequences', 'Bonus Content'],
    'Opening Titles/Intros': ['Title Sequences', 'Opening Credits', 'Studio Intros'],
    'Scene Syncs': ['Action/Chase', 'Romance/Intimacy', 'Montage/Transition', 'Emotional Climaxes']
  },
  'YouTube & Digital Video': {
    'Vlogs': ['Travel Vlogs', 'Lifestyle/Day in the Life', 'Productivity/Study With Me', 'Personal Vlogs'],
    'Tutorials/How-To': ['Beauty & Grooming', 'Tech & Unboxings', 'Home DIY', 'Educational'],
    'Gaming Content': ['Let\'s Plays', 'Esports Commentary', 'Speedruns/Challenges', 'Gaming Reviews'],
    'Reaction/Commentary': ['Reaction Videos', 'Commentary Channels', 'Review Content'],
    'Music Channels': ['Covers & Remixes', 'Music Discovery/Playlists', 'Music Reviews', 'Behind the Scenes']
  },
  'Podcasts': {
    'Intro & Outro Themes': ['Podcast Intros', 'Outro Music', 'Transition Music', 'Sponsor Segments'],
    'Segment Break Music': ['Ad Breaks', 'Chapter Breaks', 'Interview Transitions'],
    'Interview Backdrops': ['Background Music', 'Interview Intros', 'Guest Segments'],
    'Genres': ['True Crime', 'Business/Startups', 'Comedy/Culture', 'News/Politics', 'Health/Wellness', 'Personal Development']
  },
  'Social Media': {
    'Trends & Challenges': ['Viral Challenges', 'Trending Sounds', 'Dance Videos', 'Lip Sync'],
    'Fashion & Lifestyle': ['Fashion/OOTD', 'Behind the Scenes/BTS', 'Motivational Edits', 'Product Features'],
    'Short-form Content': ['TikTok Videos', 'Instagram Reels', 'YouTube Shorts', 'Snapchat Stories']
  },
  'Games & Interactive Media': {
    'Main Menu/UI Themes': ['Menu Music', 'UI Sound Effects', 'Loading Screens', 'Character Select'],
    'Level/World Backgrounds': ['Level Music', 'World Themes', 'Ambient Backgrounds', 'Environmental Audio'],
    'Combat/Action Sequences': ['Battle Music', 'Action Sequences', 'Boss Fights', 'Combat Effects'],
    'Victory/Loss Stingers': ['Victory Fanfares', 'Defeat Music', 'Achievement Sounds', 'Reward Music'],
    'Cutscene Music': ['Story Cutscenes', 'Character Development', 'Emotional Moments', 'Plot Reveals']
  },
  'Advertising & Corporate': {
    'Brand Commercials': ['Car Commercials', 'Holiday Ads', 'Restaurant Ads', 'Fashion Ads', 'Tech Ads'],
    'Explainer Videos': ['Product Demos', 'Service Explanations', 'How-to Guides', 'Educational Content'],
    'Corporate Presentations': ['Company Videos', 'Sizzle Reels', 'Internal Communications', 'Training Videos'],
    'Promotional Content': ['Event Promotions', 'Product Launches', 'Seasonal Campaigns', 'Brand Awareness']
  },
  'Education & Non-Profit': {
    'Online Courses': ['Educational Content', 'Training Videos', 'Academic Lectures', 'Skill Development'],
    'Non-Profit Campaigns': ['Awareness Videos', 'Fundraising Campaigns', 'Impact Stories', 'Volunteer Recruitment'],
    'School Projects': ['Student Films', 'Institutional Media', 'Academic Presentations', 'Research Videos']
  }
} as const;

// Flatten the media usage categories for easier access
export const MEDIA_USAGE_TYPES = Object.entries(MEDIA_USAGE_CATEGORIES).reduce((acc, [category, subcategories]) => {
  Object.entries(subcategories).forEach(([subcategory, types]) => {
    types.forEach((type: string) => {
      acc.push(`${category} > ${subcategory} > ${type}`);
    });
  });
  return acc;
}, [] as string[]);

// Media usage categories for display
export const MEDIA_USAGE_DISPLAY_CATEGORIES = Object.keys(MEDIA_USAGE_CATEGORIES) as readonly string[];
