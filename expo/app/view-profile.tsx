import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { 
  User, 
  Briefcase, 
  TrendingUp,
  MapPin,
  Globe,
  CheckCircle2,
  MessageCircle,
  Building2,
  Users,
  Star,
  DollarSign,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useReport } from '@/contexts/ReportContext';
import Colors from '@/constants/colors';
import type { InfluencerProfile, SponsorProfile, AgentProfile, SocialAccount } from '@/types';

export default function ViewProfileScreen() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { users, addConversation, conversations } = useData();
  const { submitReport } = useReport();

  const viewedUser = users.find(u => u.id === userId);

  const reportReasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'fraud', label: 'Fraud or Scam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'other', label: 'Other' },
  ];

  const handleReport = async () => {
    if (!currentUser || !viewedUser) return;

    if (!reportReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (!reportDescription.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setIsSubmittingReport(true);
    const result = await submitReport(
      currentUser.id,
      currentUser.name,
      'user',
      viewedUser.id,
      viewedUser.name,
      reportReason as any,
      reportDescription.trim()
    );
    setIsSubmittingReport(false);

    if (result.success) {
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowReportModal(false);
              setReportReason('');
              setReportDescription('');
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to submit report');
    }
  };

  if (!viewedUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Profile Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSendMessage = () => {
    if (!currentUser) return;

    const existingConv = conversations.find(c => 
      c.participants.includes(currentUser.id) && c.participants.includes(userId)
    );

    if (existingConv) {
      router.push(`/conversation?conversationId=${existingConv.id}` as any);
    } else {
      const newConv = {
        id: `conv_${Date.now()}`,
        participants: [currentUser.id, userId],
        participantNames: [currentUser.name, viewedUser.name],
        participantAvatars: [currentUser.avatar, viewedUser.avatar],
        unreadCount: 0,
      };
      addConversation(newConv);
      router.push(`/conversation?conversationId=${newConv.id}` as any);
    }
  };

  const getRoleIcon = () => {
    switch (viewedUser.role) {
      case 'influencer':
        return <Users size={40} color="#FFFFFF" />;
      case 'sponsor':
        return <Briefcase size={40} color="#FFFFFF" />;
      case 'agent':
        return <TrendingUp size={40} color="#FFFFFF" />;
      default:
        return <User size={40} color="#FFFFFF" />;
    }
  };

  const getRoleGradient = (): [string, string] => {
    switch (viewedUser.role) {
      case 'influencer':
        return [Colors.primary, Colors.secondary];
      case 'sponsor':
        return [Colors.secondary, '#8B5CF6'];
      case 'agent':
        return [Colors.warning, '#F97316'];
      default:
        return [Colors.primary, Colors.secondary];
    }
  };

  const renderInfluencerProfile = () => {
    if (viewedUser.role !== 'influencer') return null;
    const influencer = viewedUser as InfluencerProfile;

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{influencer.bio || 'No bio available'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type & Categories</Text>
          <View style={styles.tagsContainer}>
            {influencer.influencerType && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{influencer.influencerType}</Text>
              </View>
            )}
            {influencer.sports && influencer.sports.map((sport, idx) => (
              <View key={idx} style={[styles.tag, styles.sportTag]}>
                <Text style={styles.tagText}>{sport}</Text>
              </View>
            ))}
            {influencer.categories.map((cat, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {influencer.socialAccounts && influencer.socialAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verified Social Accounts</Text>
            <View style={styles.socialAccountsList}>
              {influencer.socialAccounts.map((account: SocialAccount, index: number) => (
                <View key={index} style={styles.socialAccountCard}>
                  <View style={styles.socialAccountInfo}>
                    <Text style={styles.socialPlatform}>{account.platform}</Text>
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={12} color={Colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.socialFollowers}>
                    {account.followers.toLocaleString()} followers
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Star size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{(influencer.followers / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Total Followers</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp size={24} color={Colors.secondary} />
            <Text style={styles.statValue}>{influencer.engagementRate}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
          <View style={styles.statBox}>
            <DollarSign size={24} color={Colors.warning} />
            <Text style={styles.statValue}>${influencer.ratePerPost}</Text>
            <Text style={styles.statLabel}>Per Post</Text>
          </View>
        </View>

        {influencer.location && (
          <View style={styles.infoRow}>
            <MapPin size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{influencer.location}</Text>
          </View>
        )}
      </>
    );
  };

  const renderSponsorProfile = () => {
    if (viewedUser.role !== 'sponsor') return null;
    const sponsor = viewedUser as SponsorProfile;

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{sponsor.description || 'No description available'}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Building2 size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>{sponsor.company}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Briefcase size={20} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Industry</Text>
              <Text style={styles.infoValue}>{sponsor.industry}</Text>
            </View>
          </View>

          {sponsor.location && (
            <View style={styles.infoRow}>
              <MapPin size={20} color={Colors.warning} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{sponsor.location}</Text>
              </View>
            </View>
          )}

          {sponsor.website && (
            <View style={styles.infoRow}>
              <Globe size={20} color={Colors.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={[styles.infoValue, styles.linkText]}>{sponsor.website}</Text>
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderAgentProfile = () => {
    if (viewedUser.role !== 'agent') return null;
    const agent = viewedUser as AgentProfile;

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{agent.bio || 'No bio available'}</Text>
        </View>

        {agent.specialties && agent.specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagsContainer}>
              {agent.specialties.map((specialty, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <DollarSign size={24} color={Colors.success} />
            <Text style={styles.statValue}>${agent.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Users size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{agent.recruits?.length || 0}</Text>
            <Text style={styles.statLabel}>Recruits</Text>
          </View>
          <View style={styles.statBox}>
            <Award size={24} color={Colors.warning} />
            <Text style={styles.statValue}>{agent.isSubscribed ? 'Pro' : 'Free'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {agent.referralCode && (
          <View style={styles.referralCard}>
            <LinearGradient
              colors={[Colors.warning + '30', Colors.secondary + '30']}
              style={styles.referralGradient}
            >
              <Text style={styles.referralLabel}>Referral Code</Text>
              <Text style={styles.referralCode}>{agent.referralCode}</Text>
              <Text style={styles.referralSubtext}>Use this code to get 15% commission</Text>
            </LinearGradient>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: viewedUser.name,
          headerStyle: {
            backgroundColor: Colors.dark,
          },
          headerTintColor: Colors.text,
        }} 
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={getRoleGradient()}
            style={styles.avatarGradient}
          >
            {getRoleIcon()}
          </LinearGradient>

          <Text style={styles.name}>{viewedUser.name}</Text>
          <Text style={styles.email}>{viewedUser.email}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {viewedUser.role.charAt(0).toUpperCase()}{viewedUser.role.slice(1)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.joinedText}>
              Joined {new Date(viewedUser.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {renderInfluencerProfile()}
        {renderSponsorProfile()}
        {renderAgentProfile()}

        {currentUser && currentUser.id !== userId && (
          <>
            <TouchableOpacity
              onPress={() => setShowReportModal(true)}
              style={styles.reportButton}
            >
              <AlertCircle size={16} color={Colors.textSecondary} />
              <Text style={styles.reportButtonText}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSendMessage}
              style={styles.messageButton}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.messageButtonGradient}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Send Message</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report {viewedUser.name}</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Reason for reporting</Text>
              <View style={styles.reasonButtons}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonButton,
                      reportReason === reason.value && styles.reasonButtonActive,
                    ]}
                    onPress={() => setReportReason(reason.value)}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        reportReason === reason.value && styles.reasonButtonTextActive,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={styles.modalInput}
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder="Please provide details about the issue..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowReportModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSubmitButton,
                    isSubmittingReport && styles.modalSubmitButtonDisabled,
                  ]}
                  onPress={handleReport}
                  disabled={isSubmittingReport}
                >
                  <Text style={styles.modalSubmitButtonText}>
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  joinedText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sportTag: {
    backgroundColor: Colors.warning + '20',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  socialAccountsList: {
    gap: 8,
  },
  socialAccountCard: {
    backgroundColor: Colors.darkCard,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialPlatform: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  socialFollowers: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  infoCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkText: {
    color: Colors.primary,
  },
  referralCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  referralGradient: {
    padding: 20,
    alignItems: 'center',
  },
  referralLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  referralSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  messageButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  messageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalCloseText: {
    fontSize: 28,
    color: Colors.textSecondary,
    lineHeight: 28,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  reasonButtonActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  reasonButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reasonButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
