import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  Search, 
  Briefcase, 
  DollarSign,
  Target,
  Zap,
  BarChart3,
  UserPlus,
  Handshake,
  Star,
  ArrowRight,
  CheckCircle2,
  Bell,
  Bot,
  FileText
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useMatching } from '@/contexts/MatchingContext';
import Colors from '@/constants/colors';
import { mockGigs, mockInfluencers } from '@/mocks/seed-data';
import { useMemo, useEffect } from 'react';
import type { InfluencerProfile } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { gigs, deals, applications, matches, notifications, feedActivities, loadData, loadApplications, loadNotifications, users } = useData();
  const { getInfluencerMatches, getSponsorMatches } = useMatching();

  useEffect(() => {
    loadData();
    loadApplications();
    loadNotifications();
  }, [loadData, loadApplications, loadNotifications]);

  const stats = useMemo(() => {
    if (!user) return null;

    if (user.role === 'influencer') {
      const myApplications = applications.filter(a => a.influencerId === user.id);
      const myDeals = deals.filter(d => d.influencerId === user.id);
      const activeDeals = myDeals.filter(d => d.status === 'active');
      const completedDeals = myDeals.filter(d => d.status === 'completed');
      const totalEarnings = completedDeals.reduce((sum, d) => sum + d.amount, 0);

      return {
        applications: myApplications.length,
        activeDeals: activeDeals.length,
        completedDeals: completedDeals.length,
        earnings: totalEarnings,
        matches: matches.filter(m => m.userId === user.id).length,
      };
    } else if (user.role === 'sponsor') {
      const myGigs = gigs.filter(g => g.sponsorId === user.id);
      const myDeals = deals.filter(d => d.sponsorId === user.id);
      const activeDeals = myDeals.filter(d => d.status === 'active');
      const completedDeals = myDeals.filter(d => d.status === 'completed');
      const totalSpent = completedDeals.reduce((sum, d) => sum + d.amount, 0);

      return {
        gigs: myGigs.length,
        activeDeals: activeDeals.length,
        completedDeals: completedDeals.length,
        spent: totalSpent,
        matches: matches.filter(m => m.userId === user.id).length,
      };
    } else if (user.role === 'agent') {
      const myDeals = deals.filter(d => d.agentId === user.id);
      const completedDeals = myDeals.filter(d => d.status === 'completed');
      const totalCommissions = completedDeals.reduce((sum, d) => sum + (d.amount * 0.1), 0);

      return {
        deals: myDeals.length,
        completedDeals: completedDeals.length,
        commissions: totalCommissions,
        recruits: (user as any).recruits?.length || 0,
        matches: matches.filter(m => m.userId === user.id).length,
      };
    }

    return null;
  }, [user, applications, deals, gigs, matches]);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const recentActivities = feedActivities.slice(0, 3);

  const suggestedMatches = useMemo(() => {
    if (!user) return { gigs: [], influencers: [] };

    if (user.role === 'influencer') {
      const allGigs = [...mockGigs, ...gigs.filter(g => g.status === 'open')];
      const matches = getInfluencerMatches(user as InfluencerProfile, allGigs, 5);
      return { gigs: matches.slice(0, 5), influencers: [] };
    } else if (user.role === 'sponsor') {
      const allInfluencers = [...mockInfluencers, ...users.filter(u => u.role === 'influencer')] as InfluencerProfile[];
      const matches = getSponsorMatches(user as any, allInfluencers, 10000, 5);
      return { gigs: [], influencers: matches.slice(0, 5) };
    }

    return { gigs: [], influencers: [] };
  }, [user, gigs, users, getInfluencerMatches, getSponsorMatches]);

  if (!user) return null;

  const renderInfluencerHome = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={styles.bellContainer}
          >
            <Bell size={24} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={styles.avatarContainer}
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.statGradient}>
            <Briefcase size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.applications || 0}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.success, '#10b981']} style={styles.statGradient}>
            <Handshake size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.activeDeals || 0}</Text>
            <Text style={styles.statLabel}>Active Deals</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.warning, '#f59e0b']} style={styles.statGradient}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>${((stats?.earnings ?? 0)).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.info, '#3b82f6']} style={styles.statGradient}>
            <Star size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.matches || 0}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </LinearGradient>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.earningsBanner}
        onPress={() => router.push('/rewards')}
      >
        <LinearGradient colors={[Colors.warning, Colors.secondary]} style={styles.earningsGradient}>
          <View style={styles.earningsContent}>
            <View style={styles.earningsLeft}>
              <DollarSign size={32} color="#FFFFFF" />
              <View>
                <Text style={styles.earningsTitle}>Earn Rewards</Text>
                <Text style={styles.earningsSubtitle}>Get paid for every action</Text>
              </View>
            </View>
            <ArrowRight size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
              <Search size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionTitle}>Browse Deals</Text>
            <Text style={styles.actionSubtitle}>Find opportunities</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-matching')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Sparkles size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>AI Matching</Text>
            <Text style={styles.actionSubtitle}>Smart connections</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/my-applications')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Briefcase size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>My Applications</Text>
            <Text style={styles.actionSubtitle}>Track progress</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
              <DollarSign size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionTitle}>Earnings</Text>
            <Text style={styles.actionSubtitle}>View payments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-assistant')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.info + '20' }]}>
              <Bot size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionTitle}>AI Assistant</Text>
            <Text style={styles.actionSubtitle}>Get help</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-profile-optimizer')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Target size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionTitle}>Optimize Profile</Text>
            <Text style={styles.actionSubtitle}>Boost visibility</Text>
          </TouchableOpacity>
        </View>
      </View>

      {suggestedMatches.gigs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested For You</Text>
            <TouchableOpacity onPress={() => router.push('/ai-matching')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {suggestedMatches.gigs.map((match) => (
              <TouchableOpacity 
                key={match.gig.id}
                style={styles.gigCard}
                onPress={() => router.push(`/gig-details?id=${match.gig.id}`)}
              >
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.gigCardGradient}>
                  <View style={styles.matchBadge}>
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={styles.matchBadgeText}>{match.matchScore.score}% Match</Text>
                  </View>
                  <Text style={styles.gigTitle} numberOfLines={2}>{match.gig.title}</Text>
                  <Text style={styles.gigSponsor}>{match.gig.sponsorName}</Text>
                  <View style={styles.gigCategories}>
                    {match.gig.categories.slice(0, 2).map((cat) => (
                      <View key={cat} style={styles.gigCategoryBadge}>
                        <Text style={styles.gigCategoryText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.gigFooter}>
                    <Text style={styles.gigPrice}>${(match.gig.price ?? 0).toLocaleString()}</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Opportunities</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[...mockGigs, ...gigs.filter(g => g.status === 'open')].slice(0, 5).map((gig) => (
            <TouchableOpacity 
              key={gig.id}
              style={styles.gigCard}
              onPress={() => router.push(`/gig-details?id=${gig.id}`)}
            >
              <LinearGradient colors={[Colors.darkCard, Colors.backgroundSecondary]} style={styles.gigCardGradient}>
                <Text style={styles.gigTitle} numberOfLines={2}>{gig.title}</Text>
                <Text style={styles.gigSponsor}>{gig.sponsorName}</Text>
                <View style={styles.gigCategories}>
                  {gig.categories.slice(0, 2).map((cat) => (
                    <View key={cat} style={styles.gigCategoryBadge}>
                      <Text style={styles.gigCategoryText}>{cat}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.gigFooter}>
                  <Text style={styles.gigPrice}>${(gig.price ?? 0).toLocaleString()}</Text>
                  <ArrowRight size={16} color={Colors.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Zap size={16} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderSponsorHome = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={styles.bellContainer}
          >
            <Bell size={24} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={styles.avatarContainer}
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.statGradient}>
            <Briefcase size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.gigs || 0}</Text>
            <Text style={styles.statLabel}>Active Gigs</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.success, '#10b981']} style={styles.statGradient}>
            <Handshake size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.activeDeals || 0}</Text>
            <Text style={styles.statLabel}>Active Deals</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.warning, '#f59e0b']} style={styles.statGradient}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>${((stats?.spent ?? 0)).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.info, '#3b82f6']} style={styles.statGradient}>
            <Star size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.matches || 0}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-assistant')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Bot size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>AI Assistant</Text>
            <Text style={styles.actionSubtitle}>Get instant help</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-matching')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Sparkles size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>AI Matching</Text>
            <Text style={styles.actionSubtitle}>Find influencers</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-contract-generator')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.info + '20' }]}>
              <FileText size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionTitle}>Contracts</Text>
            <Text style={styles.actionSubtitle}>Generate agreements</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/manage-gigs')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
              <Briefcase size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionTitle}>Manage Gigs</Text>
            <Text style={styles.actionSubtitle}>View & edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
              <Users size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionTitle}>Discover</Text>
            <Text style={styles.actionSubtitle}>Browse influencers</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/deal-management')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.danger + '20' }]}>
              <Handshake size={24} color={Colors.danger} />
            </View>
            <Text style={styles.actionTitle}>Deals</Text>
            <Text style={styles.actionSubtitle}>Manage campaigns</Text>
          </TouchableOpacity>
        </View>
      </View>

      {suggestedMatches.influencers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested For You</Text>
            <TouchableOpacity onPress={() => router.push('/ai-matching')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {suggestedMatches.influencers.map((match) => (
              <TouchableOpacity 
                key={match.influencer.id}
                style={styles.influencerCard}
                onPress={() => router.push(`/view-profile?userId=${match.influencer.id}`)}
              >
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.influencerCardGradient}>
                  <View style={styles.matchBadge}>
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={styles.matchBadgeText}>{match.matchScore.score}% Match</Text>
                  </View>
                  <Image source={{ uri: match.influencer.avatar }} style={styles.influencerAvatar} />
                  <Text style={styles.influencerName} numberOfLines={1}>{match.influencer.name}</Text>
                  <Text style={styles.influencerType}>{match.influencer.influencerType}</Text>
                  <View style={styles.influencerStats}>
                    <View style={styles.influencerStat}>
                      <Users size={12} color="#FFFFFF" />
                      <Text style={styles.influencerStatText}>{(match.influencer.followers / 1000).toFixed(0)}K</Text>
                    </View>
                    <View style={styles.influencerStat}>
                      <TrendingUp size={12} color="#FFFFFF" />
                      <Text style={styles.influencerStatText}>{match.influencer.engagementRate}%</Text>
                    </View>
                  </View>
                  <Text style={styles.influencerRate}>${(match.influencer.ratePerPost ?? 0).toLocaleString()}/post</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Influencers</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {mockInfluencers.slice(0, 5).map((influencer) => (
            <TouchableOpacity 
              key={influencer.id}
              style={styles.influencerCard}
              onPress={() => router.push(`/view-profile?userId=${influencer.id}`)}
            >
              <LinearGradient colors={[Colors.darkCard, Colors.backgroundSecondary]} style={styles.influencerCardGradient}>
                <Image source={{ uri: influencer.avatar }} style={styles.influencerAvatar} />
                <Text style={styles.influencerName} numberOfLines={1}>{influencer.name}</Text>
                <Text style={styles.influencerType}>{influencer.influencerType}</Text>
                <View style={styles.influencerStats}>
                  <View style={styles.influencerStat}>
                    <Users size={12} color={Colors.primary} />
                    <Text style={styles.influencerStatText}>{(influencer.followers / 1000).toFixed(0)}K</Text>
                  </View>
                  <View style={styles.influencerStat}>
                    <TrendingUp size={12} color={Colors.success} />
                    <Text style={styles.influencerStatText}>{influencer.engagementRate}%</Text>
                  </View>
                </View>
                <Text style={styles.influencerRate}>${(influencer.ratePerPost ?? 0).toLocaleString()}/post</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Zap size={16} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAgentHome = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={styles.bellContainer}
          >
            <Bell size={24} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={styles.avatarContainer}
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.statGradient}>
            <Handshake size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.deals || 0}</Text>
            <Text style={styles.statLabel}>Total Deals</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.success, '#10b981']} style={styles.statGradient}>
            <CheckCircle2 size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.completedDeals || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.warning, '#f59e0b']} style={styles.statGradient}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>${((stats?.commissions ?? 0)).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Commissions</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={[Colors.info, '#3b82f6']} style={styles.statGradient}>
            <UserPlus size={24} color="#FFFFFF" />
            <Text style={styles.statValue}>{stats?.recruits || 0}</Text>
            <Text style={styles.statLabel}>Recruits</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-assistant')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Bot size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>AI Assistant</Text>
            <Text style={styles.actionSubtitle}>Get instant help</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-matching')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Sparkles size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>AI Matching</Text>
            <Text style={styles.actionSubtitle}>Smart connections</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/agent-dashboard')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.info + '20' }]}>
              <BarChart3 size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionTitle}>Dashboard</Text>
            <Text style={styles.actionSubtitle}>View analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/agent-invites')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
              <UserPlus size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionTitle}>Invites</Text>
            <Text style={styles.actionSubtitle}>Recruit members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/ai-contract-generator')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
              <FileText size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionTitle}>Contracts</Text>
            <Text style={styles.actionSubtitle}>Generate deals</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.danger + '20' }]}>
              <DollarSign size={24} color={Colors.danger} />
            </View>
            <Text style={styles.actionTitle}>Earnings</Text>
            <Text style={styles.actionSubtitle}>Track income</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Network Opportunities</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.networkGrid}>
          <TouchableOpacity 
            style={styles.networkCard}
            onPress={() => router.push('/search')}
          >
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.networkCardGradient}>
              <Users size={32} color="#FFFFFF" />
              <Text style={styles.networkCardTitle}>Influencers</Text>
              <Text style={styles.networkCardSubtitle}>{mockInfluencers.length} available</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.networkCard}
            onPress={() => router.push('/search')}
          >
            <LinearGradient colors={[Colors.success, '#10b981']} style={styles.networkCardGradient}>
              <Briefcase size={32} color="#FFFFFF" />
              <Text style={styles.networkCardTitle}>Sponsors</Text>
              <Text style={styles.networkCardSubtitle}>{gigs.length} active gigs</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Zap size={16} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  if (user.role === 'influencer') return renderInfluencerHome();
  if (user.role === 'sponsor') return renderSponsorHome();
  if (user.role === 'agent') return renderAgentHome();

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  bellBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
    color: Colors.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  gigCard: {
    width: 240,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gigCardGradient: {
    padding: 16,
    gap: 8,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    height: 40,
  },
  gigSponsor: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  gigCategories: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  gigCategoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gigCategoryText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gigPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  influencerCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  influencerCardGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  influencerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  influencerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  influencerType: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  influencerStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  influencerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  influencerStatText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  influencerRate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activityDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  networkGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  networkCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  networkCardGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  networkCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  networkCardSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  earningsBanner: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  earningsGradient: {
    padding: 24,
  },
  earningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  earningsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earningsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
