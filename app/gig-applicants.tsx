import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Users, TrendingUp, DollarSign, MapPin } from 'lucide-react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usePayment } from '@/contexts/PaymentContext';
import Colors from '@/constants/colors';

export default function GigApplicantsScreen() {
  const insets = useSafeAreaInsets();
  const { gigId } = useLocalSearchParams<{ gigId: string }>();
  const { user } = useAuth();
  const { gigs, applications, updateApplication, addNotification, addMessage, conversations, addConversation } = useData();
  const { getEscrowJobByApplication } = usePayment();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const gig = gigs.find(g => g.id === gigId);
  const gigApplications = applications.filter(a => a.gigId === gigId);

  const filteredApplications = filter === 'all' 
    ? gigApplications 
    : gigApplications.filter(a => a.status === filter);

  const handleApprove = async (applicationId: string) => {
    const application = applications.find(a => a.id === applicationId);
    if (!application || !user || !gig) return;

    Alert.alert(
      'Approve Application',
      `Approve ${application.influencerName} for this gig? You'll need to lock funds in escrow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await updateApplication(applicationId, {
              status: 'approved',
              reviewedAt: new Date().toISOString(),
            });

            await addNotification({
              id: Date.now().toString(),
              userId: application.influencerId,
              type: 'approval',
              priority: 'high',
              title: 'Application Approved!',
              message: `Your application for "${gig.title}" has been approved! The sponsor will lock funds in escrow soon.`,
              read: false,
              createdAt: new Date().toISOString(),
              relatedId: gigId,
            });

            const existingConv = conversations.find(c => 
              c.participants.includes(user.id) && c.participants.includes(application.influencerId)
            );

            if (!existingConv) {
              const newConv = {
                id: Date.now().toString(),
                participants: [user.id, application.influencerId],
                participantNames: [user.name, application.influencerName],
                participantAvatars: [user.avatar, application.influencerAvatar],
                unreadCount: 0,
              };
              await addConversation(newConv);

              await addMessage({
                id: (Date.now() + 1).toString(),
                conversationId: newConv.id,
                senderId: user.id,
                senderName: user.name,
                senderAvatar: user.avatar,
                content: `Hi! I've approved your application for "${gig.title}". Let's discuss the details!`,
                timestamp: new Date().toISOString(),
                read: false,
              });
            }

            router.push(`/deal-payment?applicationId=${applicationId}`);
            console.log('Email sent to:', application.influencerProfile.email);
            console.log('Push notification sent to:', application.influencerId);
          },
        },
      ]
    );
  };

  const handleReject = async (applicationId: string) => {
    const application = applications.find(a => a.id === applicationId);
    if (!application) return;

    Alert.alert(
      'Reject Application',
      `Reject ${application.influencerName}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            await updateApplication(applicationId, {
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
            });

            await addNotification({
              id: Date.now().toString(),
              userId: application.influencerId,
              type: 'rejection',
              priority: 'medium',
              title: 'Application Update',
              message: `Your application for "${gig?.title}" was not selected this time.`,
              read: false,
              createdAt: new Date().toISOString(),
              relatedId: gigId,
            });

            console.log('Email sent to:', application.influencerProfile.email);
          },
        },
      ]
    );
  };

  const renderApplication = (application: typeof applications[0]) => {
    const profile = application.influencerProfile;

    return (
      <View key={application.id} style={styles.applicationCard}>
        <LinearGradient
          colors={[Colors.darkCard, Colors.backgroundSecondary]}
          style={styles.applicationGradient}
        >
          <View style={styles.applicationHeader}>
            <TouchableOpacity onPress={() => router.push(`/view-profile?userId=${application.influencerId}`)}>
              <Image
                source={{ uri: application.influencerAvatar || 'https://i.pravatar.cc/150' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.applicationInfo}>
              <TouchableOpacity onPress={() => router.push(`/view-profile?userId=${application.influencerId}`)}>
                <Text style={styles.influencerName}>{application.influencerName}</Text>
              </TouchableOpacity>
              <Text style={styles.influencerType}>{profile.influencerType}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: application.status === 'approved' ? Colors.success + '20' : 
                              application.status === 'rejected' ? Colors.danger + '20' : 
                              Colors.warning + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: application.status === 'approved' ? Colors.success : 
                       application.status === 'rejected' ? Colors.danger : 
                       Colors.warning 
              }]}>
                {application.status}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Users size={16} color={Colors.primary} />
              <Text style={styles.statText}>{(profile.followers / 1000).toFixed(0)}K</Text>
            </View>
            <View style={styles.stat}>
              <TrendingUp size={16} color={Colors.success} />
              <Text style={styles.statText}>{profile.engagementRate}%</Text>
            </View>
            <View style={styles.stat}>
              <DollarSign size={16} color={Colors.warning} />
              <Text style={styles.statText}>${profile.ratePerPost.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.categories}>
            {profile.categories.slice(0, 3).map((cat) => (
              <View key={cat} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>

          {application.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Message:</Text>
              <Text style={styles.messageText}>{application.message}</Text>
            </View>
          )}

          <View style={styles.applicationFooter}>
            <Text style={styles.appliedDate}>
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </Text>
            {application.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleReject(application.id)}
                  style={styles.rejectButton}
                >
                  <X size={20} color={Colors.danger} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleApprove(application.id)}
                  style={styles.approveButton}
                >
                  <LinearGradient
                    colors={[Colors.success, Colors.primary]}
                    style={styles.approveButtonGradient}
                  >
                    <Check size={20} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            {application.status === 'approved' && !getEscrowJobByApplication(application.id) && (
              <TouchableOpacity
                onPress={() => router.push(`/deal-payment?applicationId=${application.id}`)}
                style={styles.paymentButton}
              >
                <DollarSign size={18} color={Colors.warning} />
                <Text style={styles.paymentButtonText}>Lock Funds in Escrow</Text>
              </TouchableOpacity>
            )}
            {application.status === 'approved' && getEscrowJobByApplication(application.id) && (
              <TouchableOpacity
                onPress={() => router.push('/deal-management')}
                style={styles.viewDealButton}
              >
                <Text style={styles.viewDealButtonText}>View Deal</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (!gig) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Applicants', headerShown: true }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Gig not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: gig.title, headerShown: true }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applicants</Text>
        <Text style={styles.headerSubtitle}>
          {gigApplications.length} total applications
        </Text>
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
            <Users size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'Influencers will see your gig and can apply'
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
    fontSize: 28,
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
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  applicationInfo: {
    flex: 1,
    gap: 4,
  },
  influencerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  influencerType: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  messageContainer: {
    backgroundColor: Colors.dark + '80',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.danger + '20',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  approveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  approveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.warning + '20',
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  viewDealButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  viewDealButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
