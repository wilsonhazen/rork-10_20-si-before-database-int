import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  SavedGig, 
  GigComparison, 
  BrandReputation, 
  InfluencerWishlist,
  Gig,
  Deal,
  Review
} from '@/types';

const SAVED_GIGS_KEY = '@sourceimpact_saved_gigs';
const COMPARISONS_KEY = '@sourceimpact_comparisons';
const REPUTATIONS_KEY = '@sourceimpact_reputations';
const WISHLISTS_KEY = '@sourceimpact_wishlists';

export const [BrandCollaborationProvider, useBrandCollaboration] = createContextHook(() => {
  const [savedGigs, setSavedGigs] = useState<SavedGig[]>([]);
  const [comparisons, setComparisons] = useState<GigComparison[]>([]);
  const [reputations, setReputations] = useState<BrandReputation[]>([]);
  const [wishlists, setWishlists] = useState<InfluencerWishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedData, comparisonData, reputationData, wishlistData] = await Promise.all([
        AsyncStorage.getItem(SAVED_GIGS_KEY),
        AsyncStorage.getItem(COMPARISONS_KEY),
        AsyncStorage.getItem(REPUTATIONS_KEY),
        AsyncStorage.getItem(WISHLISTS_KEY),
      ]);

      if (savedData) setSavedGigs(JSON.parse(savedData));
      if (comparisonData) setComparisons(JSON.parse(comparisonData));
      if (reputationData) setReputations(JSON.parse(reputationData));
      if (wishlistData) setWishlists(JSON.parse(wishlistData));
    } catch (error) {
      console.error('Failed to load brand collaboration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGig = useCallback(async (userId: string, gigId: string, notes?: string) => {
    const saved: SavedGig = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      gigId,
      savedAt: new Date().toISOString(),
      notes,
    };
    const updated = [...savedGigs, saved];
    setSavedGigs(updated);
    await AsyncStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(updated));
  }, [savedGigs]);

  const unsaveGig = useCallback(async (userId: string, gigId: string) => {
    const updated = savedGigs.filter(sg => !(sg.userId === userId && sg.gigId === gigId));
    setSavedGigs(updated);
    await AsyncStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(updated));
  }, [savedGigs]);

  const isGigSaved = useCallback((userId: string, gigId: string) => {
    return savedGigs.some(sg => sg.userId === userId && sg.gigId === gigId);
  }, [savedGigs]);

  const getSavedGigsByUser = useCallback((userId: string) => {
    return savedGigs.filter(sg => sg.userId === userId);
  }, [savedGigs]);

  const createComparison = useCallback(async (userId: string, gigIds: string[], name?: string) => {
    const comparison: GigComparison = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      gigIds,
      createdAt: new Date().toISOString(),
      name,
    };
    const updated = [...comparisons, comparison];
    setComparisons(updated);
    await AsyncStorage.setItem(COMPARISONS_KEY, JSON.stringify(updated));
    return comparison;
  }, [comparisons]);

  const deleteComparison = useCallback(async (comparisonId: string) => {
    const updated = comparisons.filter(c => c.id !== comparisonId);
    setComparisons(updated);
    await AsyncStorage.setItem(COMPARISONS_KEY, JSON.stringify(updated));
  }, [comparisons]);

  const getComparisonsByUser = useCallback((userId: string) => {
    return comparisons.filter(c => c.userId === userId);
  }, [comparisons]);

  const calculateBrandReputation = useCallback((
    sponsorId: string,
    deals: Deal[],
    reviews: Review[]
  ): BrandReputation => {
    const sponsorDeals = deals.filter(d => d.sponsorId === sponsorId && d.status === 'completed');
    const sponsorReviews = reviews.filter(r => r.reviewedUserId === sponsorId);

    const paymentSpeedRating = sponsorReviews.reduce((sum, r) => sum + (r.categories.timeliness || 0), 0) / (sponsorReviews.length || 1);
    const communicationRating = sponsorReviews.reduce((sum, r) => sum + (r.categories.communication || 0), 0) / (sponsorReviews.length || 1);
    const professionalismRating = sponsorReviews.reduce((sum, r) => sum + (r.categories.professionalism || 0), 0) / (sponsorReviews.length || 1);
    const overallRating = sponsorReviews.reduce((sum, r) => sum + r.rating, 0) / (sponsorReviews.length || 1);

    const paymentTimes = sponsorDeals
      .filter(d => d.completedAt && d.createdAt)
      .map(d => {
        const completed = new Date(d.completedAt!).getTime();
        const created = new Date(d.createdAt).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24);
      });

    const averagePaymentTime = paymentTimes.length > 0
      ? paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length
      : 0;

    return {
      sponsorId,
      overallRating,
      paymentSpeedRating,
      communicationRating,
      professionalismRating,
      totalDeals: sponsorDeals.length,
      averagePaymentTime,
      reviewCount: sponsorReviews.length,
    };
  }, []);

  const updateBrandReputation = useCallback(async (reputation: BrandReputation) => {
    const updated = reputations.filter(r => r.sponsorId !== reputation.sponsorId);
    updated.push(reputation);
    setReputations(updated);
    await AsyncStorage.setItem(REPUTATIONS_KEY, JSON.stringify(updated));
  }, [reputations]);

  const getBrandReputation = useCallback((sponsorId: string) => {
    return reputations.find(r => r.sponsorId === sponsorId);
  }, [reputations]);

  const createWishlist = useCallback(async (sponsorId: string, name: string, description?: string) => {
    const wishlist: InfluencerWishlist = {
      id: `wishlist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sponsorId,
      influencerIds: [],
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...wishlists, wishlist];
    setWishlists(updated);
    await AsyncStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
    return wishlist;
  }, [wishlists]);

  const addToWishlist = useCallback(async (wishlistId: string, influencerId: string) => {
    const updated = wishlists.map(w => {
      if (w.id === wishlistId && !w.influencerIds.includes(influencerId)) {
        return {
          ...w,
          influencerIds: [...w.influencerIds, influencerId],
          updatedAt: new Date().toISOString(),
        };
      }
      return w;
    });
    setWishlists(updated);
    await AsyncStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
  }, [wishlists]);

  const removeFromWishlist = useCallback(async (wishlistId: string, influencerId: string) => {
    const updated = wishlists.map(w => {
      if (w.id === wishlistId) {
        return {
          ...w,
          influencerIds: w.influencerIds.filter(id => id !== influencerId),
          updatedAt: new Date().toISOString(),
        };
      }
      return w;
    });
    setWishlists(updated);
    await AsyncStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
  }, [wishlists]);

  const deleteWishlist = useCallback(async (wishlistId: string) => {
    const updated = wishlists.filter(w => w.id !== wishlistId);
    setWishlists(updated);
    await AsyncStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
  }, [wishlists]);

  const getWishlistsBySponsor = useCallback((sponsorId: string) => {
    return wishlists.filter(w => w.sponsorId === sponsorId);
  }, [wishlists]);

  return useMemo(() => ({
    savedGigs,
    comparisons,
    reputations,
    wishlists,
    isLoading,
    saveGig,
    unsaveGig,
    isGigSaved,
    getSavedGigsByUser,
    createComparison,
    deleteComparison,
    getComparisonsByUser,
    calculateBrandReputation,
    updateBrandReputation,
    getBrandReputation,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist,
    getWishlistsBySponsor,
  }), [
    savedGigs,
    comparisons,
    reputations,
    wishlists,
    isLoading,
    saveGig,
    unsaveGig,
    isGigSaved,
    getSavedGigsByUser,
    createComparison,
    deleteComparison,
    getComparisonsByUser,
    calculateBrandReputation,
    updateBrandReputation,
    getBrandReputation,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    deleteWishlist,
    getWishlistsBySponsor,
  ]);
});
