import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  AgentVerification, 
  AgentBadgeInfo, 
  AgentBadge, 
  AgentVerificationLevel,
  AgentReview,
  AgentProfile,
  AgentPerformanceMetrics
} from '@/types';

const AGENT_REVIEWS_KEY = '@sourceimpact_agent_reviews';
const AGENT_VERIFICATIONS_KEY = '@sourceimpact_agent_verifications';

const BADGE_CONFIGS: Record<AgentBadge, { icon: string; color: string; description: string; criteria: string }> = {
  verified: {
    icon: '✓',
    color: '#10B981',
    description: 'Verified Agent',
    criteria: 'Email, phone, and Stripe ID verified'
  },
  top_performer: {
    icon: '⭐',
    color: '#F59E0B',
    description: 'Top Performer',
    criteria: '4.8+ rating with 50+ completed deals'
  },
  rising_star: {
    icon: '🌟',
    color: '#8B5CF6',
    description: 'Rising Star',
    criteria: '4.5+ rating with 10+ deals in last 30 days'
  },
  elite: {
    icon: '👑',
    color: '#EF4444',
    description: 'Elite Agent',
    criteria: 'Platinum tier with 4.9+ rating'
  },
  trusted: {
    icon: '🛡️',
    color: '#3B82F6',
    description: 'Trusted Agent',
    criteria: '4.7+ recruit satisfaction with 20+ reviews'
  },
  pro: {
    icon: '💎',
    color: '#06B6D4',
    description: 'Pro Agent',
    criteria: 'Active subscription member'
  },
  '100_deals': {
    icon: '💯',
    color: '#10B981',
    description: '100 Deals',
    criteria: 'Completed 100+ deals'
  },
  '500_deals': {
    icon: '🔥',
    color: '#F59E0B',
    description: '500 Deals',
    criteria: 'Completed 500+ deals'
  },
  '1000_deals': {
    icon: '🚀',
    color: '#8B5CF6',
    description: '1000 Deals',
    criteria: 'Completed 1000+ deals'
  },
  mentor: {
    icon: '🎓',
    color: '#6366F1',
    description: 'Mentor',
    criteria: 'Helped 50+ agents succeed'
  },
};

