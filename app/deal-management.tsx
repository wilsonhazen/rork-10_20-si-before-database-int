import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useCampaigns } from '@/contexts/CampaignContext';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function DealManagementScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { applications, gigs, addNotification } = useData();
  const { escrowJobs, releaseFunds, refundEscrow } = usePayment();
  const { getCampaignsByDeal } = useCampaigns();
  const [filter, setFilter] = useState<'all' | 'locked' | 'released' | 'refunded'>('all');

  if (!user || user.role !== 'sponsor') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Sponsor role required.</Text>
      </View>
    );
  }

  const myEscrowJobs = escrowJobs.filter(e => e.sponsorId === user.id);
  const filteredJobs = filter === 'all' 
    ? myEscrowJobs 
    : myEscrowJobs.filter(e => e.status === filter);

  const handleReleaseFunds = async (escrowJobId: string) => {
    const escrowJob = escrowJobs.find(e => e.id === escrowJobId);
    if (!escrowJob) return;

    const application = applications.find(a => a.id === escrowJob.applicationId);
    const gig = gigs.find(g => g.id === escrowJob.gigId);
    const netAmount = escrowJob.amount * 0.9;

    Alert.alert(
      'Release Funds',
      `Release ${escrowJob.amount.toFixed(2)} to ${application?.influencerName}?\n\nInfluencer receives: ${netAmount.toFixed(2)}\nPlatform fee (10%): ${(escrowJob.amount * 0.1).toFixed(2)}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Payment',
          onPress: async () => {
            try {
              console.log('[Deal Management] Releasing funds...');
              await releaseFunds(
                escrowJobId,
                (agentId, commission) => {
                  console.log(`[Commission] ${commission} routed to agent ${agentId}`);
                },
                async (notification) => {
                  await addNotification(notification);
                }
              );

              console.log('[Deal Management] Funds released successfully');
              Alert.alert(
                'Payment Released! 🎉',
                `${netAmount.toFixed(2)} has been successfully transferred to ${application?.influencerName}. The deal is now complete!`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[Deal Management] Failed to release funds:', error);
              Alert.alert(
                'Release Failed',
                error instanceof Error ? error.message : 'Failed to release funds. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleRefund = async (escrowJobId: string) => {
    const escrowJob = escrowJobs.find(e => e.id === escrowJobId);
    if (!escrowJob) return;

    const application = applications.find(a => a.id === escrowJob.applicationId);
    const gig = gigs.find(g => g.id === escrowJob.gigId);

    Alert.alert(
      'Refund Escrow',
      `Refund ${escrowJob.amount.toFixed(2)} back to your account?\n\nThe deal with ${application?.influencerName} for "${gig?.title}" will be cancelled.\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Deal Management] Processing refund...');
              await refundEscrow(escrowJobId, async (notification) => {
                await addNotification(notification);
              });

              console.log('[Deal Management] Refund processed successfully');
              Alert.alert(
                'Refund Processed',
                `${escrowJob.amount.toFixed(2)} has been refunded to your account. The deal has been cancelled.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[Deal Management] Failed to process refund:', error);
              Alert.alert(
                'Refund Failed',
                error instanceof Error ? error.message : 'Failed to process refund. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Deal Management',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />

      <View style={styles.filterContainer}>
        {(['all', 'locked', 'released', 'refunded'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No deals found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' 
                ? 'Approve applications to create deals' 
                : `No ${filter} deals`}
            </Text>
          </View>
        ) : (
          <View style={styles.dealsList}>
            {filteredJobs.map((escrowJob) => {
              const application = applications.find(a => a.id === escrowJob.applicationId);
              const gig = gigs.find(g => g.id === escrowJob.gigId);
              const campaigns = getCampaignsByDeal(escrowJob.id);
              
              return (
                <View key={escrowJob.id} style={styles.dealCard}>
                  <View style={styles.dealHeader}>
                    <Image
                      source={{ uri: application?.influencerAvatar || 'https://i.pravatar.cc/150' }}
                      style={styles.avatar}
                    />
                    <View style={styles.dealInfo}>
                      <Text style={styles.gigTitle}>{gig?.title || 'Unknown Gig'}</Text>
                      <Text style={styles.influencerName}>{application?.influencerName || 'Unknown'}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: 
                          escrowJob.status === 'released' ? colors.success + '20' :
                          escrowJob.status === 'refunded' ? colors.error + '20' :
                          colors.warning + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color: 
                            escrowJob.status === 'released' ? colors.success :
                            escrowJob.status === 'refunded' ? colors.error :
                            colors.warning
                        }
                      ]}>
                        {escrowJob.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dealDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>${escrowJob.amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Platform Fee (10%):</Text>
                      <Text style={styles.detailValue}>-${(escrowJob.amount * 0.1).toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Influencer Receives:</Text>
                      <Text style={[styles.detailValue, styles.detailValueHighlight]}>
                        ${(escrowJob.amount * 0.9).toFixed(2)}
                      </Text>
                    </View>
                    {(escrowJob.sponsorAgentId || escrowJob.influencerAgentId) && (
                      <View style={styles.agentInfo}>
                        <Text style={styles.agentText}>
                          Agent commission will be routed automatically
                        </Text>
                      </View>
                    )}
                  </View>

                  {campaigns.length > 0 && (
                    <View style={styles.campaignSection}>
                      <TouchableOpacity
                        style={styles.campaignButton}
                        onPress={() => router.push('/campaigns')}
                      >
                        <Text style={styles.campaignButtonText}>📊 View Campaign</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.dealFooter}>
                    <Text style={styles.dateText}>
                      Locked: {new Date(escrowJob.lockedAt).toLocaleDateString()}
                    </Text>
                    {escrowJob.status === 'locked' && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={styles.refundButton}
                          onPress={() => handleRefund(escrowJob.id)}
                        >
                          <XCircle size={18} color={colors.error} />
                          <Text style={styles.refundButtonText}>Refund</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.releaseButton}
                          onPress={() => handleReleaseFunds(escrowJob.id)}
                        >
                          <CheckCircle size={18} color="#FFF" />
                          <Text style={styles.releaseButtonText}>Release</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {escrowJob.status === 'released' && escrowJob.releasedAt && (
                      <Text style={styles.releasedText}>
                        Released: {new Date(escrowJob.releasedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
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
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
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
  scrollView: {
    flex: 1,
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
  dealsList: {
    padding: 16,
    gap: 16,
  },
  dealCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  dealInfo: {
    flex: 1,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  influencerName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  dealDetails: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  detailValueHighlight: {
    color: colors.success,
    fontSize: 16,
  },
  agentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  agentText: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic' as const,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  releasedText: {
    fontSize: 12,
    color: colors.success,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.error + '20',
  },
  refundButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.error,
  },
  releaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  releaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  campaignSection: {
    marginBottom: 12,
  },
  campaignButton: {
    backgroundColor: colors.primary + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  campaignButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
