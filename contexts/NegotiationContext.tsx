import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  Negotiation, 
  NegotiationOffer, 
  MarketRateData, 
  PackageDeal,
  UserRole 
} from '@/types';

const NEGOTIATIONS_KEY = '@sourceimpact_negotiations';
const MARKET_RATES_KEY = '@sourceimpact_market_rates';
const PACKAGE_DEALS_KEY = '@sourceimpact_package_deals';

export const [NegotiationProvider, useNegotiations] = createContextHook(() => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [marketRates, setMarketRates] = useState<MarketRateData[]>([]);
  const [packageDeals, setPackageDeals] = useState<PackageDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [negotiationsData, ratesData, packagesData] = await Promise.all([
        AsyncStorage.getItem(NEGOTIATIONS_KEY),
        AsyncStorage.getItem(MARKET_RATES_KEY),
        AsyncStorage.getItem(PACKAGE_DEALS_KEY),
      ]);

      if (negotiationsData) setNegotiations(JSON.parse(negotiationsData));
      if (ratesData) setMarketRates(JSON.parse(ratesData));
      else generateMockMarketRates();
      if (packagesData) setPackageDeals(JSON.parse(packagesData));
    } catch (error) {
      console.error('Failed to load negotiation data:', error);
      generateMockMarketRates();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockMarketRates = () => {
    const rates: MarketRateData[] = [
      {
        influencerType: 'Fitness & Wellness',
        followerRange: { min: 10000, max: 50000 },
        averageRate: 1500,
        minRate: 800,
        maxRate: 2500,
        engagementFactor: 1.2,
      },
      {
        influencerType: 'Fitness & Wellness',
        followerRange: { min: 50000, max: 100000 },
        averageRate: 3000,
        minRate: 2000,
        maxRate: 4500,
        engagementFactor: 1.3,
      },
      {
        influencerType: 'Fitness & Wellness',
        followerRange: { min: 100000, max: 500000 },
        averageRate: 6000,
        minRate: 4000,
        maxRate: 8500,
        engagementFactor: 1.4,
      },
      {
        influencerType: 'Fashion & Beauty',
        followerRange: { min: 10000, max: 50000 },
        averageRate: 1800,
        minRate: 1000,
        maxRate: 2800,
        engagementFactor: 1.3,
      },
      {
        influencerType: 'Tech & Gaming',
        followerRange: { min: 10000, max: 50000 },
        averageRate: 2000,
        minRate: 1200,
        maxRate: 3200,
        engagementFactor: 1.4,
      },
    ];
    
    setMarketRates(rates);
    AsyncStorage.setItem(MARKET_RATES_KEY, JSON.stringify(rates));
  };

  const startNegotiation = useCallback(async (
    gigId: string,
    influencerId: string,
    sponsorId: string,
    initialOffer: {
      amount: number;
      deliverables: string[];
      timeline: string;
      message?: string;
    },
    fromRole: UserRole
  ) => {
    const offer: NegotiationOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fromUserId: fromRole === 'influencer' ? influencerId : sponsorId,
      fromUserRole: fromRole,
      amount: initialOffer.amount,
      deliverables: initialOffer.deliverables,
      timeline: initialOffer.timeline,
      message: initialOffer.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const negotiation: Negotiation = {
      id: `neg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      gigId,
      influencerId,
      sponsorId,
      status: 'open',
      offers: [offer],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const updated = [...negotiations, negotiation];
    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
    return negotiation;
  }, [negotiations]);

  const addCounterOffer = useCallback(async (
    negotiationId: string,
    fromUserId: string,
    fromUserRole: UserRole,
    counterOffer: {
      amount: number;
      deliverables: string[];
      timeline: string;
      message?: string;
    }
  ) => {
    const offer: NegotiationOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fromUserId,
      fromUserRole,
      amount: counterOffer.amount,
      deliverables: counterOffer.deliverables,
      timeline: counterOffer.timeline,
      message: counterOffer.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = negotiations.map(n => {
      if (n.id === negotiationId) {
        const lastOffer = n.offers[n.offers.length - 1];
        return {
          ...n,
          offers: [
            ...n.offers.slice(0, -1),
            { ...lastOffer, status: 'countered' as const, respondedAt: new Date().toISOString() },
            offer,
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
  }, [negotiations]);

  const acceptOffer = useCallback(async (negotiationId: string) => {
    const updated = negotiations.map(n => {
      if (n.id === negotiationId) {
        const lastOffer = n.offers[n.offers.length - 1];
        return {
          ...n,
          status: 'accepted' as const,
          offers: [
            ...n.offers.slice(0, -1),
            { ...lastOffer, status: 'accepted' as const, respondedAt: new Date().toISOString() },
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
  }, [negotiations]);

  const rejectOffer = useCallback(async (negotiationId: string) => {
    const updated = negotiations.map(n => {
      if (n.id === negotiationId) {
        const lastOffer = n.offers[n.offers.length - 1];
        return {
          ...n,
          status: 'rejected' as const,
          offers: [
            ...n.offers.slice(0, -1),
            { ...lastOffer, status: 'rejected' as const, respondedAt: new Date().toISOString() },
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
  }, [negotiations]);

  const getSuggestedRate = useCallback((
    influencerType: string,
    followers: number,
    engagementRate: number
  ): { min: number; average: number; max: number } => {
    const matchingRate = marketRates.find(
      rate =>
        rate.influencerType === influencerType &&
        followers >= rate.followerRange.min &&
        followers <= rate.followerRange.max
    );

    if (matchingRate) {
      const engagementMultiplier = engagementRate >= 4 ? matchingRate.engagementFactor : 1;
      return {
        min: Math.round(matchingRate.minRate * engagementMultiplier),
        average: Math.round(matchingRate.averageRate * engagementMultiplier),
        max: Math.round(matchingRate.maxRate * engagementMultiplier),
      };
    }

    return { min: 500, average: 1500, max: 3000 };
  }, [marketRates]);

  const getNegotiationsByUser = useCallback((userId: string, role: 'influencer' | 'sponsor') => {
    if (role === 'influencer') {
      return negotiations.filter(n => n.influencerId === userId);
    }
    return negotiations.filter(n => n.sponsorId === userId);
  }, [negotiations]);

  const getNegotiationsByGig = useCallback((gigId: string) => {
    return negotiations.filter(n => n.gigId === gigId);
  }, [negotiations]);

  const createPackageDeal = useCallback(async (packageDeal: PackageDeal) => {
    const updated = [...packageDeals, packageDeal];
    setPackageDeals(updated);
    await AsyncStorage.setItem(PACKAGE_DEALS_KEY, JSON.stringify(updated));
  }, [packageDeals]);

  return useMemo(() => ({
    negotiations,
    marketRates,
    packageDeals,
    isLoading,
    startNegotiation,
    addCounterOffer,
    acceptOffer,
    rejectOffer,
    getSuggestedRate,
    getNegotiationsByUser,
    getNegotiationsByGig,
    createPackageDeal,
  }), [
    negotiations,
    marketRates,
    packageDeals,
    isLoading,
    startNegotiation,
    addCounterOffer,
    acceptOffer,
    rejectOffer,
    getSuggestedRate,
    getNegotiationsByUser,
    getNegotiationsByGig,
    createPackageDeal,
  ]);
});
