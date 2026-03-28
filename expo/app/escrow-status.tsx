import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usePayment } from '@/contexts/PaymentContext';
import colors from '@/constants/colors';

export default function EscrowStatusScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { applications, gigs } = useData();
  const { escrowJobs, getUserBalance } = usePayment();
  const [filter, setFilter] = useState<'all' | 'locked' | 'released' | 'refunded'>('all');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view escrow status</Text>
      </View>
    );
  }

  const balance = getUserBalance(user.id, 'usd');
  const myEscrowJobs =
    user.role === 'sponsor'
      ? escrowJobs.filter((e) => e.sponsorId === user.id)
      : escrowJobs.filter((e) => e.influencerId === user.id);

  const filteredJobs =
    filter === 'all' ? myEscrowJobs : myEscrowJobs.filter((e) => e.status === filter);

  const totalLocked = myEscrowJobs
    .filter((e) => e.status === 'locked')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalReleased = myEscrowJobs
    .filter((e) => e.status === 'released')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Escrow Status',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color={colors.success} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Available Balance</Text>
              <Text style={styles.statValue}>${(balance?.availableBalance || 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
              <Lock size={24} color={colors.warning} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>In Escrow</Text>
              <Text style={styles.statValue}>${totalLocked.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <TrendingUp size={24} color={colors.accent} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total Released</Text>
              <Text style={styles.statValue}>${totalReleased.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'locked', 'released', 'refunded'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Lock size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No escrow transactions</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all'
                ? 'Your escrow transactions will appear here'
                : `No ${filter} transactions`}
            </Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {filteredJobs.map((escrowJob) => {
              const application = applications.find((a) => a.id === escrowJob.applicationId);
              const gig = gigs.find((g) => g.id === escrowJob.gigId);
              const isInfluencer = user.role === 'influencer';

              return (
                <TouchableOpacity
                  key={escrowJob.id}
                  style={styles.jobCard}
                  onPress={() => {
                    if (user.role === 'sponsor') {
                      router.push('/deal-management');
                    }
                  }}
                >
                  <View style={styles.jobHeader}>
                    <Image
                      source={{
                        uri: isInfluencer
                          ? gig?.sponsorAvatar || 'https://i.pravatar.cc/150'
                          : application?.influencerAvatar || 'https://i.pravatar.cc/150',
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.jobInfo}>
                      <Text style={styles.gigTitle} numberOfLines={1}>
                        {gig?.title || 'Unknown Gig'}
                      </Text>
                      <Text style={styles.partnerName}>
                        {isInfluencer
                          ? `Sponsor: ${gig?.sponsorName || 'Unknown'}`
                          : `Influencer: ${application?.influencerName || 'Unknown'}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            escrowJob.status === 'released'
                              ? colors.success + '20'
                              : escrowJob.status === 'refunded'
                              ? colors.error + '20'
                              : colors.warning + '20',
                        },
                      ]}
                    >
                      {escrowJob.status === 'locked' && <Lock size={14} color={colors.warning} />}
                      {escrowJob.status === 'released' && (
                        <CheckCircle size={14} color={colors.success} />
                      )}
                      {escrowJob.status === 'refunded' && <XCircle size={14} color={colors.error} />}
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              escrowJob.status === 'released'
                                ? colors.success
                                : escrowJob.status === 'refunded'
                                ? colors.error
                                : colors.warning,
                          },
                        ]}
                      >
                        {escrowJob.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.jobDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>${escrowJob.amount.toFixed(2)}</Text>
                    </View>
                    {isInfluencer && escrowJob.status === 'released' && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>You Received:</Text>
                        <Text style={[styles.detailValue, { color: colors.success }]}>
                          ${(escrowJob.amount * 0.9).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        <Clock size={12} color={colors.textSecondary} /> Locked:
                      </Text>
                      <Text style={styles.detailValue}>
                        {new Date(escrowJob.lockedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {escrowJob.releasedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          <CheckCircle size={12} color={colors.success} /> Released:
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.success }]}>
                          {new Date(escrowJob.releasedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {escrowJob.status === 'locked' && (
                    <View style={styles.jobFooter}>
                      <View style={styles.pendingIndicator}>
                        <Clock size={16} color={colors.warning} />
                        <Text style={styles.pendingText}>
                          {isInfluencer
                            ? 'Waiting for sponsor to release payment'
                            : 'Tap to manage this deal'}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  jobsList: {
    padding: 16,
    gap: 16,
  },
  jobCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  jobInfo: {
    flex: 1,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  jobDetails: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  jobFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
});
