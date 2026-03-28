import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import type { InfluencerProfile, SponsorProfile, Gig } from '@/types';
import {
  calculateInfluencerGigMatch,
  findBestInfluencersForGig,
  findBestGigsForInfluencer,
  findBestInfluencersForSponsor,
  type MatchScore,
} from '@/utils/matching-algorithm';

export const [MatchingProvider, useMatching] = createContextHook(() => {
  const [matchHistory, setMatchHistory] = useState<Array<{
    id: string;
    userId: string;
    targetId: string;
    score: number;
    timestamp: string;
  }>>([]);

  const getInfluencerMatches = useCallback(
    (influencer: InfluencerProfile, gigs: Gig[], limit: number = 10) => {
      console.log(`Finding matches for influencer ${influencer.name}`);
      const matches = findBestGigsForInfluencer(influencer, gigs, limit);
      console.log(`Found ${matches.length} matches`);
      return matches;
    },
    []
  );

  const getSponsorMatches = useCallback(
    (sponsor: SponsorProfile, influencers: InfluencerProfile[], budget: number = 10000, limit: number = 20) => {
      console.log(`Finding matches for sponsor ${sponsor.company}`);
      const matches = findBestInfluencersForSponsor(sponsor, influencers, budget, limit);
      console.log(`Found ${matches.length} matches`);
      return matches;
    },
    []
  );

  const getGigMatches = useCallback(
    (gig: Gig, influencers: InfluencerProfile[], limit: number = 10) => {
      console.log(`Finding matches for gig ${gig.title}`);
      const matches = findBestInfluencersForGig(influencers, gig, limit);
      console.log(`Found ${matches.length} matches`);
      return matches;
    },
    []
  );

  const calculateMatch = useCallback(
    (influencer: InfluencerProfile, gig: Gig): MatchScore => {
      return calculateInfluencerGigMatch(influencer, gig);
    },
    []
  );

  const recordMatch = useCallback(
    (userId: string, targetId: string, score: number) => {
      const match = {
        id: `match_${Date.now()}`,
        userId,
        targetId,
        score,
        timestamp: new Date().toISOString(),
      };
      setMatchHistory(prev => [match, ...prev]);
      console.log(`Match recorded: ${userId} -> ${targetId} (${score}%)`);
    },
    []
  );

  const getMatchHistory = useCallback(
    (userId: string) => {
      return matchHistory.filter(m => m.userId === userId);
    },
    [matchHistory]
  );

  return useMemo(
    () => ({
      getInfluencerMatches,
      getSponsorMatches,
      getGigMatches,
      calculateMatch,
      recordMatch,
      getMatchHistory,
      matchHistory,
    }),
    [getInfluencerMatches, getSponsorMatches, getGigMatches, calculateMatch, recordMatch, getMatchHistory, matchHistory]
  );
});
