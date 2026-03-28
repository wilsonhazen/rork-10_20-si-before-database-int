import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';


const SUBSCRIPTIONS_KEY = '@sourceimpact_subscriptions';

const TRANSACTION_FEES_KEY = '@sourceimpact_transaction_fees';
const MONETIZATION_STATS_KEY = '@sourceimpact_monetization_stats';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    monthlyApplications?: number;
    monthlyGigPosts?: number;
    analyticsHistory?: number;
    aiCredits?: number;
    teamMembers?: number;
    campaignsCount?: number;
    brandCollaborations?: number;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  price: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  autoRenew: boolean;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  cancelledAt?: string;
  pausedAt?: string;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  category: 'analytics' | 'ai' | 'visibility' | 'networking' | 'deals' | 'campaigns';
  isOneTime: boolean;
  oneTimePrice?: number;
}

export interface TransactionFee {
  id: string;
  dealId: string;
  dealAmount: number;
  feePercentage: number;
  feeAmount: number;
  recipientType: 'platform' | 'agent';
  recipientId?: string;
  status: 'pending' | 'collected' | 'refunded';
  collectedAt?: string;
  refundedAt?: string;
}

export interface MonetizationStats {
  totalSubscriptionRevenue: number;
  totalTransactionFees: number;
  totalOneTimePurchases: number;
  activeSubscribers: {
    free: number;
    basic: number;
    pro: number;
    enterprise: number;
  };
  churnRate: number;
  lifetimeValue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '5 gig applications per month',
      'Basic profile',
      'Discovery feed',
      'Direct messaging',
      '7 days analytics history',
      '10 AI credits per month',
    ],
    limits: {
      monthlyApplications: 5,
      monthlyGigPosts: 1,
      analyticsHistory: 7,
      aiCredits: 10,
      teamMembers: 1,
      campaignsCount: 1,
      brandCollaborations: 3,
    },
  },
  {
    tier: 'basic',
    name: 'Basic',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      'Unlimited gig applications',
      'Enhanced profile',
      'Priority in discovery',
      'Advanced messaging',
      '30 days analytics history',
      '100 AI credits per month',
      'Profile verification badge',
      '3 active campaigns',
    ],
    limits: {
      monthlyGigPosts: 10,
      analyticsHistory: 30,
      aiCredits: 100,
      teamMembers: 3,
      campaignsCount: 3,
      brandCollaborations: 10,
    },
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      'All Basic features',
      'Unlimited gig posts',
      'Featured profile placement',
      'AI-powered matching',
      '90 days analytics history',
      '500 AI credits per month',
      'Advanced analytics dashboard',
      'Unlimited campaigns',
      'Priority support',
      'Custom contract templates',
      'Bulk messaging',
    ],
    limits: {
      analyticsHistory: 90,
      aiCredits: 500,
      teamMembers: 10,
      brandCollaborations: 50,
    },
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      'All Pro features',
      'Unlimited everything',
      'White-label solutions',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'Unlimited AI credits',
      'Custom analytics reports',
      'Team collaboration tools',
      'Priority deal placement',
      'Custom branding',
      '24/7 premium support',
    ],
    limits: {
      analyticsHistory: 365,
    },
  },
];

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'boost_profile',
    name: 'Profile Boost',
    description: 'Feature your profile at the top of discovery for 7 days',
    requiredTier: 'free',
    category: 'visibility',
    isOneTime: true,
    oneTimePrice: 29,
  },
  {
    id: 'boost_gig',
    name: 'Gig Boost',
    description: 'Promote your gig to top of search results for 7 days',
    requiredTier: 'free',
    category: 'visibility',
    isOneTime: true,
    oneTimePrice: 19,
  },
  {
    id: 'ai_profile_optimizer',
    name: 'AI Profile Optimizer',
    description: 'Get AI-powered suggestions to optimize your profile',
    requiredTier: 'free',
    category: 'ai',
    isOneTime: true,
    oneTimePrice: 9,
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Unlock detailed performance metrics and insights',
    requiredTier: 'basic',
    category: 'analytics',
    isOneTime: false,
  },
  {
    id: 'ai_contract_generator',
    name: 'AI Contract Generator',
    description: 'Generate custom contracts with AI',
    requiredTier: 'basic',
    category: 'ai',
    isOneTime: false,
  },
  {
    id: 'verified_badge',
    name: 'Verified Badge',
    description: 'Display a verified badge on your profile',
    requiredTier: 'basic',
    category: 'visibility',
    isOneTime: false,
  },
  {
    id: 'priority_matching',
    name: 'Priority Matching',
    description: 'Get matched with top opportunities first',
    requiredTier: 'pro',
    category: 'deals',
    isOneTime: false,
  },
  {
    id: 'campaign_manager',
    name: 'Campaign Manager',
    description: 'Manage multiple campaigns with advanced tools',
    requiredTier: 'pro',
    category: 'campaigns',
    isOneTime: false,
  },
];

