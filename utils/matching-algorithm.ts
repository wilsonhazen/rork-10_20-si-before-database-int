import type { InfluencerProfile, SponsorProfile, Gig } from '@/types';

export interface MatchScore {
  score: number;
  breakdown: {
    categoryMatch: number;
    followerSizeMatch: number;
    budgetMatch: number;
    locationMatch: number;
    engagementRate: number;
    priceCompatibility: number;
  };
  reasons: string[];
  compatibility: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface InfluencerMatch {
  influencer: InfluencerProfile;
  matchScore: MatchScore;
  recommendedGigs: Gig[];
}

export interface SponsorMatch {
  sponsor: SponsorProfile;
  matchScore: MatchScore;
  recommendedInfluencers: InfluencerProfile[];
}

const WEIGHTS = {
  categoryMatch: 0.30,
  followerSizeMatch: 0.20,
  budgetMatch: 0.20,
  locationMatch: 0.10,
  engagementRate: 0.15,
  priceCompatibility: 0.05,
};

function calculateCategoryMatch(
  influencerCategories: string[],
  gigCategories: string[]
): number {
  const matches = influencerCategories.filter(cat =>
    gigCategories.some(gigCat => 
      gigCat.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(gigCat.toLowerCase())
    )
  );
  return matches.length > 0 ? (matches.length / Math.max(influencerCategories.length, gigCategories.length)) * 100 : 0;
}

function calculateFollowerSizeMatch(
  influencerFollowers: number,
  gigRequirements: string[]
): number {
  const followerReq = gigRequirements.find(req => 
    req.toLowerCase().includes('follower') || req.toLowerCase().includes('k+')
  );
  
  if (!followerReq) return 75;

  const match = followerReq.match(/(\d+)k\+/i);
  if (match) {
    const requiredFollowers = parseInt(match[1]) * 1000;
    if (influencerFollowers >= requiredFollowers) {
      const ratio = influencerFollowers / requiredFollowers;
      if (ratio >= 1 && ratio <= 3) return 100;
      if (ratio > 3 && ratio <= 5) return 85;
      if (ratio > 5) return 70;
    }
    return Math.min((influencerFollowers / requiredFollowers) * 100, 50);
  }

  return 75;
}

function calculateBudgetMatch(
  influencerRate: number,
  gigPrice: number
): number {
  const ratio = gigPrice / influencerRate;
  
  if (ratio >= 0.9 && ratio <= 1.3) return 100;
  if (ratio >= 0.7 && ratio < 0.9) return 85;
  if (ratio > 1.3 && ratio <= 1.5) return 85;
  if (ratio >= 0.5 && ratio < 0.7) return 70;
  if (ratio > 1.5 && ratio <= 2) return 70;
  if (ratio >= 0.3 && ratio < 0.5) return 50;
  if (ratio > 2 && ratio <= 3) return 50;
  
  return 30;
}

function calculateLocationMatch(
  influencerLocation: string,
  gigLocation?: string
): number {
  if (!gigLocation) return 50;
  
  const influencerCity = influencerLocation.split(',')[0].trim().toLowerCase();
  const gigCity = gigLocation.split(',')[0].trim().toLowerCase();
  
  if (influencerCity === gigCity) return 100;
  
  const influencerState = influencerLocation.split(',')[1]?.trim().toLowerCase();
  const gigState = gigLocation.split(',')[1]?.trim().toLowerCase();
  
  if (influencerState && gigState && influencerState === gigState) return 70;
  
  const internationalCities = ['london', 'paris', 'milan', 'tokyo', 'dubai', 'barcelona'];
  if (internationalCities.includes(influencerCity) && internationalCities.includes(gigCity)) {
    return 60;
  }
  
  return 40;
}

function calculateEngagementScore(engagementRate: number): number {
  if (engagementRate >= 8) return 100;
  if (engagementRate >= 6) return 90;
  if (engagementRate >= 4) return 75;
  if (engagementRate >= 2) return 60;
  return 40;
}

function calculatePriceCompatibility(
  influencerRate: number,
  gigPrice: number
): number {
  if (gigPrice >= influencerRate * 0.8) return 100;
  if (gigPrice >= influencerRate * 0.6) return 75;
  if (gigPrice >= influencerRate * 0.4) return 50;
  return 25;
}

export function calculateInfluencerGigMatch(
  influencer: InfluencerProfile,
  gig: Gig
): MatchScore {
  const categoryMatch = calculateCategoryMatch(influencer.categories, gig.categories);
  const followerSizeMatch = calculateFollowerSizeMatch(influencer.followers, gig.requirements);
  const budgetMatch = calculateBudgetMatch(influencer.ratePerPost, gig.price);
  const locationMatch = calculateLocationMatch(influencer.location, gig.location);
  const engagementRate = calculateEngagementScore(influencer.engagementRate);
  const priceCompatibility = calculatePriceCompatibility(influencer.ratePerPost, gig.price);

  const score = 
    categoryMatch * WEIGHTS.categoryMatch +
    followerSizeMatch * WEIGHTS.followerSizeMatch +
    budgetMatch * WEIGHTS.budgetMatch +
    locationMatch * WEIGHTS.locationMatch +
    engagementRate * WEIGHTS.engagementRate +
    priceCompatibility * WEIGHTS.priceCompatibility;

  const reasons: string[] = [];
  
  if (categoryMatch >= 80) reasons.push('Perfect category match');
  else if (categoryMatch >= 60) reasons.push('Good category alignment');
  
  if (followerSizeMatch >= 90) reasons.push('Ideal audience size');
  else if (followerSizeMatch >= 70) reasons.push('Good audience reach');
  
  if (budgetMatch >= 85) reasons.push('Budget perfectly aligned');
  else if (budgetMatch >= 70) reasons.push('Budget compatible');
  
  if (locationMatch >= 90) reasons.push('Same location');
  else if (locationMatch >= 60) reasons.push('Regional match');
  
  if (influencer.engagementRate >= 7) reasons.push('Exceptional engagement rate');
  else if (influencer.engagementRate >= 5) reasons.push('Strong engagement');
  
  if (priceCompatibility >= 90) reasons.push('Price expectations met');

  let compatibility: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) compatibility = 'excellent';
  else if (score >= 70) compatibility = 'good';
  else if (score >= 55) compatibility = 'fair';
  else compatibility = 'poor';

