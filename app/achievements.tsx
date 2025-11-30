import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Lock, Check } from 'lucide-react-native';
import { useGamification } from '@/contexts/GamificationContext';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import type { Achievement } from '@/contexts/GamificationContext';

type AchievementCategory = 'all' | 'earnings' | 'recruits' | 'conversion' | 'milestone';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAchievements } = useGamification();
  
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const achievements = getAchievements(user.id);
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalCount = achievements.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  const categories: { id: AchievementCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'recruits', label: 'Recruits' },
    { id: 'conversion', label: 'Conversion' },
    { id: 'milestone', label: 'Milestones' },
  ];

  const getTierColor = (tier?: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    switch (tier) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return colors.warning;
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return colors.primary;
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.progress / achievement.requirement) * 100, 100);
  };

  const formatProgress = (achievement: Achievement) => {
    switch (achievement.category) {
      case 'earnings':
        return `$${achievement.progress.toFixed(0)} / $${achievement.requirement}`;
      case 'conversion':
        return `${achievement.progress.toFixed(1)}% / ${achievement.requirement}%`;
      default:
        return `${Math.floor(achievement.progress)} / ${achievement.requirement}`;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Achievements',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount} of {totalCount} unlocked
          </Text>
        </View>

        <View style={styles.overallProgressCard}>
          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressLabel}>Overall Progress</Text>
            <Text style={styles.overallProgressValue}>{completionPercentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.overallProgressBarContainer}>
            <View 
              style={[
                styles.overallProgressBar, 
                { width: `${completionPercentage}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.categorySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.activeCategoryButton,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === cat.id && styles.activeCategoryButtonText,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.achievementsList}>
          {filteredAchievements.map(achievement => {
            const progressPercentage = getProgressPercentage(achievement);
            const tierColor = getTierColor(achievement.tier);
            
            return (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.isCompleted && styles.completedAchievementCard,
                  achievement.tier && styles.tierAchievementCard,
                ]}
              >
                <View style={styles.achievementHeader}>
                  <View style={[
                    styles.achievementIconContainer,
                    achievement.isCompleted && { backgroundColor: tierColor + '20' },
                    !achievement.isCompleted && styles.lockedIconContainer,
                  ]}>
                    {achievement.isCompleted ? (
                      <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                    ) : (
                      <Lock size={24} color={colors.textSecondary} />
                    )}
                  </View>
                  
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={[
                        styles.achievementName,
                        !achievement.isCompleted && styles.lockedAchievementName,
                      ]}>
                        {achievement.name}
                      </Text>
                      {achievement.isCompleted && (
                        <View style={[styles.completedBadge, { backgroundColor: tierColor }]}>
                          <Check size={14} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    
                    {achievement.tier && (
                      <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
                        <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                          {achievement.tier.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {!achievement.isCompleted && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>{formatProgress(achievement)}</Text>
                      <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { width: `${progressPercentage}%`, backgroundColor: tierColor }
                        ]} 
                      />
                    </View>
                  </View>
                )}

                {achievement.isCompleted && achievement.completedAt && (
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedDate}>
                      Unlocked {new Date(achievement.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Award size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No achievements in this category</Text>
          </View>
        )}
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
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
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
  overallProgressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallProgressLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  overallProgressValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  overallProgressBarContainer: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  overallProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  categorySelector: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  activeCategoryButtonText: {
    color: '#FFF',
  },
  achievementsList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  completedAchievementCard: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '05',
  },
  tierAchievementCard: {
    borderWidth: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconContainer: {
    backgroundColor: colors.textSecondary + '20',
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  lockedAchievementName: {
    color: colors.textSecondary,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completedDate: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