export const [MonetizationProvider, useMonetization] = createContextHook(() => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [transactionFees, setTransactionFees] = useState<TransactionFee[]>([]);
  const [stats, setStats] = useState<MonetizationStats>({
    totalSubscriptionRevenue: 0,
    totalTransactionFees: 0,
    totalOneTimePurchases: 0,
    activeSubscribers: { free: 0, basic: 0, pro: 0, enterprise: 0 },
    churnRate: 0,
    lifetimeValue: 0,
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsData, feesData, statsData] = await Promise.all([
        AsyncStorage.getItem(SUBSCRIPTIONS_KEY),
        AsyncStorage.getItem(TRANSACTION_FEES_KEY),
        AsyncStorage.getItem(MONETIZATION_STATS_KEY),
      ]);

      if (subsData) setSubscriptions(JSON.parse(subsData));
      if (feesData) setTransactionFees(JSON.parse(feesData));
      if (statsData) setStats(JSON.parse(statsData));
    } catch (error) {
      console.error('[Monetization] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = useCallback(async () => {
    const activeSubscribers = subscriptions.filter(s => s.status === 'active');
    const tierCounts = activeSubscribers.reduce(
      (acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      },
      { free: 0, basic: 0, pro: 0, enterprise: 0 } as Record<SubscriptionTier, number>
    );

    const totalSubRevenue = activeSubscribers.reduce((sum, sub) => sum + sub.price, 0);
    const totalFees = transactionFees
      .filter(f => f.status === 'collected')
      .reduce((sum, f) => sum + f.feeAmount, 0);

    const mrr = activeSubscribers
      .filter(s => s.billingPeriod === 'monthly')
      .reduce((sum, s) => sum + s.price, 0) +
      activeSubscribers
        .filter(s => s.billingPeriod === 'yearly')
        .reduce((sum, s) => sum + s.price / 12, 0);

    const arr = mrr * 12;

    const updatedStats: MonetizationStats = {
      totalSubscriptionRevenue: totalSubRevenue,
      totalTransactionFees: totalFees,
      totalOneTimePurchases: 0,
      activeSubscribers: tierCounts,
      churnRate: 0,
      lifetimeValue: 0,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: arr,
    };

    setStats(updatedStats);
    await AsyncStorage.setItem(MONETIZATION_STATS_KEY, JSON.stringify(updatedStats));
  }, [subscriptions, transactionFees]);

  const createSubscription = useCallback(async (
    userId: string,
    tier: SubscriptionTier,
    billingPeriod: BillingPeriod,
    paymentMethod?: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
    try {
      console.log('[Monetization] Creating subscription:', { userId, tier, billingPeriod });

      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
      if (!plan) {
        return { success: false, error: 'Invalid subscription tier' };
      }

      const existingSub = subscriptions.find(
        s => s.userId === userId && s.status === 'active'
      );

      if (existingSub) {
        return { success: false, error: 'User already has an active subscription' };
      }

      const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (billingPeriod === 'monthly' ? 1 : 12));

      const subscription: UserSubscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        tier,
        billingPeriod,
        price,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        autoRenew: true,
        paymentMethod,
        stripeSubscriptionId: `stripe_${Date.now()}`,
      };

      const updated = [...subscriptions, subscription];
      setSubscriptions(updated);
      await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(updated));
      await updateStats();

      console.log('[Monetization] Subscription created:', subscription.id);
      return { success: true, subscriptionId: subscription.id };
    } catch (error) {
      console.error('[Monetization] Subscription creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }, [subscriptions, updateStats]);

  const cancelSubscription = useCallback(async (
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Monetization] Cancelling subscription:', subscriptionId);

      const updated = subscriptions.map(s =>
        s.id === subscriptionId
          ? { ...s, status: 'cancelled' as const, autoRenew: false, cancelledAt: new Date().toISOString() }
          : s
      );
      setSubscriptions(updated);
      await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(updated));
      await updateStats();

      return { success: true };
    } catch (error) {
      console.error('[Monetization] Subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }, [subscriptions, updateStats]);

  const upgradeSubscription = useCallback(async (
    userId: string,
    newTier: SubscriptionTier,
    billingPeriod: BillingPeriod
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Monetization] Upgrading subscription:', { userId, newTier });

      const currentSub = subscriptions.find(
        s => s.userId === userId && s.status === 'active'
      );

      if (!currentSub) {
        return await createSubscription(userId, newTier, billingPeriod);
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === newTier);
      if (!plan) {
        return { success: false, error: 'Invalid subscription tier' };
      }

      const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

      const updated = subscriptions.map(s =>
        s.id === currentSub.id
          ? {
              ...s,
              tier: newTier,
              billingPeriod,
              price,
            }
          : s
      );
      setSubscriptions(updated);
      await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(updated));
      await updateStats();

      console.log('[Monetization] Subscription upgraded');
      return { success: true };
    } catch (error) {
      console.error('[Monetization] Subscription upgrade error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upgrade subscription',
      };
    }
  }, [subscriptions, createSubscription, updateStats]);

  const recordTransactionFee = useCallback(async (
    dealId: string,
    dealAmount: number,
    recipientType: 'platform' | 'agent',
    recipientId?: string
  ): Promise<{ success: boolean; feeId?: string; error?: string }> => {
    try {
      const feePercentage = 10;
      const feeAmount = dealAmount * (feePercentage / 100);

      const fee: TransactionFee = {
        id: `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealId,
        dealAmount,
        feePercentage,
        feeAmount,
        recipientType,
        recipientId,
        status: 'collected',
        collectedAt: new Date().toISOString(),
      };

      const updated = [...transactionFees, fee];
      setTransactionFees(updated);
      await AsyncStorage.setItem(TRANSACTION_FEES_KEY, JSON.stringify(updated));
      await updateStats();

      console.log(`[Monetization] Transaction fee recorded: ${feeAmount.toFixed(2)} (${feePercentage}% of ${dealAmount.toFixed(2)})`);
      return { success: true, feeId: fee.id };
    } catch (error) {
      console.error('[Monetization] Transaction fee recording error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record transaction fee',
      };
    }
  }, [transactionFees, updateStats]);



  const getUserSubscription = useCallback((userId: string): UserSubscription | undefined => {
    return subscriptions.find(s => s.userId === userId && s.status === 'active');
  }, [subscriptions]);

  const getUserTier = useCallback((userId: string): SubscriptionTier => {
    const subscription = getUserSubscription(userId);
    return subscription?.tier || 'free';
  }, [getUserSubscription]);

  const hasFeatureAccess = useCallback((userId: string, featureId: string): boolean => {
    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;

    const userTier = getUserTier(userId);
    const tierHierarchy: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(feature.requiredTier);

    return userTierIndex >= requiredTierIndex;
  }, [getUserTier]);

  const checkLimit = useCallback((
    userId: string,
    limitType: keyof SubscriptionPlan['limits'],
    currentUsage: number
  ): { allowed: boolean; limit?: number; remaining?: number } => {
    const userTier = getUserTier(userId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === userTier);
    
    if (!plan) return { allowed: false };

    const limit = plan.limits[limitType];
    
    if (limit === undefined) {
      return { allowed: true };
    }

    const remaining = Math.max(0, limit - currentUsage);
    return {
      allowed: currentUsage < limit,
      limit,
      remaining,
    };
  }, [getUserTier]);

  return useMemo(
    () => ({
      subscriptions,
      transactionFees,
      stats,
      plans: SUBSCRIPTION_PLANS,
      premiumFeatures: PREMIUM_FEATURES,
      isLoading,
      createSubscription,
      cancelSubscription,
      upgradeSubscription,
      recordTransactionFee,
      getUserSubscription,
      getUserTier,
      hasFeatureAccess,
      checkLimit,
      updateStats,
    }),
    [
      subscriptions,
      transactionFees,
      stats,
      isLoading,
      createSubscription,
      cancelSubscription,
      upgradeSubscription,
      recordTransactionFee,
      getUserSubscription,
      getUserTier,
      hasFeatureAccess,
      checkLimit,
      updateStats,
    ]
  );
});