  return {
    score: Math.round(score),
    breakdown: {
      categoryMatch: Math.round(categoryMatch),
      followerSizeMatch: Math.round(followerSizeMatch),
      budgetMatch: Math.round(budgetMatch),
      locationMatch: Math.round(locationMatch),
      engagementRate: Math.round(engagementRate),
      priceCompatibility: Math.round(priceCompatibility),
    },
    reasons,
    compatibility,
  };
}

export function findBestInfluencersForGig(
  influencers: InfluencerProfile[],
  gig: Gig,
  limit: number = 10
): InfluencerMatch[] {
  const matches = influencers
    .map(influencer => ({
      influencer,
      matchScore: calculateInfluencerGigMatch(influencer, gig),
      recommendedGigs: [],
    }))
    .filter(match => match.matchScore.score >= 50)
    .sort((a, b) => b.matchScore.score - a.matchScore.score)
    .slice(0, limit);

  return matches;
}

export function findBestGigsForInfluencer(
  influencer: InfluencerProfile,
  gigs: Gig[],
  limit: number = 10
): { gig: Gig; matchScore: MatchScore }[] {
  const matches = gigs
    .filter(gig => gig.status === 'open')
    .map(gig => ({
      gig,
      matchScore: calculateInfluencerGigMatch(influencer, gig),
    }))
    .filter(match => match.matchScore.score >= 50)
    .sort((a, b) => b.matchScore.score - a.matchScore.score)
    .slice(0, limit);

  return matches;
}

export function calculateSponsorInfluencerMatch(
  sponsor: SponsorProfile,
  influencer: InfluencerProfile,
  sponsorBudget: number = 10000
): MatchScore {
  const industryCategories = sponsor.industry.toLowerCase().split('&').map(s => s.trim());
  const categoryMatch = influencer.categories.some(cat =>
    industryCategories.some(ind => 
      cat.toLowerCase().includes(ind) || ind.includes(cat.toLowerCase())
    )
  ) ? 85 : 50;

  const budgetMatch = calculateBudgetMatch(influencer.ratePerPost, sponsorBudget);
  const locationMatch = calculateLocationMatch(influencer.location, sponsor.location);
  const engagementRate = calculateEngagementScore(influencer.engagementRate);
  
  const followerScore = influencer.followers >= 100000 ? 100 : 
                       influencer.followers >= 50000 ? 85 :
                       influencer.followers >= 10000 ? 70 : 50;

  const score = 
    categoryMatch * 0.35 +
    budgetMatch * 0.25 +
    locationMatch * 0.15 +
    engagementRate * 0.15 +
    followerScore * 0.10;

  const reasons: string[] = [];
  
  if (categoryMatch >= 80) reasons.push('Industry alignment');
  if (budgetMatch >= 80) reasons.push('Budget compatible');
  if (locationMatch >= 80) reasons.push('Location match');
  if (influencer.engagementRate >= 6) reasons.push('High engagement');
  if (influencer.followers >= 500000) reasons.push('Large audience');

  let compatibility: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) compatibility = 'excellent';
  else if (score >= 70) compatibility = 'good';
  else if (score >= 55) compatibility = 'fair';
  else compatibility = 'poor';

  return {
    score: Math.round(score),
    breakdown: {
      categoryMatch: Math.round(categoryMatch),
      followerSizeMatch: Math.round(followerScore),
      budgetMatch: Math.round(budgetMatch),
      locationMatch: Math.round(locationMatch),
      engagementRate: Math.round(engagementRate),
      priceCompatibility: Math.round(budgetMatch),
    },
    reasons,
    compatibility,
  };
}

export function findBestInfluencersForSponsor(
  sponsor: SponsorProfile,
  influencers: InfluencerProfile[],
  budget: number = 10000,
  limit: number = 20
): InfluencerMatch[] {
  const matches = influencers
    .map(influencer => ({
      influencer,
      matchScore: calculateSponsorInfluencerMatch(sponsor, influencer, budget),
      recommendedGigs: [],
    }))
    .filter(match => match.matchScore.score >= 50)
    .sort((a, b) => b.matchScore.score - a.matchScore.score)
    .slice(0, limit);

  return matches;
}
