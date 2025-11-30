import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { 
  Bookmark, Heart, GitCompare, Star, TrendingUp, 
  Award, Users, DollarSign, Clock, CheckCircle, 
  MessageSquare, Eye, Lightbulb
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useBrandCollaboration } from '@/contexts/BrandCollaborationContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import type { Gig } from '@/types';
import React from "react";

type TabType = 'saved' | 'compare' | 'reputation' | 'insights';

export default function BrandHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getSavedGigsByUser, 
    unsaveGig, 
    getComparisonsByUser,
    deleteComparison,
    reputations,
    calculateBrandReputation
  } = useBrandCollaboration();
  const { gigs, deals, users } = useData();
  
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  
  const userSavedGigs = user ? getSavedGigsByUser(user.id) : [];
  const userComparisons = user ? getComparisonsByUser(user.id) : [];

  const sponsorReputations = useMemo(() => {
    const sponsors = users.filter(u => u.role === 'sponsor');
    return sponsors.map(sponsor => {
      const existingRep = reputations.find(r => r.sponsorId === sponsor.id);
      if (existingRep) return existingRep;
      return calculateBrandReputation(sponsor.id, deals, []);
    }).sort((a, b) => b.overallRating - a.overallRating);
  }, [users, deals, reputations, calculateBrandReputation]);

  const marketInsights = useMemo(() => {
    const totalGigs = gigs.length;
    const openGigs = gigs.filter(g => g.status === 'open').length;
    const avgBudget = gigs.reduce((sum, g) => sum + ((g.budget.min + g.budget.max) / 2), 0) / (totalGigs || 1);
    const topCategories = gigs.reduce((acc, g) => {
      g.categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(topCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalGigs,
      openGigs,
      avgBudget,
      topCategories: sortedCategories,
    };
  }, [gigs]);

  const handleUnsave = async (gigId: string) => {
    if (user) await unsaveGig(user.id, gigId);
  };

  const handleDeleteComparison = async (comparisonId: string) => {
    await deleteComparison(comparisonId);
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <View style={styles.tabIcon}>{icon}</View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSavedGigsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Bookmark size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Saved Gigs ({userSavedGigs.length})</Text>
      </View>

      {userSavedGigs.length === 0 ? (
        <View style={styles.emptyState}>
          <Heart size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No saved gigs yet</Text>
          <Text style={styles.emptySubtext}>Browse gigs and save ones you&apos;re interested in</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push('/discover')}
          >
            <Text style={styles.ctaButtonText}>Browse Gigs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        userSavedGigs.map((saved) => {
          const gig = gigs.find(g => g.id === saved.gigId);
          if (!gig) return null;
          
          return (
            <View key={saved.id} style={styles.gigCard}>
              <TouchableOpacity 
                style={styles.gigContent}
                onPress={() => router.push(`/gig-details?id=${gig.id}` as any)}
              >
                <LinearGradient 
                  colors={[Colors.darkCard, Colors.backgroundSecondary]} 
                  style={styles.gigGradient}
                >
                  <View style={styles.gigHeader}>
                    <Text style={styles.gigTitle}>{gig.title}</Text>
                    <View style={styles.gigPriceContainer}>
                      <DollarSign size={16} color={Colors.primary} />
                      <Text style={styles.gigPrice}>{gig.price.toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.gigMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>
                        Saved {new Date(saved.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {gig.location && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaText}>{gig.location}</Text>
                      </View>
                    )}
                  </View>

                  {saved.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Your Notes:</Text>
                      <Text style={styles.notesText}>{saved.notes}</Text>
                    </View>
                  )}

                  <View style={styles.gigCategories}>
                    {gig.categories.slice(0, 3).map((cat, idx) => (
                      <View key={idx} style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.unsaveButton}
                onPress={() => handleUnsave(gig.id)}
              >
                <Bookmark size={20} color={Colors.danger} fill={Colors.danger} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderComparisonTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <GitCompare size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Gig Comparisons ({userComparisons.length})</Text>
      </View>

      {userComparisons.length === 0 ? (
        <View style={styles.emptyState}>
          <GitCompare size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No comparisons yet</Text>
          <Text style={styles.emptySubtext}>Compare multiple gigs to make better decisions</Text>
        </View>
      ) : (
        userComparisons.map((comparison) => {
          const comparisonGigs = comparison.gigIds
            .map(id => gigs.find(g => g.id === id))
            .filter(Boolean) as Gig[];

          if (comparisonGigs.length === 0) return null;

          const avgPrice = comparisonGigs.reduce((sum, g) => sum + g.price, 0) / comparisonGigs.length;

          return (
            <View key={comparison.id} style={styles.comparisonCard}>
              <LinearGradient
                colors={[Colors.darkCard, Colors.backgroundSecondary]}
                style={styles.comparisonGradient}
              >
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonName}>
                    {comparison.name || 'Untitled Comparison'}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteComparison(comparison.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.comparisonStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Gigs</Text>
                    <Text style={styles.statValue}>{comparisonGigs.length}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Avg Price</Text>
                    <Text style={styles.statValue}>${avgPrice.toFixed(0)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Created</Text>
                    <Text style={styles.statValue}>
                      {new Date(comparison.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.comparisonGigs}>
                  {comparisonGigs.map((gig, idx) => (
                    <TouchableOpacity
                      key={gig.id}
                      style={styles.miniGigCard}
                      onPress={() => router.push(`/gig-details?id=${gig.id}` as any)}
                    >
                      <Text style={styles.miniGigTitle} numberOfLines={1}>{gig.title}</Text>
                      <Text style={styles.miniGigPrice}>${gig.price.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>
          );
        })
      )}
    </View>
  );

  const renderReputationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Award size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Brand Reputation Insights</Text>
      </View>

      {sponsorReputations.length === 0 ? (
        <View style={styles.emptyState}>
          <Star size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No reputation data yet</Text>
          <Text style={styles.emptySubtext}>Complete deals to build brand reputation insights</Text>
        </View>
      ) : (
        sponsorReputations.map((rep) => {
          const sponsor = users.find(u => u.id === rep.sponsorId);
          if (!sponsor) return null;

          return (
            <View key={rep.sponsorId} style={styles.reputationCard}>
              <LinearGradient
                colors={[Colors.darkCard, Colors.backgroundSecondary]}
                style={styles.reputationGradient}
              >
                <View style={styles.reputationHeader}>
                  <Text style={styles.sponsorName}>{sponsor.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color={Colors.warning} fill={Colors.warning} />
                    <Text style={styles.ratingText}>{rep.overallRating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.reputationGrid}>
                  <View style={styles.reputationItem}>
                    <Clock size={16} color={Colors.primary} />
                    <Text style={styles.repLabel}>Payment Speed</Text>
                    <Text style={styles.repValue}>{rep.paymentSpeedRating.toFixed(1)}/5</Text>
                  </View>
                  <View style={styles.reputationItem}>
                    <MessageSquare size={16} color={Colors.primary} />
                    <Text style={styles.repLabel}>Communication</Text>
                    <Text style={styles.repValue}>{rep.communicationRating.toFixed(1)}/5</Text>
                  </View>
                  <View style={styles.reputationItem}>
                    <CheckCircle size={16} color={Colors.primary} />
                    <Text style={styles.repLabel}>Professionalism</Text>
                    <Text style={styles.repValue}>{rep.professionalismRating.toFixed(1)}/5</Text>
                  </View>
                  <View style={styles.reputationItem}>
                    <TrendingUp size={16} color={Colors.primary} />
                    <Text style={styles.repLabel}>Total Deals</Text>
                    <Text style={styles.repValue}>{rep.totalDeals}</Text>
                  </View>
                </View>

                <View style={styles.reputationFooter}>
                  <Text style={styles.reviewCount}>
                    {rep.reviewCount} {rep.reviewCount === 1 ? 'review' : 'reviews'}
                  </Text>
                  <Text style={styles.avgPaymentTime}>
                    Avg payment: {rep.averagePaymentTime.toFixed(0)} days
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.viewProfileButton}
                  onPress={() => router.push(`/view-profile?id=${sponsor.id}` as any)}
                >
                  <Eye size={16} color={Colors.primary} />
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          );
        })
      )}
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Lightbulb size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Market Insights</Text>
      </View>

      <View style={styles.insightsContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.insightCard}
        >
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Total Gigs</Text>
            <Text style={styles.insightValue}>{marketInsights.totalGigs}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Open Opportunities</Text>
            <Text style={styles.insightValue}>{marketInsights.openGigs}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Average Budget</Text>
            <Text style={styles.insightValue}>${marketInsights.avgBudget.toFixed(0)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <TrendingUp size={18} color={Colors.primary} />
            <Text style={styles.trendingTitle}>Top Categories</Text>
          </View>

          {marketInsights.topCategories.map(([category, count], idx) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryRank}>
                <Text style={styles.rankText}>#{idx + 1}</Text>
              </View>
              <Text style={styles.categoryName}>{category}</Text>
              <View style={styles.categoryBar}>
                <View 
                  style={[
                    styles.categoryBarFill, 
                    { 
                      width: `${(count / marketInsights.totalGigs) * 100}%`,
                      backgroundColor: idx === 0 ? Colors.primary : Colors.accent
                    }
                  ]} 
                />
              </View>
              <Text style={styles.categoryCount}>{count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Users size={20} color={Colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Build Relationships</Text>
              <Text style={styles.tipText}>
                Brands with higher ratings tend to offer repeat collaborations
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Star size={20} color={Colors.warning} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Quality Over Quantity</Text>
              <Text style={styles.tipText}>
                Focus on brands with proven track records and good reviews
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <DollarSign size={20} color={Colors.success} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Compare Opportunities</Text>
              <Text style={styles.tipText}>
                Use comparisons to evaluate similar gigs and find the best fit
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ 
        title: 'Brand Collaboration Hub',
        headerShown: false
      }} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.dark, Colors.darkCard]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Brand Hub</Text>
          <Text style={styles.headerSubtitle}>Your collaboration center</Text>
        </LinearGradient>
      </View>

      <View style={styles.tabs}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {renderTabButton('saved', <Bookmark size={20} color={activeTab === 'saved' ? Colors.primary : Colors.textMuted} />, 'Saved')}
          {renderTabButton('compare', <GitCompare size={20} color={activeTab === 'compare' ? Colors.primary : Colors.textMuted} />, 'Compare')}
          {renderTabButton('reputation', <Award size={20} color={activeTab === 'reputation' ? Colors.primary : Colors.textMuted} />, 'Reputation')}
          {renderTabButton('insights', <Lightbulb size={20} color={activeTab === 'insights' ? Colors.primary : Colors.textMuted} />, 'Insights')}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'saved' && renderSavedGigsTab()}
        {activeTab === 'compare' && renderComparisonTab()}
        {activeTab === 'reputation' && renderReputationTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.dark 
  },
  header: {
    backgroundColor: Colors.dark,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700' as const, 
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  tabs: {
    backgroundColor: Colors.darkCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  tabButtonActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  tabIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 20 
  },
  tabContent: {
    gap: 12,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700' as const, 
    color: Colors.text 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '600' as const, 
    color: Colors.textSecondary, 
    marginTop: 16 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: Colors.textMuted, 
    marginTop: 8,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark,
  },
  gigCard: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 12, 
    position: 'relative' 
  },
  gigContent: { 
    flex: 1 
  },
  gigGradient: { 
    padding: 16 
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  gigTitle: { 
    flex: 1,
    fontSize: 16, 
    fontWeight: '600' as const, 
    color: Colors.text,
  },
  gigPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 12,
  },
  gigPrice: { 
    fontSize: 16, 
    fontWeight: '700' as const, 
    color: Colors.primary,
  },
  gigMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notesBox: { 
    padding: 12, 
    backgroundColor: Colors.backgroundSecondary, 
    borderRadius: 8, 
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: { 
    fontSize: 13, 
    color: Colors.textSecondary,
  },
  gigCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${Colors.accent}30`,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  unsaveButton: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    padding: 8, 
    backgroundColor: Colors.darkCard, 
    borderRadius: 20 
  },
  comparisonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  comparisonGradient: {
    padding: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  comparisonGigs: {
    gap: 8,
  },
  miniGigCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  miniGigTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  miniGigPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginLeft: 12,
  },
  reputationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  reputationGradient: {
    padding: 16,
  },
  reputationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.warning}20`,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  reputationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  reputationItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    gap: 6,
  },
  repLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  repValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reputationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  avgPaymentTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.dark,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark,
  },
  trendingSection: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  categoryRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  categoryBar: {
    width: 80,
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCount: {
    width: 32,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'right',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
