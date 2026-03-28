import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { usePayment } from './PaymentContext';
import { useInvites } from './InviteContext';

const ACHIEVEMENTS_KEY = '@sourceimpact_achievements';

export type AgentLeaderboardEntry = {
  agentId: string;
  agentName: string;
  avatar?: string;
  rank: number;
  value: number;
  change?: number;
  badge?: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
  category: 'earnings' | 'recruits' | 'conversion' | 'milestone';
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
};

export type UnlockedAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
};

export type LeaderboardPeriod = 'week' | 'month' | 'quarter' | 'allTime';

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_recruit',
    name: 'First Recruit',
    description: 'Successfully recruit your first user',
    icon: '🎯',
    requirement: 1,
    category: 'milestone' as const,
  },
  {
    id: '10_active_recruits',
    name: '10 Active Recruits',
    description: 'Have 10 active recruits on the platform',
    icon: '👥',
    requirement: 10,
    category: 'recruits' as const,
  },
  {
    id: '50_active_recruits',
    name: 'Recruitment Master',
    description: 'Have 50 active recruits on the platform',
    icon: '🌟',
    requirement: 50,
    category: 'recruits' as const,
  },
  {
    id: '100_active_recruits',
    name: 'Network Builder',
    description: 'Have 100 active recruits on the platform',
    icon: '🏆',
    requirement: 100,
    category: 'recruits' as const,
  },
  {
    id: '1k_earnings',
    name: 'First Thousand',
    description: 'Earn $1,000 in total commissions',
    icon: '💰',
    requirement: 1000,
    category: 'earnings' as const,
  },
  {
    id: '10k_earnings_club',
    name: '$10K Earnings Club',
    description: 'Earn $10,000 in total commissions',
    icon: '💎',
    requirement: 10000,
    category: 'earnings' as const,
    tier: 'platinum' as const,
  },
  {
    id: '25k_earnings',
    name: 'Top Earner',
    description: 'Earn $25,000 in total commissions',
    icon: '👑',
    requirement: 25000,
    category: 'earnings' as const,
    tier: 'platinum' as const,
  },
  {
    id: 'platinum_agent',
    name: 'Platinum Agent',
    description: 'Achieve top tier status with $10K earnings and 50+ recruits',
    icon: '⭐',
    requirement: 1,
    category: 'milestone' as const,
    tier: 'platinum' as const,
  },
  {
    id: 'high_conversion',
    name: 'Conversion Expert',
    description: 'Achieve 50%+ conversion rate with 20+ invites',
    icon: '📈',
    requirement: 50,
    category: 'conversion' as const,
  },
  {
    id: 'fast_grower',
    name: 'Fast Grower',
    description: 'Recruit 10 users in a single month',
    icon: '🚀',
    requirement: 10,
    category: 'milestone' as const,
  },
];

