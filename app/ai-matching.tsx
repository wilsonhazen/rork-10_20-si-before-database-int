import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp, Users, DollarSign, MapPin, Target, ArrowRight, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useMatching } from '@/contexts/MatchingContext';
import { mockInfluencers, mockGigs, mockSponsors } from '@/mocks/seed-data';
import Colors from '@/constants/colors';
import type { InfluencerProfile, Gig } from '@/types';
import type { MatchScore } from '@/utils/matching-algorithm';

type MatchItem = 
  | { type: 'gig'; data: Gig; matchScore: MatchScore }
  | { type: 'influencer'; data: InfluencerProfile; matchScore: MatchScore };

export default function AIMatchingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { gigs, conversations, addConversation } = useData();
  const { getInfluencerMatches, getSponsorMatches } = useMatching();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'excellent' | 'good'>('all');
  const [budgetFilter, setBudgetFilter] = useState('');

  const allGigs = useMemo(() => [...mockGigs, ...gigs.filter(g => g.status === 'open')], [gigs]);

  const matches = useMemo((): MatchItem[] => {
    if (!user) return [];

    if (user.role === 'influencer') {
      const influencer = mockInfluencers.find(i => i.id === user.id);
      if (!influencer) {
        console.log('User not found in mockInfluencers, using first influencer for demo');
        const demoInfluencer = mockInfluencers[0];
        const gigMatches = getInfluencerMatches(demoInfluencer, allGigs, 50);
        return gigMatches.map(m => ({
          type: 'gig' as const,
          data: m.gig,
          matchScore: m.matchScore,
        }));
      }
      
      const gigMatches = getInfluencerMatches(influencer, allGigs, 50);
      return gigMatches.map(m => ({
        type: 'gig' as const,
        data: m.gig,
        matchScore: m.matchScore,
      }));
    } else if (user.role === 'sponsor') {
      const sponsor = mockSponsors.find(s => s.id === user.id);
      if (!sponsor) {
        console.log('User not found in mockSponsors, using first sponsor for demo');
        const demoSponsor = mockSponsors[0];
        const budget = budgetFilter ? parseInt(budgetFilter) : 10000;
        const influencerMatches = getSponsorMatches(demoSponsor, mockInfluencers, budget, 50);
        return influencerMatches.map(m => ({
          type: 'influencer' as const,
          data: m.influencer,
          matchScore: m.matchScore,
        }));
      }
      
      const budget = budgetFilter ? parseInt(budgetFilter) : 10000;
      const influencerMatches = getSponsorMatches(sponsor, mockInfluencers, budget, 50);
      return influencerMatches.map(m => ({
        type: 'influencer' as const,
        data: m.influencer,
        matchScore: m.matchScore,
      }));
    } else if (user.role === 'agent') {
      const influencerMatches = mockInfluencers.slice(0, 15).map(influencer => {
        const gigMatches = getInfluencerMatches(influencer, allGigs, 3);
        const avgScore = gigMatches.length > 0
          ? gigMatches.reduce((sum, m) => sum + m.matchScore.score, 0) / gigMatches.length
          : 0;
        
        return {
          type: 'influencer' as const,
          data: influencer,
          matchScore: {
            score: Math.round(avgScore),
            breakdown: {
              categoryMatch: 0,
              followerSizeMatch: 0,
              budgetMatch: 0,
              locationMatch: 0,
              engagementRate: 0,
              priceCompatibility: 0,
            },
            reasons: [`${gigMatches.length} matching opportunities`],
            compatibility: avgScore >= 85 ? 'excellent' as const : avgScore >= 70 ? 'good' as const : avgScore >= 55 ? 'fair' as const : 'poor' as const,
          },
        };
      });
      
      return influencerMatches.filter(m => m.matchScore.score >= 50);
    }

    return [];
  }, [user, allGigs, getInfluencerMatches, getSponsorMatches, budgetFilter]);

  const filteredMatches = useMemo(() => {
    let filtered = matches;

    if (selectedFilter === 'excellent') {
      filtered = filtered.filter(m => m.matchScore.compatibility === 'excellent');
    } else if (selectedFilter === 'good') {
      filtered = filtered.filter(m => m.matchScore.compatibility === 'excellent' || m.matchScore.compatibility === 'good');
    }

    return filtered.sort((a, b) => b.matchScore.score - a.matchScore.score);
  }, [matches, selectedFilter]);

  const stats = useMemo(() => {
    const excellent = matches.filter(m => m.matchScore.compatibility === 'excellent').length;
    const good = matches.filter(m => m.matchScore.compatibility === 'good').length;
    const avgScore = matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + m.matchScore.score, 0) / matches.length)
      : 0;

    return { excellent, good, avgScore, total: matches.length };
  }, [matches]);

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return Colors.success;
      case 'good': return Colors.primary;
      case 'fair': return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const handleMessage = (targetId: string, targetName: string, targetAvatar?: string) => {
    if (!user) return;
    
    const existingConv = conversations.find(c => 
      c.participants.includes(user.id) && c.participants.includes(targetId)
    );

    if (existingConv) {
      router.push(`/conversation?conversationId=${existingConv.id}`);
    } else {
      const newConv = {
        id: `conv_${Date.now()}`,
        participants: [user.id, targetId],
        participantNames: [user.name, targetName],
        participantAvatars: [user.avatar, targetAvatar],
        unreadCount: 0,
      };
      addConversation(newConv);
      router.push(`/conversation?conversationId=${newConv.id}`);
    }
  };

  const renderInfluencerMatch = (influencer: InfluencerProfile, matchScore: any) => (
    <TouchableOpacity
      key={influencer.id}
      style={styles.matchCard}
      onPress={() => router.push(`/view-profile?userId=${influencer.id}`)}
    >
      <LinearGradient
        colors={[Colors.darkCard, Colors.backgroundSecondary]}
        style={styles.matchCardGradient}
      >
        <View style={styles.matchHeader}>
          <Image source={{ uri: influencer.avatar }} style={styles.matchAvatar} />
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{influencer.name}</Text>
            <Text style={styles.matchType}>{influencer.influencerType}</Text>
            <View style={styles.matchLocation}>
              <MapPin size={12} color={Colors.textSecondary} />
              <Text style={styles.matchLocationText}>{influencer.location}</Text>
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{matchScore.score}%</Text>
            <Text style={[styles.compatibility, { color: getCompatibilityColor(matchScore.compatibility) }]}>
              {matchScore.compatibility}
            </Text>
          </View>
        </View>

        <View style={styles.matchStats}>
          <View style={styles.matchStat}>
            <Users size={14} color={Colors.primary} />
            <Text style={styles.matchStatText}>{(influencer.followers / 1000).toFixed(0)}K</Text>
          </View>
          <View style={styles.matchStat}>
            <TrendingUp size={14} color={Colors.success} />
            <Text style={styles.matchStatText}>{influencer.engagementRate}%</Text>
          </View>
          <View style={styles.matchStat}>
            <DollarSign size={14} color={Colors.warning} />
            <Text style={styles.matchStatText}>${(influencer.ratePerPost / 1000).toFixed(1)}K</Text>
          </View>
        </View>

        {matchScore.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {matchScore.reasons.slice(0, 3).map((reason: string, idx: number) => (
              <View key={idx} style={styles.reasonBadge}>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.matchActions}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMessage(influencer.id, influencer.name, influencer.avatar);
            }}
          >
            <MessageCircle size={18} color={Colors.primary} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Profile</Text>
            <ArrowRight size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderGigMatch = (gig: Gig, matchScore: any) => (
    <TouchableOpacity
      key={gig.id}
      style={styles.matchCard}
      onPress={() => router.push(`/gig-details?id=${gig.id}`)}
    >
      <LinearGradient
        colors={[Colors.darkCard, Colors.backgroundSecondary]}
        style={styles.matchCardGradient}
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{gig.title}</Text>
            <Text style={styles.matchType}>by {gig.sponsorName}</Text>
            {gig.location && (
              <View style={styles.matchLocation}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.matchLocationText}>{gig.location}</Text>
              </View>
            )}
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{matchScore.score}%</Text>
            <Text style={[styles.compatibility, { color: getCompatibilityColor(matchScore.compatibility) }]}>
              {matchScore.compatibility}
            </Text>
          </View>
        </View>

        <View style={styles.gigCategories}>
          {gig.categories.slice(0, 3).map((cat) => (
            <View key={cat} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>

        {matchScore.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {matchScore.reasons.slice(0, 3).map((reason: string, idx: number) => (
              <View key={idx} style={styles.reasonBadge}>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.gigFooter}>
          <View style={styles.priceContainer}>
            <DollarSign size={16} color={Colors.warning} />
            <Text style={styles.priceText}>${gig.price.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.applyButton}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.applyButtonGradient}
            >
              <Text style={styles.applyButtonText}>View Details</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Matching',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Sparkles size={40} color="#FFFFFF" />
            <Text style={styles.headerTitle}>AI-Powered Matching</Text>
            <Text style={styles.headerTagline}>Where Magic Meets Data</Text>
            <Text style={styles.headerSubtitle}>
              {user?.role === 'influencer' 
                ? '🚀 Stop scrolling through endless gigs. Our AI finds premium brand deals that match your niche, audience, and earning goals—in seconds. Get matched with sponsors who value your influence.'
                : user?.role === 'sponsor'
                ? '🎯 Stop wasting time on mismatched influencers. Our intelligent algorithm connects you with creators who actually move the needle for your brand. Find influencers with the right audience, engagement, and reach.'
                : '⚡ Supercharge your network. Watch our AI create perfect partnerships that drive real results for both influencers and brands.'}
            </Text>
            <View style={styles.headerBadges}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🧠 Smart Algorithm</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>⚡ Instant Results</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>💎 Premium Matches</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Target size={20} color={Colors.success} />
            <Text style={styles.statNumber}>{stats.excellent}</Text>
            <Text style={styles.statLabel}>Excellent Matches</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.good}</Text>
            <Text style={styles.statLabel}>Good Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Sparkles size={20} color={Colors.warning} />
            <Text style={styles.statNumber}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                All ({matches.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'excellent' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('excellent')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'excellent' && styles.filterChipTextActive]}>
                Excellent ({stats.excellent})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'good' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('good')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'good' && styles.filterChipTextActive]}>
                Good+ ({stats.excellent + stats.good})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {user?.role === 'sponsor' && (
            <View style={styles.budgetFilterContainer}>
              <Text style={styles.budgetLabel}>Budget Filter</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="e.g., 10000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={budgetFilter}
                onChangeText={setBudgetFilter}
              />
            </View>
          )}
        </View>

        <View style={styles.matchesContainer}>
          <Text style={styles.matchesTitle}>
            {filteredMatches.length} Matches Found
          </Text>
          {filteredMatches.map((match) =>
            match.type === 'influencer'
              ? renderInfluencerMatch(match.data as InfluencerProfile, match.matchScore)
              : renderGigMatch(match.data as Gig, match.matchScore)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.92,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  headerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.darkCard,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  budgetFilterContainer: {
    marginTop: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  budgetInput: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  matchesContainer: {
    paddingHorizontal: 20,
  },
  matchesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  matchCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  matchCardGradient: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
    gap: 4,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  matchType: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  matchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  compatibility: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  matchStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  matchStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchStatText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reasonBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  matchActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  gigCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
