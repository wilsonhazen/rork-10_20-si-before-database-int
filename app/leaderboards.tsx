import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, TrendingUp, Target, Zap, Crown } from 'lucide-react-native';
import { useGamification } from '@/contexts/GamificationContext';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import type { LeaderboardPeriod } from '@/contexts/GamificationContext';

type LeaderboardTab = 'earners' | 'recruits' | 'conversion' | 'growth';

export default function LeaderboardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getTopEarners, 
    getMostRecruits, 
    getHighestConversion, 
    getFastestGrowing,
    getAgentRank,
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('earners');
  const [period, setPeriod] = useState<LeaderboardPeriod>('month');

  const tabs: { id: LeaderboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'earners', label: 'Top Earners', icon: <Trophy size={18} color={colors.primary} /> },
    { id: 'recruits', label: 'Most Recruits', icon: <Target size={18} color={colors.primary} /> },
    { id: 'conversion', label: 'Best Conversion', icon: <TrendingUp size={18} color={colors.primary} /> },
    { id: 'growth', label: 'Fastest Growing', icon: <Zap size={18} color={colors.primary} /> },
  ];

  const periods: { id: LeaderboardPeriod; label: string }[] = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'allTime', label: 'All Time' },
  ];

  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'earners':
        return getTopEarners(period);
      case 'recruits':
        return getMostRecruits();
      case 'conversion':
        return getHighestConversion();
      case 'growth':
        return getFastestGrowing();
      default:
        return [];
    }
  };

  const leaderboardData = getLeaderboardData();
  const userRank = user ? getAgentRank(user.id, leaderboardData) : 0;

  const formatValue = (value: number) => {
    switch (activeTab) {
      case 'earners':
        return `$${value.toFixed(2)}`;
      case 'recruits':
        return value.toString();
      case 'conversion':
        return `${value.toFixed(1)}%`;
      case 'growth':
        return `+${value}`;
      default:
        return value.toString();
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return colors.warning;
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.textSecondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Crown size={20} color={getRankBadgeColor(rank)} />;
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Leaderboards',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compete & Win</Text>
          <Text style={styles.headerSubtitle}>See how you rank against other agents</Text>
        </View>

        {user && userRank > 0 && (
          <View style={styles.userRankCard}>
            <View style={styles.userRankContent}>
              <View style={styles.userRankInfo}>
                <Text style={styles.userRankLabel}>Your Rank</Text>
                <Text style={styles.userRankValue}>#{userRank}</Text>
              </View>
              {getRankIcon(userRank)}
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTab === 'earners' && (
          <View style={styles.periodSelector}>
            {periods.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.periodButton,
                  period === p.id && styles.activePeriodButton,
                ]}
                onPress={() => setPeriod(p.id)}
              >
                <Text style={[
                  styles.periodButtonText,
                  period === p.id && styles.activePeriodButtonText,
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.leaderboardContainer}>
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No data yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Be the first to appear on the leaderboard!
              </Text>
            </View>
          ) : (
            <View style={styles.leaderboardList}>
              {leaderboardData.map((entry, index) => {
                const isUser = user && entry.agentId === user.id;
                const isTopThree = entry.rank <= 3;
                
                return (
                  <TouchableOpacity
                    key={entry.agentId}
                    style={[
                      styles.leaderboardCard,
                      isUser && styles.userLeaderboardCard,
                      isTopThree && styles.topThreeCard,
                    ]}
                    onPress={() => router.push(`/view-profile?userId=${entry.agentId}`)}
                  >
                    <View style={styles.leaderboardRankContainer}>
                      {getRankIcon(entry.rank)}
                      <Text style={[
                        styles.leaderboardRank,
                        isTopThree && styles.topThreeRank,
                      ]}>
                        #{entry.rank}
                      </Text>
                    </View>

                    <Image
                      source={{ uri: entry.avatar || 'https://i.pravatar.cc/150' }}
                      style={[
                        styles.leaderboardAvatar,
                        isTopThree && styles.topThreeAvatar,
                      ]}
                    />

                    <View style={styles.leaderboardInfo}>
                      <Text style={[
                        styles.leaderboardName,
                        isUser && styles.userLeaderboardName,
                      ]} numberOfLines={1}>
                        {entry.agentName} {isUser && '(You)'}
                      </Text>
                      {entry.badge && (
                        <Text style={styles.leaderboardBadge}>{entry.badge}</Text>
                      )}
                    </View>

                    <View style={styles.leaderboardValueContainer}>
                      <Text style={[
                        styles.leaderboardValue,
                        isTopThree && styles.topThreeValue,
                      ]}>
                        {formatValue(entry.value)}
                      </Text>
                      {entry.change !== undefined && entry.change > 0 && (
                        <View style={styles.changeContainer}>
                          <TrendingUp size={12} color={colors.success} />
                          <Text style={styles.changeText}>+{entry.change}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userRankCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRankInfo: {
    flex: 1,
  },
  userRankLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  userRankValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScroll: {
    paddingLeft: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePeriodButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  activePeriodButtonText: {
    color: '#FFF',
  },
  leaderboardContainer: {
    padding: 20,
    paddingTop: 0,
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    gap: 12,
  },
  userLeaderboardCard: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  topThreeCard: {
    borderWidth: 2,
    borderColor: colors.warning + '40',
  },
  leaderboardRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  topThreeRank: {
    fontSize: 18,
    color: colors.warning,
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  topThreeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.warning,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  userLeaderboardName: {
    color: colors.primary,
  },
  leaderboardBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  leaderboardValueContainer: {
    alignItems: 'flex-end',
  },
  leaderboardValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  topThreeValue: {
    fontSize: 20,
    color: colors.warning,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