export const [GamificationProvider, useGamification] = createContextHook(() => {
  const { user } = useAuth();
  const { getAgentReferrals, transactions } = usePayment();
  const { getInviteStats } = useInvites();
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    loadUnlockedAchievements();
  }, []);

  const loadUnlockedAchievements = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (stored) {
        setUnlockedAchievements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const saveUnlockedAchievements = async (achievements: UnlockedAchievement[]) => {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      setUnlockedAchievements(achievements);
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  };

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user) return;

    const alreadyUnlocked = unlockedAchievements.some(
      a => a.userId === user.id && a.achievementId === achievementId
    );

    if (alreadyUnlocked) return;

    const newAchievement: UnlockedAchievement = {
      id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      achievementId,
      unlockedAt: new Date().toISOString(),
    };

    const updated = [...unlockedAchievements, newAchievement];
    await saveUnlockedAchievements(updated);
    console.log(`🎉 Achievement unlocked: ${achievementId} for user ${user.id}`);
  }, [user, unlockedAchievements]);

  const checkAndUnlockAchievements = useCallback(async (agentId: string) => {
    const referrals = getAgentReferrals(agentId);
    const agentTransactions = transactions.filter(t => 
      t.type === 'agent_commission' && t.toUser === agentId
    );
    const totalEarnings = agentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const inviteStats = getInviteStats(agentId);

    if (referrals.length >= 1) {
      await unlockAchievement('first_recruit');
    }

    if (referrals.length >= 10) {
      await unlockAchievement('10_active_recruits');
    }

    if (referrals.length >= 50) {
      await unlockAchievement('50_active_recruits');
    }

    if (referrals.length >= 100) {
      await unlockAchievement('100_active_recruits');
    }

    if (totalEarnings >= 1000) {
      await unlockAchievement('1k_earnings');
    }

    if (totalEarnings >= 10000) {
      await unlockAchievement('10k_earnings_club');
    }

    if (totalEarnings >= 25000) {
      await unlockAchievement('25k_earnings');
    }

    if (totalEarnings >= 10000 && referrals.length >= 50) {
      await unlockAchievement('platinum_agent');
    }

    const conversionRate = inviteStats.total > 0 
      ? (inviteStats.accepted / inviteStats.total) * 100 
      : 0;
    if (conversionRate >= 50 && inviteStats.total >= 20) {
      await unlockAchievement('high_conversion');
    }

    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentRecruits = referrals.filter(r => {
      const recruitedAt = new Date(r.recruitedAt).getTime();
      return recruitedAt >= oneMonthAgo;
    });
    if (recentRecruits.length >= 10) {
      await unlockAchievement('fast_grower');
    }
  }, [getAgentReferrals, transactions, getInviteStats, unlockAchievement]);

  const getAchievements = useCallback((agentId: string): Achievement[] => {
    const referrals = getAgentReferrals(agentId);
    const agentTransactions = transactions.filter(t => 
      t.type === 'agent_commission' && t.toUser === agentId
    );
    const totalEarnings = agentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const inviteStats = getInviteStats(agentId);

    return ACHIEVEMENT_DEFINITIONS.map(def => {
      let progress = 0;
      
      switch (def.id) {
        case 'first_recruit':
        case '10_active_recruits':
        case '50_active_recruits':
        case '100_active_recruits':
          progress = referrals.length;
          break;
        case '1k_earnings':
        case '10k_earnings_club':
        case '25k_earnings':
          progress = totalEarnings;
          break;
        case 'platinum_agent':
          progress = totalEarnings >= 10000 && referrals.length >= 50 ? 1 : 0;
          break;
        case 'high_conversion':
          progress = inviteStats.total >= 20 
            ? (inviteStats.accepted / inviteStats.total) * 100 
            : 0;
          break;
        case 'fast_grower':
          const now = Date.now();
          const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
          progress = referrals.filter(r => {
            const recruitedAt = new Date(r.recruitedAt).getTime();
            return recruitedAt >= oneMonthAgo;
          }).length;
          break;
      }

      const unlocked = unlockedAchievements.find(
        a => a.userId === agentId && a.achievementId === def.id
      );

      return {
        ...def,
        progress,
        isCompleted: !!unlocked,
        completedAt: unlocked?.unlockedAt,
      };
    });
  }, [getAgentReferrals, transactions, getInviteStats, unlockedAchievements]);

  const getTopEarners = useCallback((period: LeaderboardPeriod = 'month'): AgentLeaderboardEntry[] => {
    const periodStart = getPeriodStart(period);
    const agentEarnings = new Map<string, { name: string; avatar?: string; total: number }>();

    transactions
      .filter(t => t.type === 'agent_commission' && new Date(t.timestamp).getTime() >= periodStart)
      .forEach(t => {
        const existing = agentEarnings.get(t.toUser) || { name: 'Unknown Agent', total: 0 };
        existing.total += t.amount;
        agentEarnings.set(t.toUser, existing);
      });

    return Array.from(agentEarnings.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 50)
      .map(([agentId, data], index) => ({
        agentId,
        agentName: data.name,
        avatar: data.avatar,
        rank: index + 1,
        value: data.total,
      }));
  }, [transactions]);

  const getMostRecruits = useCallback((): AgentLeaderboardEntry[] => {
    const agentRecruits = new Map<string, { name: string; avatar?: string; count: number }>();

    transactions.forEach(t => {
      if (t.type === 'agent_commission') {
        const existing = agentRecruits.get(t.toUser) || { name: 'Unknown Agent', count: 0 };
        existing.count++;
        agentRecruits.set(t.toUser, existing);
      }
    });

    return Array.from(agentRecruits.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 50)
      .map(([agentId, data], index) => ({
        agentId,
        agentName: data.name,
        avatar: data.avatar,
        rank: index + 1,
        value: data.count,
      }));
  }, [transactions]);

  const getHighestConversion = useCallback((): AgentLeaderboardEntry[] => {
    const agentStats = new Map<string, { name: string; avatar?: string; sent: number; accepted: number }>();

    transactions.forEach(t => {
      if (t.type === 'agent_commission') {
        const agentId = t.toUser;
        const stats = getInviteStats(agentId);
        agentStats.set(agentId, {
          name: 'Unknown Agent',
          sent: stats.total,
          accepted: stats.accepted,
        });
      }
    });

    return Array.from(agentStats.entries())
      .filter(([_, data]) => data.sent >= 10)
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        avatar: data.avatar,
        rank: 0,
        value: data.sent > 0 ? (data.accepted / data.sent) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [transactions, getInviteStats]);

  const getFastestGrowing = useCallback((): AgentLeaderboardEntry[] => {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

    const agentGrowth = new Map<string, { name: string; avatar?: string; current: number; previous: number }>();

    transactions.forEach(t => {
      if (t.type === 'agent_commission') {
        const timestamp = new Date(t.timestamp).getTime();
        const agentId = t.toUser;
        const existing = agentGrowth.get(agentId) || { name: 'Unknown Agent', current: 0, previous: 0 };
        
        if (timestamp >= oneMonthAgo) {
          existing.current++;
        } else if (timestamp >= twoMonthsAgo) {
          existing.previous++;
        }
        
        agentGrowth.set(agentId, existing);
      }
    });

    return Array.from(agentGrowth.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        avatar: data.avatar,
        rank: 0,
        value: data.current,
        change: data.current - data.previous,
      }))
      .filter(entry => entry.change > 0)
      .sort((a, b) => (b.change || 0) - (a.change || 0))
      .slice(0, 50)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [transactions]);

  const getAgentRank = useCallback((agentId: string, leaderboard: AgentLeaderboardEntry[]): number => {
    const entry = leaderboard.find(e => e.agentId === agentId);
    return entry?.rank || 0;
  }, []);

  const getAgentBadge = useCallback((agentId: string): string | undefined => {
    const referrals = getAgentReferrals(agentId);
    const agentTransactions = transactions.filter(t => 
      t.type === 'agent_commission' && t.toUser === agentId
    );
    const totalEarnings = agentTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalEarnings >= 10000 && referrals.length >= 50) {
      return 'Platinum Agent';
    } else if (totalEarnings >= 5000 && referrals.length >= 25) {
      return 'Gold Agent';
    } else if (totalEarnings >= 2000 && referrals.length >= 10) {
      return 'Silver Agent';
    } else if (totalEarnings >= 500 || referrals.length >= 5) {
      return 'Bronze Agent';
    }
    
    return undefined;
  }, [getAgentReferrals, transactions]);

  return useMemo(() => ({
    getAchievements,
    checkAndUnlockAchievements,
    unlockAchievement,
    getTopEarners,
    getMostRecruits,
    getHighestConversion,
    getFastestGrowing,
    getAgentRank,
    getAgentBadge,
    unlockedAchievements,
  }), [
    getAchievements,
    checkAndUnlockAchievements,
    unlockAchievement,
    getTopEarners,
    getMostRecruits,
    getHighestConversion,
    getFastestGrowing,
    getAgentRank,
    getAgentBadge,
    unlockedAchievements,
  ]);
});

function getPeriodStart(period: LeaderboardPeriod): number {
  const now = Date.now();
  switch (period) {
    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000;
    case 'quarter':
      return now - 90 * 24 * 60 * 60 * 1000;
    case 'allTime':
      return 0;
    default:
      return now - 30 * 24 * 60 * 60 * 1000;
  }
}
