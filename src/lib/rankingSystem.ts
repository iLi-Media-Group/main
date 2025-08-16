// Producer Application Ranking System
// This utility calculates scores based on various criteria for ranking applicants

export interface RankingCriteria {
  // Experience & Professional Background
  yearsExperience: number;
  priorPlacements: boolean;
  proAffiliation: string;
  teamType: string;
  
  // Output & Productivity
  tracksPerWeek: number;
  hasReleasePlan: boolean;
  
  // Musical Skillset & Instrumentation
  instruments: string[];
  proficiencies: string[];
  
  // Disqualifiers & Red Flags
  usesThirdPartySamples: boolean;
  usesLoops: boolean;
  usesAI: boolean;
  
  // Quiz Performance
  quizScore: number;
  quizTotalQuestions: number;
}

export interface RankingResult {
  totalScore: number;
  breakdown: {
    experienceScore: number;
    outputScore: number;
    skillsetScore: number;
    disqualifierPenalty: number;
    quizScore: number;
  };
  isAutoRejected: boolean;
  rejectionReason?: string;
}

export function calculateRankingScore(criteria: RankingCriteria): RankingResult {
  let totalScore = 0;
  const breakdown = {
    experienceScore: 0,
    outputScore: 0,
    skillsetScore: 0,
    disqualifierPenalty: 0,
    quizScore: 0
  };

  // 1. Experience & Professional Background (up to 17 pts)
  // Years of Experience
  if (criteria.yearsExperience >= 1 && criteria.yearsExperience <= 2) {
    breakdown.experienceScore += 2;
  } else if (criteria.yearsExperience >= 3 && criteria.yearsExperience <= 5) {
    breakdown.experienceScore += 4;
  } else if (criteria.yearsExperience >= 6 && criteria.yearsExperience <= 9) {
    breakdown.experienceScore += 6;
  } else if (criteria.yearsExperience >= 10) {
    breakdown.experienceScore += 8;
  }

  // Prior Placements or Collabs
  if (criteria.priorPlacements) {
    breakdown.experienceScore += 6;
  }

  // PRO Affiliation
  if (criteria.proAffiliation && criteria.proAffiliation !== 'None') {
    breakdown.experienceScore += 3;
  } else {
    breakdown.experienceScore -= 2;
  }

  // Team Type
  if (criteria.teamType === 'One Man Team' || criteria.teamType === 'solo') {
    breakdown.experienceScore += 3;
  } else if (criteria.teamType === 'Band') {
    breakdown.experienceScore += 2;
  } else if (criteria.teamType === 'Label' || criteria.teamType === 'Other') {
    breakdown.experienceScore += 1;
  }

  // 2. Output & Productivity (up to 10 pts)
  // Tracks Produced per Week
  if (criteria.tracksPerWeek >= 1 && criteria.tracksPerWeek <= 3) {
    breakdown.outputScore += 2;
  } else if (criteria.tracksPerWeek >= 4 && criteria.tracksPerWeek <= 7) {
    breakdown.outputScore += 5;
  } else if (criteria.tracksPerWeek >= 8 && criteria.tracksPerWeek <= 15) {
    breakdown.outputScore += 8;
  } else if (criteria.tracksPerWeek > 15) {
    breakdown.outputScore -= 2;
  }

  // Consistency & Upload Frequency
  if (criteria.hasReleasePlan) {
    breakdown.outputScore += 2;
  }

  // 3. Musical Skillset & Instrumentation (up to 15 pts)
  // Number of Instruments Played
  const instrumentCount = criteria.instruments.filter(instrument => instrument && instrument.trim() !== '').length;
  if (instrumentCount === 1) {
    breakdown.skillsetScore += 2;
  } else if (instrumentCount >= 2 && instrumentCount <= 3) {
    breakdown.skillsetScore += 4;
  } else if (instrumentCount >= 4) {
    breakdown.skillsetScore += 6;
  }

  // Proficiency Level (average)
  const proficiencyScores = criteria.proficiencies
    .filter(prof => prof && prof.trim() !== '')
    .map(prof => {
      switch (prof.toLowerCase()) {
        case 'beginner': return 1;
        case 'intermediate': return 2;
        case 'pro': return 3;
        default: return 0;
      }
    });

  if (proficiencyScores.length > 0) {
    const avgProficiency = proficiencyScores.reduce((sum: number, score: number) => sum + score, 0) / proficiencyScores.length;
    breakdown.skillsetScore += Math.round(avgProficiency * 3); // Up to 9 pts
  }

  // 4. Disqualifiers & Red Flags (-15 pts possible)
  if (criteria.usesThirdPartySamples) {
    breakdown.disqualifierPenalty -= 5;
  }
  if (criteria.usesLoops) {
    breakdown.disqualifierPenalty -= 5;
  }
  if (criteria.usesAI) {
    breakdown.disqualifierPenalty -= 5;
  }

  // 5. Quiz Performance
  const quizPercentage = (criteria.quizScore / criteria.quizTotalQuestions) * 100;
  if (quizPercentage >= 0 && quizPercentage < 30) {
    breakdown.quizScore -= 20;
  } else if (quizPercentage >= 30 && quizPercentage < 60) {
    breakdown.quizScore -= 10;
  } else if (quizPercentage >= 80 && quizPercentage <= 100) {
    breakdown.quizScore += 10;
  }

  // Calculate total score
  totalScore = breakdown.experienceScore + breakdown.outputScore + breakdown.skillsetScore + breakdown.disqualifierPenalty + breakdown.quizScore;

  // Check for auto-rejection
  let isAutoRejected = false;
  let rejectionReason = '';

  // Auto-reject if total red flag penalties exceed -10
  if (breakdown.disqualifierPenalty <= -10) {
    isAutoRejected = true;
    rejectionReason = 'Auto-rejected: Too many red flags (uses third-party samples, loops, or AI)';
  }

  // Auto-reject if AI-generated music is "Yes"
  if (criteria.usesAI) {
    isAutoRejected = true;
    rejectionReason = 'Auto-rejected: Uses AI to generate music';
  }

  return {
    totalScore,
    breakdown,
    isAutoRejected,
    rejectionReason: isAutoRejected ? rejectionReason : undefined
  };
}

