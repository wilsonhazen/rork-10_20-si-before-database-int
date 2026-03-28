import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { RewardTrigger, RewardDefinition, UserReward, CryptoWallet, FeedActivity } from '@/types';
import { demoTriggers, demoRewardDefinitions, demoUserRewards } from '@/mocks/rewards-data';
import { useData } from './DataContext';
import { useWallet } from './WalletContext';

const TRIGGERS_KEY = '@sourceimpact_reward_triggers';
const DEFINITIONS_KEY = '@sourceimpact_reward_definitions';
const USER_REWARDS_KEY = '@sourceimpact_user_rewards';
const CRYPTO_WALLETS_KEY = '@sourceimpact_crypto_wallets';

export const [RewardsProvider, useRewards] = createContextHook(() => {
  const { addFeedActivity, users } = useData();
  const { depositImpactTokens, getConnectedWallet, getUserBalance: getWalletBalance } = useWallet();
  const [triggers, setTriggers] = useState<RewardTrigger[]>([]);
  const [definitions, setDefinitions] = useState<RewardDefinition[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [triggersData, definitionsData, userRewardsData, walletsData] = await Promise.all([
        AsyncStorage.getItem(TRIGGERS_KEY),
        AsyncStorage.getItem(DEFINITIONS_KEY),
        AsyncStorage.getItem(USER_REWARDS_KEY),
        AsyncStorage.getItem(CRYPTO_WALLETS_KEY),
      ]);

      if (triggersData) {
        setTriggers(JSON.parse(triggersData));
      } else {
        setTriggers(demoTriggers);
        await AsyncStorage.setItem(TRIGGERS_KEY, JSON.stringify(demoTriggers));
      }

      if (definitionsData) {
        setDefinitions(JSON.parse(definitionsData));
      } else {
        setDefinitions(demoRewardDefinitions);
        await AsyncStorage.setItem(DEFINITIONS_KEY, JSON.stringify(demoRewardDefinitions));
      }

      if (userRewardsData) {
        setUserRewards(JSON.parse(userRewardsData));
      } else {
        setUserRewards(demoUserRewards);
        await AsyncStorage.setItem(USER_REWARDS_KEY, JSON.stringify(demoUserRewards));
      }

      if (walletsData) setCryptoWallets(JSON.parse(walletsData));
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTrigger = useCallback(async (trigger: RewardTrigger) => {
    const updated = [...triggers, trigger];
    setTriggers(updated);
    await AsyncStorage.setItem(TRIGGERS_KEY, JSON.stringify(updated));
  }, [triggers]);

  const updateTrigger = useCallback(async (id: string, updates: Partial<RewardTrigger>) => {
    const updated = triggers.map(t => t.id === id ? { ...t, ...updates } : t);
    setTriggers(updated);
    await AsyncStorage.setItem(TRIGGERS_KEY, JSON.stringify(updated));
  }, [triggers]);

  const deleteTrigger = useCallback(async (id: string) => {
    const updated = triggers.filter(t => t.id !== id);
    setTriggers(updated);
    await AsyncStorage.setItem(TRIGGERS_KEY, JSON.stringify(updated));
  }, [triggers]);

  const addDefinition = useCallback(async (definition: RewardDefinition) => {
    const updated = [...definitions, definition];
    setDefinitions(updated);
    await AsyncStorage.setItem(DEFINITIONS_KEY, JSON.stringify(updated));
  }, [definitions]);

  const updateDefinition = useCallback(async (id: string, updates: Partial<RewardDefinition>) => {
    const updated = definitions.map(d => d.id === id ? { ...d, ...updates } : d);
    setDefinitions(updated);
    await AsyncStorage.setItem(DEFINITIONS_KEY, JSON.stringify(updated));
  }, [definitions]);

  const deleteDefinition = useCallback(async (id: string) => {
    const updated = definitions.filter(d => d.id !== id);
    setDefinitions(updated);
    await AsyncStorage.setItem(DEFINITIONS_KEY, JSON.stringify(updated));
  }, [definitions]);

  const awardReward = useCallback(async (reward: UserReward) => {
    const updated = [...userRewards, reward];
    setUserRewards(updated);
    await AsyncStorage.setItem(USER_REWARDS_KEY, JSON.stringify(updated));
    console.log('Reward awarded:', reward.rewardName, 'to user:', reward.userId);

    try {
      const user = users.find(u => u.id === reward.userId);
      if (user && addFeedActivity) {
        const feedActivity: FeedActivity = {
          id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'reward_earned',
          title: 'Reward Earned!',
          description: `${user.name} earned ${reward.amount} ${reward.currency?.toUpperCase() || 'IMPACT'} for ${reward.rewardName}`,
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          amount: reward.amount,
          metadata: {
            rewardType: reward.rewardType,
            rewardName: reward.rewardName,
            currency: reward.currency || 'IMPACT',
          },
        };
        await addFeedActivity(feedActivity);
      }
    } catch (error) {
      console.error('Failed to add feed activity:', error);
    }
  }, [userRewards, users, addFeedActivity]);

  const updateUserReward = useCallback(async (id: string, updates: Partial<UserReward>) => {
    const updated = userRewards.map(r => r.id === id ? { ...r, ...updates } : r);
    setUserRewards(updated);
    await AsyncStorage.setItem(USER_REWARDS_KEY, JSON.stringify(updated));
  }, [userRewards]);

  const claimReward = useCallback(async (rewardId: string) => {
    const reward = userRewards.find(r => r.id === rewardId);
    if (!reward) return;

    const updated = userRewards.map(r => 
      r.id === rewardId 
        ? { ...r, status: 'processing' as const, claimedAt: new Date().toISOString() } 
        : r
    );
    setUserRewards(updated);
    await AsyncStorage.setItem(USER_REWARDS_KEY, JSON.stringify(updated));

    setTimeout(async () => {
      const transactionHash = reward.rewardType === 'crypto' ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined;
      
      const completed = userRewards.map(r => 
        r.id === rewardId 
          ? { 
              ...r, 
              status: 'completed' as const, 
              transactionHash,
            } 
          : r
      );
      setUserRewards(completed);
      await AsyncStorage.setItem(USER_REWARDS_KEY, JSON.stringify(completed));

      if (reward.rewardType === 'crypto') {
        const connectedWallet = getConnectedWallet(reward.userId);
        if (connectedWallet) {
          console.log('[Rewards] Depositing', reward.amount, 'IMPACT to connected wallet');
          await depositImpactTokens(
            reward.userId,
            connectedWallet.address,
            reward.amount,
            { source: 'reward', rewardId: reward.id }
          );
          console.log('[Rewards] IMPACT tokens deposited successfully');
        } else {
          console.log('[Rewards] No connected wallet found. User must connect wallet to receive tokens.');
        }
      }

      try {
        const user = users.find(u => u.id === reward.userId);
        if (user && addFeedActivity) {
          const feedActivity: FeedActivity = {
            id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'reward_claimed',
            title: 'Reward Claimed!',
            description: `${user.name} claimed ${reward.amount} ${reward.currency?.toUpperCase() || 'IMPACT'}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            amount: reward.amount,
            metadata: {
              rewardType: reward.rewardType,
              rewardName: reward.rewardName,
              currency: reward.currency || 'IMPACT',
              transactionHash,
            },
          };
          await addFeedActivity(feedActivity);
        }
      } catch (error) {
        console.error('Failed to add feed activity:', error);
      }
    }, 2000);
  }, [userRewards, users, addFeedActivity, getConnectedWallet, depositImpactTokens]);

  const addCryptoWallet = useCallback(async (wallet: CryptoWallet) => {
    const updated = [...cryptoWallets, wallet];
    setCryptoWallets(updated);
    await AsyncStorage.setItem(CRYPTO_WALLETS_KEY, JSON.stringify(updated));
  }, [cryptoWallets]);

  const updateCryptoWallet = useCallback(async (id: string, updates: Partial<CryptoWallet>) => {
    const updated = cryptoWallets.map(w => w.id === id ? { ...w, ...updates } : w);
    setCryptoWallets(updated);
    await AsyncStorage.setItem(CRYPTO_WALLETS_KEY, JSON.stringify(updated));
  }, [cryptoWallets]);

  const deleteCryptoWallet = useCallback(async (id: string) => {
    const updated = cryptoWallets.filter(w => w.id !== id);
    setCryptoWallets(updated);
    await AsyncStorage.setItem(CRYPTO_WALLETS_KEY, JSON.stringify(updated));
  }, [cryptoWallets]);

  const checkAndAwardRewards = useCallback(async (
    userId: string,
    triggerType: string,
    metadata?: { dealId?: string; referralId?: string; dealsCount?: number; earningsAmount?: number; referralsCount?: number; verifiedReferralsCount?: number }
  ) => {
    console.log('Checking rewards for user:', userId, 'trigger:', triggerType, 'metadata:', metadata);
    const activeTriggers = triggers.filter(t => t.isActive && t.type === triggerType);
    
    for (const trigger of activeTriggers) {
      let shouldAward = true;

      if (trigger.conditions.dealsCount && metadata?.dealsCount !== undefined) {
        shouldAward = metadata.dealsCount >= trigger.conditions.dealsCount;
        console.log(`Checking deals milestone: ${metadata.dealsCount} >= ${trigger.conditions.dealsCount} = ${shouldAward}`);
      }
      if (trigger.conditions.earningsAmount && metadata?.earningsAmount !== undefined) {
        shouldAward = metadata.earningsAmount >= trigger.conditions.earningsAmount;
        console.log(`Checking earnings milestone: ${metadata.earningsAmount} >= ${trigger.conditions.earningsAmount} = ${shouldAward}`);
      }
      if (trigger.conditions.referralsCount && metadata?.referralsCount !== undefined) {
        shouldAward = metadata.referralsCount >= trigger.conditions.referralsCount;
        console.log(`Checking referrals milestone: ${metadata.referralsCount} >= ${trigger.conditions.referralsCount} = ${shouldAward}`);
      }
      if (trigger.conditions.verifiedReferralsCount && metadata?.verifiedReferralsCount !== undefined) {
        shouldAward = metadata.verifiedReferralsCount >= trigger.conditions.verifiedReferralsCount;
        console.log(`Checking verified referrals milestone: ${metadata.verifiedReferralsCount} >= ${trigger.conditions.verifiedReferralsCount} = ${shouldAward}`);
      }

      if (shouldAward) {
        const rewardDefs = definitions.filter(d => d.triggerId === trigger.id && d.isActive);
        console.log(`Found ${rewardDefs.length} reward definitions for trigger ${trigger.id}`);
        
        for (const def of rewardDefs) {
          const existingReward = userRewards.find(
            r => r.userId === userId && r.rewardDefinitionId === def.id
          );

          if (!existingReward) {
            const newReward: UserReward = {
              id: `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              userId,
              rewardDefinitionId: def.id,
              rewardName: def.name,
              rewardType: def.rewardType,
              amount: def.amount,
              currency: def.currency,
              status: 'pending',
              earnedAt: new Date().toISOString(),
              metadata,
            };

            console.log('Awarding new reward:', newReward.rewardName, 'to user:', userId);
            await awardReward(newReward);
          } else {
            console.log('Reward already exists:', def.name, 'for user:', userId);
          }
        }
      }
    }
  }, [triggers, definitions, userRewards, awardReward]);

  const getUserStats = useCallback((userId: string) => {
    const userRewardsList = userRewards.filter(r => r.userId === userId);
    const totalImpactEarned = userRewardsList
      .filter(r => r.rewardType === 'crypto' && r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);
    const badges = userRewardsList.filter(r => r.rewardType === 'badge' && r.status === 'completed');
    
    const walletBalance = getWalletBalance(userId);
    
    return {
      totalImpact: totalImpactEarned,
      totalUsdValue: totalImpactEarned,
      walletBalance: walletBalance?.balance || 0,
      lockedBalance: walletBalance?.lockedBalance || 0,
      totalWithdrawn: walletBalance?.totalWithdrawn || 0,
      badgeCount: badges.length,
      badges,
    };
  }, [userRewards, getWalletBalance]);

  return useMemo(() => ({
    triggers,
    definitions,
    userRewards,
    cryptoWallets,
    isLoading,
    addTrigger,
    updateTrigger,
    deleteTrigger,
    addDefinition,
    updateDefinition,
    deleteDefinition,
    awardReward,
    updateUserReward,
    claimReward,
    addCryptoWallet,
    updateCryptoWallet,
    deleteCryptoWallet,
    checkAndAwardRewards,
    getUserStats,
  }), [
    triggers,
    definitions,
    userRewards,
    cryptoWallets,
    isLoading,
    addTrigger,
    updateTrigger,
    deleteTrigger,
    addDefinition,
    updateDefinition,
    deleteDefinition,
    awardReward,
    updateUserReward,
    claimReward,
    addCryptoWallet,
    updateCryptoWallet,
    deleteCryptoWallet,
    checkAndAwardRewards,
    getUserStats,
  ]);
});
