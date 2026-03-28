import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import type { Deal } from '@/types';

const mockDeals: Deal[] = [
  {
    id: '1',
    gigId: 'g1',
    gigTitle: 'Instagram Campaign for Fashion Brand',
    influencerId: 'inf1',
    influencerName: 'Sarah Johnson',
    influencerAvatar: 'https://i.pravatar.cc/150?img=1',
    sponsorId: 'sp1',
    sponsorName: 'Fashion Co',
    sponsorAvatar: 'https://i.pravatar.cc/150?img=20',
    agentId: 'ag1',
    agentName: 'Mike Agent',
    amount: 5000,
    agentCommission: 750,
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    gigId: 'g2',
    gigTitle: 'Tech Product Review Series',
    influencerId: 'inf2',
    influencerName: 'Mike Chen',
    influencerAvatar: 'https://i.pravatar.cc/150?img=12',
    sponsorId: 'sp2',
    sponsorName: 'Tech Startup',
    sponsorAvatar: 'https://i.pravatar.cc/150?img=21',
    amount: 3500,
    agentCommission: 525,
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    gigId: 'g3',
    gigTitle: 'Fitness Challenge Sponsorship',
    influencerId: 'inf3',
    influencerName: 'Emma Davis',
    influencerAvatar: 'https://i.pravatar.cc/150?img=5',
    sponsorId: 'sp3',
    sponsorName: 'Wellness Brand',
    sponsorAvatar: 'https://i.pravatar.cc/150?img=22',
    agentId: 'ag2',
    agentName: 'Lisa Agent',
    amount: 8000,
    agentCommission: 1200,
    status: 'completed',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type TabType = 'all' | 'pending' | 'active' | 'completed';

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredDeals = mockDeals.filter(deal => {
    if (activeTab === 'all') return true;
    return deal.status === activeTab;
  });

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={Colors.warning} />;
      case 'active':
        return <TrendingUp size={16} color={Colors.primary} />;
      case 'completed':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'cancelled':
        return <XCircle size={16} color={Colors.danger} />;
    }
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'active':
        return Colors.primary;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.danger;
    }
  };

  const renderDealCard = (deal: Deal) => {
    const isAgent = user?.role === 'agent';
    const earnings = isAgent ? deal.agentCommission : deal.amount;

    return (
      <TouchableOpacity key={deal.id} activeOpacity={0.8} style={styles.dealCard}>
        <LinearGradient
          colors={[Colors.darkCard, Colors.backgroundSecondary]}
          style={styles.dealCardGradient}
        >
          <View style={styles.dealHeader}>
            <View style={styles.dealTitleRow}>
              <Text style={styles.dealTitle} numberOfLines={1}>
                {deal.gigTitle}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '20' }]}>
                {getStatusIcon(deal.status)}
                <Text style={[styles.statusText, { color: getStatusColor(deal.status) }]}>
                  {deal.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dealParties}>
            <TouchableOpacity 
              style={styles.party}
              onPress={() => router.push(`/view-profile?userId=${deal.influencerId}`)}
            >
              <Text style={styles.partyLabel}>Influencer</Text>
              <Text style={styles.partyName}>{deal.influencerName}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.party}
              onPress={() => router.push(`/view-profile?userId=${deal.sponsorId}`)}
            >
              <Text style={styles.partyLabel}>Sponsor</Text>
              <Text style={styles.partyName}>{deal.sponsorName}</Text>
            </TouchableOpacity>
            {deal.agentName && deal.agentId && (
              <TouchableOpacity 
                style={styles.party}
                onPress={() => router.push(`/view-profile?userId=${deal.agentId}`)}
              >
                <Text style={styles.partyLabel}>Agent</Text>
                <Text style={styles.partyName}>{deal.agentName}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dealFooter}>
            <View style={styles.amountContainer}>
              <DollarSign size={20} color={Colors.warning} />
              <Text style={styles.amount}>${earnings.toLocaleString()}</Text>
              {isAgent && <Text style={styles.commissionLabel}>(15% commission)</Text>}
            </View>
            <Text style={styles.date}>
              {new Date(deal.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const totalEarnings = filteredDeals
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + (user?.role === 'agent' ? d.agentCommission : d.amount), 0);

  const pendingEarnings = filteredDeals
    .filter(d => d.status === 'active' || d.status === 'pending')
    .reduce((sum, d) => sum + (user?.role === 'agent' ? d.agentCommission : d.amount), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deals</Text>
        <Text style={styles.headerSubtitle}>Track your partnerships</Text>
      </View>

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[Colors.success, Colors.primary]}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={styles.statValue}>${totalEarnings.toLocaleString()}</Text>
        </LinearGradient>

        <LinearGradient
          colors={[Colors.warning, Colors.secondary]}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>${pendingEarnings.toLocaleString()}</Text>
        </LinearGradient>
      </View>

      <View style={styles.tabs}>
        {(['all', 'pending', 'active', 'completed'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.dealsList}
        contentContainerStyle={styles.dealsListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDeals.length > 0 ? (
          filteredDeals.map(renderDealCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No deals yet</Text>
            <Text style={styles.emptyText}>
              Start swiping to create matches and close deals!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  dealsList: {
    flex: 1,
  },
  dealsListContent: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  dealCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dealCardGradient: {
    padding: 16,
  },
  dealHeader: {
    marginBottom: 12,
  },
  dealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dealTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  dealParties: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  party: {
    flex: 1,
    minWidth: 100,
  },
  partyLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  commissionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
