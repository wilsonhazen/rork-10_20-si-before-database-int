import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, CheckCircle, XCircle, DollarSign, Briefcase } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

export default function MyApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { applications, gigs } = useData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const myApplications = applications.filter(a => a.influencerId === user?.id);

  console.log('=== MY APPLICATIONS DEBUG ===');
  console.log('Current user ID:', user?.id);
  console.log('Current user role:', user?.role);
  console.log('Total applications:', applications.length);
  console.log('My applications:', myApplications.length);
  console.log('All applications:', applications.map(a => ({
    id: a.id,
    influencerId: a.influencerId,
    gigId: a.gigId,
    status: a.status,
    matches: a.influencerId === user?.id
  })));
  console.log('===========================');

  const filteredApplications = filter === 'all' 
    ? myApplications 
    : myApplications.filter(a => a.status === filter);

  const getStatusIcon = (status: typeof applications[0]['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={Colors.warning} />;
      case 'approved':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'rejected':
        return <XCircle size={16} color={Colors.danger} />;
    }
  };

  const getStatusColor = (status: typeof applications[0]['status']) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.danger;
    }
  };

  const renderApplication = (application: typeof applications[0]) => {
    const gig = gigs.find(g => g.id === application.gigId);
    if (!gig) return null;

    return (
      <View key={application.id} style={styles.applicationCard}>
        <LinearGradient
          colors={[Colors.darkCard, Colors.backgroundSecondary]}
          style={styles.applicationGradient}
        >
          <View style={styles.applicationHeader}>
            <View style={styles.gigInfo}>
              <Text style={styles.gigTitle} numberOfLines={2}>
                {gig.title}
              </Text>
              <Text style={styles.sponsorName}>{gig.sponsorName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
              {getStatusIcon(application.status)}
              <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                {application.status}
              </Text>
            </View>
          </View>

          <Text style={styles.gigDescription} numberOfLines={2}>
            {gig.description}
          </Text>

          <View style={styles.gigDetails}>
            <View style={styles.gigDetail}>
              <DollarSign size={16} color={Colors.warning} />
              <Text style={styles.gigDetailText}>
                ${gig.budget.min.toLocaleString()} - ${gig.budget.max.toLocaleString()}
              </Text>
            </View>
          </View>

          {application.status === 'approved' && (
            <View style={styles.approvedBanner}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.approvedText}>
                Congratulations! Check your messages for next steps.
              </Text>
            </View>
          )}

          {application.status === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <Text style={styles.rejectedText}>
                Not selected this time. Keep applying to other opportunities!
              </Text>
            </View>
          )}

          <View style={styles.applicationFooter}>
            <Text style={styles.appliedDate}>
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </Text>
            {application.reviewedAt && (
              <Text style={styles.reviewedDate}>
                Reviewed {new Date(application.reviewedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>
            {myApplications.length} total applications
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.applicationsList}
        contentContainerStyle={styles.applicationsListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredApplications.length > 0 ? (
          filteredApplications.map(renderApplication)
        ) : (
          <View style={styles.emptyState}>
            <Briefcase size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'Start applying to gigs in the Discover tab'
                : `No ${filter} applications`}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  applicationsList: {
    flex: 1,
  },
  applicationsListContent: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  applicationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  applicationGradient: {
    padding: 16,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  gigInfo: {
    flex: 1,
    gap: 4,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sponsorName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
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
  gigDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  gigDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  gigDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gigDetailText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  approvedText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  rejectedBanner: {
    backgroundColor: Colors.danger + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  rejectedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  appliedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewedDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