// Helper function to convert application data to ranking criteria
export function applicationToRankingCriteria(application: any): RankingCriteria {
  // Extract years of experience as number
  const yearsExperience = parseInt(application.years_experience) || 0;
  
  // Extract tracks per week as number
  const tracksPerWeek = parseInt(application.tracks_per_week) || 0;
  
  // Determine if they have prior placements (based on artist collaboration)
  const priorPlacements = application.artist_collab === 'Yes' || application.records_artists === 'Yes';
  
  // Determine if they have a release plan (based on business entity)
  const hasReleasePlan = !!application.business_entity;
  
  // Collect instruments and proficiencies
  const instruments = [
    application.instrument_one,
    application.instrument_two,
    application.instrument_three,
    application.instrument_four
  ].filter(Boolean);
  
  const proficiencies = [
    application.instrument_one_proficiency,
    application.instrument_two_proficiency,
    application.instrument_three_proficiency,
    application.instrument_four_proficiency
  ].filter(Boolean);
  
  // Determine red flags
  const usesThirdPartySamples = application.sample_use === 'Yes' || application.splice_use === 'Yes';
  const usesLoops = application.loop_use === 'Yes';
  const usesAI = application.ai_generated_music === 'Yes';
  
  return {
    yearsExperience,
    priorPlacements,
    proAffiliation: application.pro_affiliation || '',
    teamType: application.team_type || '',
    tracksPerWeek,
    hasReleasePlan,
    instruments,
    proficiencies,
    usesThirdPartySamples,
    usesLoops,
    usesAI,
    quizScore: application.quiz_score || 0,
    quizTotalQuestions: application.quiz_total_questions || 5
  };
} 