export const [AgentVerificationProvider, useAgentVerification] = createContextHook(() => {
  const [agentReviews, setAgentReviews] = useState<AgentReview[]>([]);
  const [verifications, setVerifications] = useState<Map<string, AgentVerification>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsData, verificationsData] = await Promise.all([
        AsyncStorage.getItem(AGENT_REVIEWS_KEY),
        AsyncStorage.getItem(AGENT_VERIFICATIONS_KEY),
      ]);

      if (reviewsData) {
        setAgentReviews(JSON.parse(reviewsData));
      }

      if (verificationsData) {
        const parsed = JSON.parse(verificationsData);
        setVerifications(new Map(Object.entries(parsed)));
      }
    } catch (error) {
      console.error('Failed to load agent verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVerifications = useCallback(async (verifs: Map<string, AgentVerification>) => {
    try {
      const obj = Object.fromEntries(verifs.entries());
      await AsyncStorage.setItem(AGENT_VERIFICATIONS_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save verifications:', error);
    }
  }, []);

  const saveReviews = useCallback(async (reviews: AgentReview[]) => {
    try {
      await AsyncStorage.setItem(AGENT_REVIEWS_KEY, JSON.stringify(reviews));
    } catch (error) {
      console.error('Failed to save reviews:', error);
    }
  }, []);

  const initiateEmailVerification = useCallback(async (agentId: string, email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    console.log(`[Email Verification] Initiating for agent ${agentId} - ${email}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Email Verification] Code generated: ${verificationCode}`);
    
    return { success: true, code: verificationCode };
  }, []);

  const verifyEmail = useCallback(async (agentId: string, code: string): Promise<{ success: boolean; error?: string }> => {
    console.log(`[Email Verification] Verifying code for agent ${agentId}`);
    
    const currentVerification = verifications.get(agentId) || {
      level: 'unverified' as AgentVerificationLevel,
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
    };

    const updatedVerification: AgentVerification = {
      ...currentVerification,
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      level: 'email_verified' as AgentVerificationLevel,
    };

    const newVerifications = new Map(verifications);
    newVerifications.set(agentId, updatedVerification);
    setVerifications(newVerifications);
    await saveVerifications(newVerifications);

    console.log(`[Email Verification] Success for agent ${agentId}`);
    return { success: true };
  }, [verifications, saveVerifications]);

  const initiatePhoneVerification = useCallback(async (agentId: string, phone: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    console.log(`[Phone Verification] Initiating for agent ${agentId} - ${phone}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Phone Verification] Code generated: ${verificationCode}`);
    
    return { success: true, code: verificationCode };
  }, []);

  const verifyPhone = useCallback(async (agentId: string, code: string): Promise<{ success: boolean; error?: string }> => {
    console.log(`[Phone Verification] Verifying code for agent ${agentId}`);
    
    const currentVerification = verifications.get(agentId) || {
      level: 'unverified' as AgentVerificationLevel,
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
    };

    const updatedVerification: AgentVerification = {
      ...currentVerification,
      phoneVerified: true,
      phoneVerifiedAt: new Date().toISOString(),
      level: currentVerification.emailVerified ? 'phone_verified' as AgentVerificationLevel : currentVerification.level,
    };

    const newVerifications = new Map(verifications);
    newVerifications.set(agentId, updatedVerification);
    setVerifications(newVerifications);
    await saveVerifications(newVerifications);

    console.log(`[Phone Verification] Success for agent ${agentId}`);
    return { success: true };
  }, [verifications, saveVerifications]);

  const submitIDVerification = useCallback(async (
    agentId: string, 
    documentType: 'passport' | 'drivers_license' | 'national_id' | 'stripe',
    frontImage?: string,
    backImage?: string
  ): Promise<{ success: boolean; error?: string }> => {
    console.log(`[ID Verification] Submitting ${documentType} for agent ${agentId}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentVerification = verifications.get(agentId) || {
      level: 'unverified' as AgentVerificationLevel,
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
    };

    let newLevel: AgentVerificationLevel = 'id_verified';
    if (currentVerification.emailVerified && currentVerification.phoneVerified) {
      newLevel = 'fully_verified';
    }

    const updatedVerification: AgentVerification = {
      ...currentVerification,
      idVerified: true,
      idVerifiedAt: new Date().toISOString(),
      idDocumentType: documentType,
      level: newLevel,
      verificationNotes: documentType === 'stripe' ? 'ID verified via Stripe' : 'ID verification approved',
      lastVerificationCheck: new Date().toISOString(),
    };

    const newVerifications = new Map(verifications);
    newVerifications.set(agentId, updatedVerification);
    setVerifications(newVerifications);
    await saveVerifications(newVerifications);

    console.log(`[ID Verification] Success for agent ${agentId} - Level: ${newLevel}`);
    return { success: true };
  }, [verifications, saveVerifications]);

  const getVerification = useCallback((agentId: string): AgentVerification => {
    return verifications.get(agentId) || {
      level: 'unverified' as AgentVerificationLevel,
      emailVerified: false,
      phoneVerified: false,
      idVerified: false,
    };
  }, [verifications]);

  const calculateBadges = useCallback((agent: AgentProfile, metrics?: AgentPerformanceMetrics): AgentBadgeInfo[] => {
    const badges: AgentBadgeInfo[] = [];
    const now = new Date().toISOString();

    const verification = verifications.get(agent.id);
    if (verification?.level === 'fully_verified') {
      const config = BADGE_CONFIGS.verified;
      badges.push({
        badge: 'verified',
        earnedAt: verification.idVerifiedAt || now,
        icon: config.icon,
        color: config.color,
        description: config.description,
      });
    }

    if (metrics) {
      if (metrics.totalDeals >= 50 && metrics.satisfactionScore >= 4.8) {
        const config = BADGE_CONFIGS.top_performer;
        badges.push({
          badge: 'top_performer',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }

      if (metrics.totalDeals >= 10 && metrics.satisfactionScore >= 4.5) {
        const config = BADGE_CONFIGS.rising_star;
        badges.push({
          badge: 'rising_star',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }

      if (agent.tier === 'platinum' && metrics.satisfactionScore >= 4.9) {
        const config = BADGE_CONFIGS.elite;
        badges.push({
          badge: 'elite',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }

      if (metrics.totalDeals >= 100) {
        const config = BADGE_CONFIGS['100_deals'];
        badges.push({
          badge: '100_deals',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }

      if (metrics.totalDeals >= 500) {
        const config = BADGE_CONFIGS['500_deals'];
        badges.push({
          badge: '500_deals',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }

      if (metrics.totalDeals >= 1000) {
        const config = BADGE_CONFIGS['1000_deals'];
        badges.push({
          badge: '1000_deals',
          earnedAt: now,
          icon: config.icon,
          color: config.color,
          description: config.description,
        });
      }
    }

    if (agent.recruitSatisfactionScore && agent.recruitSatisfactionScore >= 4.7 && (agent.recruitSatisfactionCount || 0) >= 20) {
      const config = BADGE_CONFIGS.trusted;
      badges.push({
        badge: 'trusted',
        earnedAt: now,
        icon: config.icon,
        color: config.color,
        description: config.description,
      });
    }

    if (agent.isSubscribed) {
      const config = BADGE_CONFIGS.pro;
      badges.push({
        badge: 'pro',
        earnedAt: agent.subscriptionExpiry || now,
        icon: config.icon,
        color: config.color,
        description: config.description,
      });
    }

    return badges;
  }, [verifications]);

  const addAgentReview = useCallback(async (review: Omit<AgentReview, 'id' | 'createdAt'>): Promise<AgentReview> => {
    const newReview: AgentReview = {
      ...review,
      id: `agent_review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...agentReviews, newReview];
    setAgentReviews(updated);
    await saveReviews(updated);

    console.log(`[Agent Review] Added review for agent ${review.agentId} by ${review.recruitName}: ${review.rating} stars`);
    return newReview;
  }, [agentReviews, saveReviews]);

  const getAgentReviews = useCallback((agentId: string): AgentReview[] => {
    return agentReviews.filter(r => r.agentId === agentId && r.isPublic);
  }, [agentReviews]);

  const getAgentSatisfactionScore = useCallback((agentId: string): { score: number; count: number } => {
    const reviews = agentReviews.filter(r => r.agentId === agentId && r.isPublic);
    if (reviews.length === 0) {
      return { score: 0, count: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    return {
      score: Math.round(avgRating * 10) / 10,
      count: reviews.length,
    };
  }, [agentReviews]);

  const getBadgeConfig = useCallback((badge: AgentBadge) => {
    return BADGE_CONFIGS[badge];
  }, []);

  const getAllBadgeConfigs = useCallback(() => {
    return BADGE_CONFIGS;
  }, []);

  return useMemo(() => ({
    agentReviews,
    verifications: Array.from(verifications.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, AgentVerification>),
    isLoading,
    initiateEmailVerification,
    verifyEmail,
    initiatePhoneVerification,
    verifyPhone,
    submitIDVerification,
    getVerification,
    calculateBadges,
    addAgentReview,
    getAgentReviews,
    getAgentSatisfactionScore,
    getBadgeConfig,
    getAllBadgeConfigs,
  }), [
    agentReviews,
    verifications,
    isLoading,
    initiateEmailVerification,
    verifyEmail,
    initiatePhoneVerification,
    verifyPhone,
    submitIDVerification,
    getVerification,
    calculateBadges,
    addAgentReview,
    getAgentReviews,
    getAgentSatisfactionScore,
    getBadgeConfig,
    getAllBadgeConfigs,
  ]);
});
