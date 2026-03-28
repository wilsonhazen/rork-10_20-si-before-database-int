import { useState } from 'react';
import { useReport } from '@/contexts/ReportContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Calendar, DollarSign, CheckCircle, Users, TrendingUp, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { mockGigs } from '@/mocks/seed-data';
import Colors from '@/constants/colors';
import type { GigApplication, InfluencerProfile } from '@/types';

export default function GigDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { gigs, applications, addApplication, addNotification } = useData();
  const { submitReport } = useReport();
  const [isApplying, setIsApplying] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const allGigs = [...mockGigs, ...gigs];
  const gig = allGigs.find(g => g.id === id);

  if (!gig) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen 
          options={{ 
            title: 'Gig Details',
            headerStyle: { backgroundColor: Colors.dark },
            headerTintColor: Colors.text,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Gig not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasApplied = applications.some(a => a.gigId === gig.id && a.influencerId === user?.id);
  const myApplication = applications.find(a => a.gigId === gig.id && a.influencerId === user?.id);

  const reportReasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'fraud', label: 'Fraud or Scam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'other', label: 'Other' },
  ];

  const handleSwitchRole = () => {
    Alert.alert(
      'Switch to Influencer',
      'You need to switch to your influencer role to apply for gigs.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch Role',
          onPress: () => router.push('/profile'),
        },
      ]
    );
  };

  const handleApply = async () => {
    if (!user || user.role !== 'influencer') {
      Alert.alert('Error', 'Only influencers can apply to gigs');
      return;
    }

    if (user.stripeVerificationStatus !== 'verified') {
      Alert.alert(
        'Stripe Verification Required',
        'You need to verify your Stripe account before applying for deals. This ensures you can receive payments securely.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Verify Now',
            onPress: () => router.push('/stripe-verification'),
          },
        ]
      );
      return;
    }

    if (hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this gig.');
      return;
    }

    setIsApplying(true);

    try {
      const application: GigApplication = {
        id: Date.now().toString(),
        gigId: gig.id,
        influencerId: user.id,
        influencerName: user.name,
        influencerAvatar: user.avatar,
        influencerProfile: user as InfluencerProfile,
        status: 'pending',
        appliedAt: new Date().toISOString(),
      };

      await addApplication(application);

      await addNotification({
        id: (Date.now() + 1).toString(),
        userId: gig.sponsorId,
        type: 'application',
        priority: 'medium',
        title: 'New Application',
        message: `${user.name} applied to your gig "${gig.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: gig.id,
      });

      console.log('Application submitted successfully');
      console.log('Email sent to sponsor:', gig.sponsorId);
      console.log('Push notification sent to sponsor:', gig.sponsorId);

      Alert.alert(
        'Application Sent!', 
        'Your application has been submitted successfully. The sponsor will review it and get back to you.',
        [
          {
            text: 'View My Applications',
            onPress: () => router.push('/my-applications'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
      console.error('Application error:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.danger;
      default:
        return Colors.warning;
    }
  };

  const handleReport = async () => {
    if (!user) return;

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
      user.id,
      user.name,
      'gig',
      gig.id,
      gig.title,
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Gig Details',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.sponsorInfo}
            onPress={() => router.push(`/view-profile?userId=${gig.sponsorId}`)}
          >
            <Image 
              source={{ uri: gig.sponsorAvatar || 'https://i.pravatar.cc/150' }} 
              style={styles.sponsorAvatar} 
            />
            <View style={styles.sponsorDetails}>
              <Text style={styles.sponsorLabel}>Posted by</Text>
              <Text style={styles.sponsorName}>{gig.sponsorName}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>{gig.title}</Text>

          <View style={styles.metaRow}>
            {gig.location && (
              <View style={styles.metaItem}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{gig.location}</Text>
              </View>
            )}
            {gig.deadline && (
              <View style={styles.metaItem}>
                <Calendar size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(gig.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.budgetCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.budgetGradient}
            >
              <DollarSign size={24} color="#FFFFFF" />
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetLabel}>Payment Amount</Text>
                <Text style={styles.budgetAmount}>
                  ${gig.price != null ? gig.price.toLocaleString() : '0'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{gig.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Looking For</Text>
          <View style={styles.tagsContainer}>
            {gig.influencerTypes.map((type) => (
              <View key={type} style={styles.tag}>
                <Users size={14} color={Colors.primary} />
                <Text style={styles.tagText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>

        {gig.athleteSports && gig.athleteSports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sports</Text>
            <View style={styles.tagsContainer}>
              {gig.athleteSports.map((sport) => (
                <View key={sport} style={[styles.tag, styles.sportTag]}>
                  <TrendingUp size={14} color={Colors.secondary} />
                  <Text style={[styles.tagText, styles.sportTagText]}>{sport}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.tagsContainer}>
            {gig.categories.map((cat) => (
              <View key={cat} style={[styles.tag, styles.categoryTag]}>
                <Text style={[styles.tagText, styles.categoryTagText]}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {gig.requirements.map((req, idx) => (
            <View key={idx} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliverables</Text>
          {gig.deliverables.map((del, idx) => (
            <View key={idx} style={styles.listItem}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.listText}>{del}</Text>
            </View>
          ))}
        </View>

        {hasApplied && myApplication && (
          <View style={styles.applicationStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(myApplication.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(myApplication.status) }]}>
                Application {myApplication.status}
              </Text>
            </View>
            <Text style={styles.applicationDate}>
              Applied on {new Date(myApplication.appliedAt).toLocaleDateString()}
            </Text>
            {myApplication.status === 'approved' && (
              <TouchableOpacity 
                style={styles.viewDealButton}
                onPress={() => router.push('/deal-management')}
              >
                <Text style={styles.viewDealButtonText}>View Deal</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {user && (
          <TouchableOpacity
            onPress={() => setShowReportModal(true)}
            style={styles.reportButton}
          >
            <AlertCircle size={16} color={Colors.textSecondary} />
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
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
              <Text style={styles.modalTitle}>Report Gig</Text>
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

      {user?.role === 'influencer' && !hasApplied && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleApply}
            disabled={isApplying}
            style={styles.applyButton}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.applyButtonGradient}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>
                {isApplying ? 'Applying...' : 'Apply Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {user?.role === 'agent' && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSwitchRole}
            style={styles.applyButton}
          >
            <LinearGradient
              colors={[Colors.warning, Colors.secondary]}
              style={styles.applyButtonGradient}
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>
                Switch Role to Apply
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  sponsorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sponsorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sponsorDetails: {
    flex: 1,
  },
  sponsorLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  budgetCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  budgetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  section: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  sportTag: {
    backgroundColor: Colors.secondary + '20',
  },
  sportTagText: {
    color: Colors.secondary,
  },
  categoryTag: {
    backgroundColor: Colors.warning + '20',
  },
  categoryTagText: {
    color: Colors.warning,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  applicationStatus: {
    margin: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  applicationDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  viewDealButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  viewDealButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.dark,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCard,
  },
  applyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
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
