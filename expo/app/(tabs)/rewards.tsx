import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/contexts/RewardsContext';
import { Award, Gift, Wallet, Copy, CheckCircle, Clock, AlertCircle, Target, Zap, Info, ChevronRight, Star, Sparkles, Trophy, Flame, DollarSign, Crown } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function RewardsScreen() {
  const { user } = useAuth();
  const { userRewards, cryptoWallets, claimReward, addCryptoWallet, definitions, triggers, isLoading } = useRewards();
  
  useEffect(() => {
    console.log('RewardsScreen mounted');
    console.log('User:', user?.id);
    console.log('Triggers:', triggers.length);
    console.log('Definitions:', definitions.length);
    console.log('User Rewards:', userRewards.length);
    console.log('Is Loading:', isLoading);
  }, [user, triggers, definitions, userRewards, isLoading]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'polygon' | 'solana' | 'bitcoin'>('ethereum');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'processing'>('all');
  const [showRewardsTable, setShowRewardsTable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'getting-started' | 'engagement' | 'milestones' | 'elite'>('all');

  const myRewards = useMemo(() => {
    if (!user) return [];
    return userRewards.filter(r => r.userId === user.id);
  }, [user, userRewards]);

  const myWallets = useMemo(() => {
    if (!user) return [];
    return cryptoWallets.filter(w => w.userId === user.id);
  }, [user, cryptoWallets]);

  const totalImpact = useMemo(() => {
    return myRewards
      .filter(r => r.rewardType === 'crypto' && r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [myRewards]);

  const badges = useMemo(() => {
    return myRewards.filter(r => r.rewardType === 'badge' && r.status === 'completed');
  }, [myRewards]);

  const filteredRewards = useMemo(() => {
    if (filterStatus === 'all') return myRewards;
    return myRewards.filter(r => r.status === filterStatus);
  }, [myRewards, filterStatus]);

  const pendingRewards = useMemo(() => {
    return myRewards.filter(r => r.status === 'pending');
  }, [myRewards]);

  const processingRewards = useMemo(() => {
    return myRewards.filter(r => r.status === 'processing');
  }, [myRewards]);

  const rewardOpportunities = useMemo(() => {
    const opportunities = [];
    
    const accountCreatedTrigger = triggers.find(t => t.type === 'account_created');
    if (accountCreatedTrigger && !myRewards.some(r => r.metadata?.milestone === 'account_created')) {
      opportunities.push({
        id: 'opp_1',
        title: 'Create Account',
        description: 'Complete your account setup',
        reward: 'Get 0.5 IMPACT ($0.50)',
        icon: 'gift' as const,
      });
    }

    const firstDealTrigger = triggers.find(t => t.type === 'first_deal_completed');
    if (firstDealTrigger && !myRewards.some(r => r.metadata?.milestone === 'first_deal')) {
      opportunities.push({
        id: 'opp_2',
        title: 'Complete First Deal',
        description: 'Close your first collaboration',
        reward: 'Earn 2 IMPACT ($2.00) + Badge',
        icon: 'target' as const,
      });
    }

    const referralTrigger = triggers.find(t => t.type === 'referral_signup' && t.conditions.referralsCount === 1);
    if (referralTrigger) {
      opportunities.push({
        id: 'opp_3',
        title: 'Refer a Friend',
        description: 'Invite someone to join',
        reward: 'Get 1 IMPACT ($1.00)',
        icon: 'zap' as const,
      });
    }

    return opportunities;
  }, [triggers, myRewards]);

  const rewardsTableData = useMemo(() => {
    return triggers.map(trigger => {
      const relatedDefinitions = definitions.filter(d => d.triggerId === trigger.id && d.isActive);
      const totalImpactAmount = relatedDefinitions
        .filter(d => d.rewardType === 'crypto')
        .reduce((sum, d) => sum + d.amount, 0);
      const badgesCount = relatedDefinitions.filter(d => d.rewardType === 'badge').length;

      return {
        id: trigger.id,
        action: trigger.name,
        description: trigger.description,
        impact: totalImpactAmount,
        badges: badgesCount,
        conditions: trigger.conditions,
      };
    });
  }, [triggers, definitions]);

  const categorizedRewards = useMemo(() => {
    const categorized = {
      gettingStarted: [] as typeof rewardsTableData,
      engagement: [] as typeof rewardsTableData,
      milestones: [] as typeof rewardsTableData,
      elite: [] as typeof rewardsTableData,
    };

    rewardsTableData.forEach(reward => {
      if (reward.impact <= 15 && !reward.conditions.dealsCount && !reward.conditions.referralsCount) {
        categorized.gettingStarted.push(reward);
      } else if (reward.impact > 15 && reward.impact <= 30 && !reward.conditions.dealsCount && !reward.conditions.referralsCount) {
        categorized.engagement.push(reward);
      } else if (reward.conditions.dealsCount || reward.conditions.referralsCount || reward.conditions.earningsAmount) {
        categorized.milestones.push(reward);
      } else if (reward.impact >= 50) {
        categorized.elite.push(reward);
      }
    });

    return categorized;
  }, [rewardsTableData]);

  const displayRewards = useMemo(() => {
    if (selectedCategory === 'all') return rewardsTableData;
    if (selectedCategory === 'getting-started') return categorizedRewards.gettingStarted;
    if (selectedCategory === 'engagement') return categorizedRewards.engagement;
    if (selectedCategory === 'milestones') return categorizedRewards.milestones;
    return categorizedRewards.elite;
  }, [selectedCategory, rewardsTableData, categorizedRewards]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>Please log in to view rewards</Text>
      </View>
    );
  }

  const handleClaimReward = (rewardId: string) => {
    Alert.alert(
      'Claim Reward',
      'Are you sure you want to claim this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Claim', 
          onPress: () => claimReward(rewardId)
        }
      ]
    );
  };

  const handleAddWallet = async () => {
    if (!walletAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    const newWallet = {
      id: `wallet_${Date.now()}`,
      userId: user.id,
      address: walletAddress.trim(),
      network: selectedNetwork,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    await addCryptoWallet(newWallet);
    setWalletAddress('');
    setShowAddWallet(false);
    Alert.alert('Success', 'Wallet added successfully');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'processing':
        return <Clock size={16} color={Colors.warning} />;
      case 'failed':
        return <AlertCircle size={16} color={Colors.error} />;
      default:
        return <Clock size={16} color={Colors.textMuted} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconContainer}>
              <Trophy size={40} color={Colors.warning} />
            </View>
            <Text style={styles.heroTitle}>Earn IMPACT Rewards</Text>
            <Text style={styles.heroSubtitle}>Complete actions and earn crypto tokens with real dollar value</Text>
          </View>

          <View style={styles.heroStatsContainer}>
            <View style={styles.heroStatCard}>
              <View style={styles.heroStatIconWrapper}>
                <Wallet size={28} color={Colors.warning} />
              </View>
              <Text style={styles.heroStatValue}>{totalImpact.toFixed(2)}</Text>
              <Text style={styles.heroStatLabel}>IMPACT Earned</Text>
              <Text style={styles.heroStatUsd}>${totalImpact.toFixed(2)} USD</Text>
            </View>
            
            <View style={styles.heroStatCard}>
              <View style={[styles.heroStatIconWrapper, { backgroundColor: Colors.accent + '20' }]}>
                <Award size={28} color={Colors.accent} />
              </View>
              <Text style={styles.heroStatValue}>{badges.length}</Text>
              <Text style={styles.heroStatLabel}>Badges</Text>
              <Text style={styles.heroStatUsd}>Achievements</Text>
            </View>
          </View>
        </View>

        {pendingRewards.length > 0 && (
          <View style={styles.pulsingAlert}>
            <View style={styles.alertBanner}>
              <View style={styles.alertContent}>
                <View style={styles.alertGiftIcon}>
                  <Gift size={24} color={Colors.warning} />
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{pendingRewards.length}</Text>
                  </View>
                </View>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Rewards Ready to Claim!</Text>
                  <Text style={styles.alertSubtitle}>Tap below to claim your {pendingRewards.length} pending reward{pendingRewards.length > 1 ? 's' : ''}</Text>
                </View>
                <Sparkles size={24} color={Colors.warning} />
              </View>
            </View>
          </View>
        )}

        {processingRewards.length > 0 && (
          <View style={[styles.alertBanner, styles.alertBannerProcessing]}>
            <View style={styles.alertContent}>
              <Clock size={20} color={Colors.primary} />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>{processingRewards.length} reward{processingRewards.length > 1 ? 's' : ''} processing</Text>
                <Text style={styles.alertSubtitle}>Your rewards will be available shortly</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.motivationSection}>
          <View style={styles.motivationHeader}>
            <Flame size={24} color={Colors.error} />
            <Text style={styles.motivationTitle}>Start Earning Now!</Text>
          </View>
          <Text style={styles.motivationText}>
            Complete simple tasks and earn IMPACT tokens with 1:1 dollar value. Each IMPACT token equals exactly $1.00 USD. Over $8,985 in rewards available!
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Reward Categories</Text>
            <Text style={styles.categorySubtitle}>Choose what interests you</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Star size={16} color={selectedCategory === 'all' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All Rewards</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'getting-started' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('getting-started')}
            >
              <Gift size={16} color={selectedCategory === 'getting-started' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.categoryChipText, selectedCategory === 'getting-started' && styles.categoryChipTextActive]}>Getting Started</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'engagement' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('engagement')}
            >
              <Flame size={16} color={selectedCategory === 'engagement' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.categoryChipText, selectedCategory === 'engagement' && styles.categoryChipTextActive]}>Engagement</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'milestones' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('milestones')}
            >
              <Target size={16} color={selectedCategory === 'milestones' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.categoryChipText, selectedCategory === 'milestones' && styles.categoryChipTextActive]}>Milestones</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'elite' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('elite')}
            >
              <Crown size={16} color={selectedCategory === 'elite' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.categoryChipText, selectedCategory === 'elite' && styles.categoryChipTextActive]}>Elite</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.rewardsShowcaseSection}>
          <View style={styles.showcaseHeader}>
            <Text style={styles.showcaseTitle}>Available Rewards ({displayRewards.length})</Text>
            <View style={styles.showcaseTotalBadge}>
              <DollarSign size={14} color={Colors.warning} />
              <Text style={styles.showcaseTotalText}>
                {displayRewards.reduce((sum, r) => sum + r.impact, 0).toFixed(0)} IMPACT
              </Text>
            </View>
          </View>

          <View style={styles.showcaseGrid}>
            {displayRewards.map((reward, index) => {
              const isCompleted = myRewards.some(
                r => r.rewardDefinitionId && definitions.find(
                  d => d.triggerId === reward.id && d.id === r.rewardDefinitionId
                ) && r.status === 'completed'
              );

              return (
                <View key={reward.id} style={styles.showcaseCard}>
                  {isCompleted && (
                    <View style={styles.showcaseCompletedBadge}>
                      <CheckCircle size={16} color={Colors.success} />
                    </View>
                  )}
                  
                  <View style={styles.showcaseCardHeader}>
                    <View style={[styles.showcaseIcon, isCompleted && styles.showcaseIconCompleted]}>
                      {reward.impact <= 10 ? (
                        <Gift size={24} color={isCompleted ? Colors.success : Colors.primary} />
                      ) : reward.impact <= 30 ? (
                        <Zap size={24} color={isCompleted ? Colors.success : Colors.warning} />
                      ) : reward.impact <= 100 ? (
                        <Target size={24} color={isCompleted ? Colors.success : Colors.accent} />
                      ) : (
                        <Crown size={24} color={isCompleted ? Colors.success : Colors.error} />
                      )}
                    </View>
                    <View style={styles.showcaseRewardBadge}>
                      <Wallet size={14} color={Colors.warning} />
                      <Text style={styles.showcaseRewardAmount}>{reward.impact}</Text>
                    </View>
                  </View>

                  <Text style={styles.showcaseCardTitle}>{reward.action}</Text>
                  <Text style={styles.showcaseCardDescription} numberOfLines={2}>{reward.description}</Text>

                  {(reward.conditions.dealsCount || reward.conditions.referralsCount || reward.conditions.earningsAmount) && (
                    <View style={styles.showcaseMilestone}>
                      <Text style={styles.showcaseMilestoneText}>
                        {reward.conditions.dealsCount && `${reward.conditions.dealsCount} deals`}
                        {reward.conditions.referralsCount && `${reward.conditions.referralsCount} referrals`}
                        {reward.conditions.earningsAmount && `${reward.conditions.earningsAmount}`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.showcaseFooter}>
                    <View style={styles.showcaseRewards}>
                      <Text style={styles.showcaseImpact}>{reward.impact} IMPACT</Text>
                      <Text style={styles.showcaseUsd}>${reward.impact.toFixed(2)}</Text>
                    </View>
                    {reward.badges > 0 && (
                      <View style={styles.showcaseBadges}>
                        <Award size={12} color={Colors.accent} />
                        <Text style={styles.showcaseBadgesText}>+{reward.badges}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.rewardsTableButton}
            onPress={() => setShowRewardsTable(!showRewardsTable)}
          >
            <View style={styles.rewardsTableHeader}>
              <Info size={20} color={Colors.primary} />
              <View style={styles.rewardsTableTitleContainer}>
                <Text style={styles.rewardsTableTitle}>Complete Rewards Guide</Text>
                <Text style={styles.rewardsTableSubtitle}>All {rewardsTableData.length} ways to earn IMPACT</Text>
              </View>
            </View>
            <ChevronRight 
              size={20} 
              color={Colors.textMuted} 
              style={{ transform: [{ rotate: showRewardsTable ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showRewardsTable && (
            <View style={styles.rewardsTableExpanded}>
              <View style={styles.tableIntro}>
                <Text style={styles.tableIntroText}>
                  Earn IMPACT tokens (1:1 USD value) by completing actions on the platform. Total available rewards: ${rewardsTableData.reduce((sum, r) => sum + r.impact, 0).toFixed(0)}
                </Text>
              </View>

              <View style={styles.tableCategorySection}>
                <View style={styles.tableCategoryHeader}>
                  <Gift size={18} color={Colors.success} />
                  <Text style={styles.tableCategoryTitle}>Getting Started ($5-$15)</Text>
                </View>
                {categorizedRewards.gettingStarted.map((row) => (
                  <View key={row.id} style={styles.tableRowExpanded}>
                    <View style={styles.tableRowContent}>
                      <View style={styles.tableRowLeft}>
                        <Text style={styles.tableRowTitle}>{row.action}</Text>
                        <Text style={styles.tableRowDescription}>{row.description}</Text>
                      </View>
                      <View style={styles.tableRowRight}>
                        <View style={styles.tableRowImpactBadge}>
                          <Wallet size={12} color={Colors.warning} />
                          <Text style={styles.tableRowImpactText}>{row.impact}</Text>
                        </View>
                        {row.badges > 0 && (
                          <View style={styles.tableRowBadgeIndicator}>
                            <Award size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.tableCategorySection}>
                <View style={styles.tableCategoryHeader}>
                  <Flame size={18} color={Colors.warning} />
                  <Text style={styles.tableCategoryTitle}>Engagement ($15-$30)</Text>
                </View>
                {categorizedRewards.engagement.map((row) => (
                  <View key={row.id} style={styles.tableRowExpanded}>
                    <View style={styles.tableRowContent}>
                      <View style={styles.tableRowLeft}>
                        <Text style={styles.tableRowTitle}>{row.action}</Text>
                        <Text style={styles.tableRowDescription}>{row.description}</Text>
                        {row.conditions.consecutiveDays && (
                          <Text style={styles.tableRowCondition}>{row.conditions.consecutiveDays} consecutive days</Text>
                        )}
                      </View>
                      <View style={styles.tableRowRight}>
                        <View style={styles.tableRowImpactBadge}>
                          <Wallet size={12} color={Colors.warning} />
                          <Text style={styles.tableRowImpactText}>{row.impact}</Text>
                        </View>
                        {row.badges > 0 && (
                          <View style={styles.tableRowBadgeIndicator}>
                            <Award size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.tableCategorySection}>
                <View style={styles.tableCategoryHeader}>
                  <Target size={18} color={Colors.accent} />
                  <Text style={styles.tableCategoryTitle}>Milestones ($25-$500)</Text>
                </View>
                {categorizedRewards.milestones.map((row) => (
                  <View key={row.id} style={styles.tableRowExpanded}>
                    <View style={styles.tableRowContent}>
                      <View style={styles.tableRowLeft}>
                        <Text style={styles.tableRowTitle}>{row.action}</Text>
                        <Text style={styles.tableRowDescription}>{row.description}</Text>
                        {row.conditions.dealsCount && (
                          <Text style={styles.tableRowCondition}>{row.conditions.dealsCount} deals completed</Text>
                        )}
                        {row.conditions.referralsCount && (
                          <Text style={styles.tableRowCondition}>{row.conditions.referralsCount} referrals signed up</Text>
                        )}
                        {row.conditions.earningsAmount && (
                          <Text style={styles.tableRowCondition}>${row.conditions.earningsAmount.toLocaleString()} total earned</Text>
                        )}
                      </View>
                      <View style={styles.tableRowRight}>
                        <View style={[styles.tableRowImpactBadge, styles.tableRowImpactBadgeLarge]}>
                          <Wallet size={14} color={Colors.warning} />
                          <Text style={[styles.tableRowImpactText, styles.tableRowImpactTextLarge]}>{row.impact}</Text>
                        </View>
                        {row.badges > 0 && (
                          <View style={styles.tableRowBadgeIndicator}>
                            <Award size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.tableCategorySection}>
                <View style={styles.tableCategoryHeader}>
                  <Crown size={18} color={Colors.error} />
                  <Text style={styles.tableCategoryTitle}>Elite ($50-$100)</Text>
                </View>
                {categorizedRewards.elite.map((row) => (
                  <View key={row.id} style={styles.tableRowExpanded}>
                    <View style={styles.tableRowContent}>
                      <View style={styles.tableRowLeft}>
                        <Text style={styles.tableRowTitle}>{row.action}</Text>
                        <Text style={styles.tableRowDescription}>{row.description}</Text>
                        {row.conditions.connectionsCount && (
                          <Text style={styles.tableRowCondition}>{row.conditions.connectionsCount} connections made</Text>
                        )}
                        {row.conditions.reviewsCount && (
                          <Text style={styles.tableRowCondition}>{row.conditions.reviewsCount}+ reviews with 5-star rating</Text>
                        )}
                      </View>
                      <View style={styles.tableRowRight}>
                        <View style={[styles.tableRowImpactBadge, styles.tableRowImpactBadgeLarge]}>
                          <Wallet size={14} color={Colors.warning} />
                          <Text style={[styles.tableRowImpactText, styles.tableRowImpactTextLarge]}>{row.impact}</Text>
                        </View>
                        {row.badges > 0 && (
                          <View style={styles.tableRowBadgeIndicator}>
                            <Award size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.tableFooterNote}>
                <Info size={16} color={Colors.textMuted} />
                <Text style={styles.tableFooterText}>
                  All rewards are paid in IMPACT tokens with 1:1 USD value. Badges appear on your profile.
                </Text>
              </View>
            </View>
          )}
        </View>

        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges Earned</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={[styles.badgeIcon, { backgroundColor: badge.currency || Colors.primary }]}>
                    <Award size={24} color={Colors.white} />
                  </View>
                  <Text style={styles.badgeName}>{badge.rewardName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Rewards History</Text>
            <View style={styles.filterButtons}>
              {(['all', 'pending', 'processing', 'completed'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filterStatus === status && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {filteredRewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Gift size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No rewards yet</Text>
              <Text style={styles.emptySubtext}>
                {filterStatus === 'all' 
                  ? 'Complete deals and refer friends to earn rewards!' 
                  : `No ${filterStatus} rewards`}
              </Text>
            </View>
          ) : (
            filteredRewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.rewardName}</Text>
                    <View style={styles.rewardMeta}>
                      {getStatusIcon(reward.status)}
                      <Text style={styles.rewardStatus}>{reward.status}</Text>
                    </View>
                  </View>
                  <View style={styles.rewardAmount}>
                    {reward.rewardType === 'crypto' ? (
                      <>
                        <Text style={styles.rewardValue}>
                          {reward.amount} IMPACT
                        </Text>
                        <Text style={styles.rewardUsdValue}>${reward.amount.toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={styles.rewardValue}>{reward.rewardName}</Text>
                    )}
                  </View>
                </View>

                {reward.metadata && (
                  <View style={styles.rewardMetadata}>
                    {reward.metadata.milestone && (
                      <Text style={styles.metadataText}>Milestone: {reward.metadata.milestone}</Text>
                    )}
                    {reward.metadata.dealId && (
                      <Text style={styles.metadataText}>Deal ID: {reward.metadata.dealId.substring(0, 8)}...</Text>
                    )}
                  </View>
                )}

                {reward.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.claimButton}
                    onPress={() => handleClaimReward(reward.id)}
                  >
                    <Text style={styles.claimButtonText}>Claim Reward</Text>
                  </TouchableOpacity>
                )}

                {reward.transactionHash && (
                  <View style={styles.transactionHash}>
                    <Text style={styles.hashLabel}>Transaction:</Text>
                    <Text style={styles.hashValue} numberOfLines={1}>
                      {reward.transactionHash}
                    </Text>
                  </View>
                )}

                <Text style={styles.rewardDate}>
                  Earned {new Date(reward.earnedAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Crypto Wallets</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddWallet(!showAddWallet)}
            >
              <Text style={styles.addButtonText}>+ Add Wallet</Text>
            </TouchableOpacity>
          </View>

          {showAddWallet && (
            <View style={styles.addWalletForm}>
              <Text style={styles.formLabel}>Network</Text>
              <View style={styles.networkButtons}>
                {(['ethereum', 'polygon', 'solana', 'bitcoin'] as const).map((network) => (
                  <TouchableOpacity
                    key={network}
                    style={[
                      styles.networkButton,
                      selectedNetwork === network && styles.networkButtonActive
                    ]}
                    onPress={() => setSelectedNetwork(network)}
                  >
                    <Text style={[
                      styles.networkButtonText,
                      selectedNetwork === network && styles.networkButtonTextActive
                    ]}>
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Wallet Address</Text>
              <TextInput
                style={styles.input}
                value={walletAddress}
                onChangeText={setWalletAddress}
                placeholder="Enter wallet address"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddWallet(false);
                    setWalletAddress('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddWallet}
                >
                  <Text style={styles.saveButtonText}>Add Wallet</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {myWallets.length === 0 && !showAddWallet ? (
            <View style={styles.emptyWallets}>
              <Wallet size={32} color={Colors.textMuted} />
              <Text style={styles.emptyWalletsText}>No wallets added</Text>
            </View>
          ) : (
            myWallets.map((wallet) => (
              <View key={wallet.id} style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <Wallet size={20} color={Colors.primary} />
                  <Text style={styles.walletNetwork}>{wallet.network.toUpperCase()}</Text>
                  {wallet.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle size={14} color={Colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.walletAddress}>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {wallet.address}
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert('Copied', 'Address copied to clipboard')}>
                    <Copy size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Source Impact Rewards</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Wallet size={24} color={Colors.warning} />
              <Text style={styles.infoCardTitle}>IMPACT Token</Text>
            </View>
            <Text style={styles.infoCardText}>
              IMPACT is our exclusive cryptocurrency token. All rewards on Source Impact are paid in IMPACT tokens only. Each IMPACT token maintains a stable 1:1 value with the US Dollar, backed by real liquidity.
            </Text>
            <View style={styles.infoCardStats}>
              <View style={styles.infoCardStat}>
                <Text style={styles.infoCardStatLabel}>Token Value</Text>
                <Text style={styles.infoCardStatValue}>1 IMPACT = $1.00</Text>
              </View>
              <View style={styles.infoCardStat}>
                <Text style={styles.infoCardStatLabel}>Your Balance</Text>
                <Text style={styles.infoCardStatValue}>{totalImpact.toFixed(2)} IMPACT</Text>
                <Text style={styles.infoCardStatSubValue}>${totalImpact.toFixed(2)} USD</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Info size={24} color={Colors.primary} />
              <Text style={styles.infoCardTitle}>How Rewards Work</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>Complete actions like deals, referrals, and milestones</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>Earn IMPACT tokens (our exclusive crypto currency) and badges for your achievements</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>Claim pending rewards to add them to your balance</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>4.</Text>
              <Text style={styles.infoText}>Withdraw IMPACT to your crypto wallet with 1:1 dollar value</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Target size={24} color={Colors.success} />
              <Text style={styles.infoCardTitle}>Quick Tips</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Complete your profile and verify socials for instant rewards</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Invite 20 verified users to earn 300 IMPACT ($300) - they must complete Stripe verification</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Invite 100 verified users to earn 1500 IMPACT ($1500) - massive rewards for building the community</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Reach deal milestones for bonus crypto rewards</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Add a crypto wallet to receive IMPACT tokens</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  statCardPrimary: {
    minWidth: '100%',
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '40',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  section: {
    padding: 20,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardInfo: {
    flex: 1,
    gap: 6,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  rewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  rewardAmount: {
    alignItems: 'flex-end',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  rewardType: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  rewardUsdValue: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  rewardMetadata: {
    gap: 4,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  claimButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  transactionHash: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
  },
  hashLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  hashValue: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  rewardDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  addWalletForm: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  networkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  networkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  networkButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  networkButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  networkButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptyWallets: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyWalletsText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  walletCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletNetwork: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
  },
  walletAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  infoSection: {
    padding: 20,
    paddingTop: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 16,
    color: Colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  alertBanner: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  alertBannerProcessing: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary + '40',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  opportunitiesGrid: {
    gap: 12,
  },
  opportunityCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  opportunityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  opportunityDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  opportunityReward: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    padding: 8,
  },
  opportunityRewardText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  rewardsTableButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginBottom: 12,
  },
  rewardsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardsTableTitleContainer: {
    flex: 1,
    gap: 2,
  },
  rewardsTableTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  rewardsTableSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  rewardsTableExpanded: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginTop: 12,
  },
  tableIntro: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  tableIntroText: {
    fontSize: 13,
    color: Colors.white,
    lineHeight: 18,
  },
  tableCategorySection: {
    marginBottom: 24,
  },
  tableCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.darkBorder,
  },
  tableCategoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  tableRowExpanded: {
    backgroundColor: Colors.darkBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  tableRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  tableRowLeft: {
    flex: 1,
    gap: 4,
  },
  tableRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableRowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  tableRowDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  tableRowCondition: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
  },
  tableRowImpactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tableRowImpactBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tableRowImpactText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  tableRowImpactTextLarge: {
    fontSize: 14,
  },
  tableRowBadgeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableFooterNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    marginTop: 8,
  },
  tableFooterText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rewardItemText: {
    fontSize: 13,
    color: Colors.white,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  infoCardText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoCardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCardStat: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
  },
  infoCardStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  infoCardStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  infoCardStatSubValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
  },
  heroSection: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  heroStatIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  heroStatUsd: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pulsingAlert: {
    paddingHorizontal: 0,
  },
  alertGiftIcon: {
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  motivationSection: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  rewardsShowcaseSection: {
    padding: 20,
    paddingTop: 12,
  },
  showcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  showcaseTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  showcaseTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  showcaseTotalText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  showcaseCard: {
    width: '48%',
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    position: 'relative',
  },
  showcaseCompletedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    padding: 4,
  },
  showcaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  showcaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseIconCompleted: {
    backgroundColor: Colors.success + '20',
  },
  showcaseRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  showcaseRewardAmount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  showcaseCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  showcaseCardDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  showcaseMilestone: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  showcaseMilestoneText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  showcaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showcaseRewards: {
    flex: 1,
  },
  showcaseImpact: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  showcaseUsd: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  showcaseBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  showcaseBadgesText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});
