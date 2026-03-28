import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { CheckCircle2, Circle, Calendar, Plus, FileText, TrendingUp, Clock, DollarSign, X, Image, Video } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaigns } from '@/contexts/CampaignContext';
import Colors from '@/constants/colors';
import { useState } from 'react';
import type { ContentCalendarItem, ContentDraft, Campaign } from '@/types';

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { campaigns, updateMilestone, addCalendarItem, addDraft, updateDraft, updateCalendarItem } = useCampaigns();
  
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'calendar' | 'drafts' | 'performance'>('overview');
  const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);
  const [showAddDraftModal, setShowAddDraftModal] = useState(false);
  const [calendarForm, setCalendarForm] = useState({ title: '', description: '', platform: 'instagram', scheduledDate: '', notes: '' });
  const [draftForm, setDraftForm] = useState({ title: '', description: '', platform: 'instagram', contentType: 'image' as const, caption: '' });
  
  const userCampaigns = user ? campaigns.filter(c => 
    c.sponsorId === user.id || c.influencerId === user.id
  ) : [];

  const handleToggleMilestone = async (campaignId: string, milestoneId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateMilestone(campaignId, milestoneId, { status: newStatus });
  };

  const handleAddCalendarItem = async () => {
    if (!selectedCampaign || !calendarForm.title || !calendarForm.scheduledDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newItem: ContentCalendarItem = {
      id: Date.now().toString(),
      title: calendarForm.title,
      description: calendarForm.description,
      platform: calendarForm.platform,
      scheduledDate: calendarForm.scheduledDate,
      status: 'scheduled',
      notes: calendarForm.notes,
    };

    await addCalendarItem(selectedCampaign.id, newItem);
    setShowAddCalendarModal(false);
    setCalendarForm({ title: '', description: '', platform: 'instagram', scheduledDate: '', notes: '' });
  };

  const handleAddDraft = async () => {
    if (!selectedCampaign || !draftForm.title) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newDraft: ContentDraft = {
      id: Date.now().toString(),
      title: draftForm.title,
      description: draftForm.description,
      platform: draftForm.platform,
      contentType: draftForm.contentType,
      mediaUrls: [],
      caption: draftForm.caption,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    await addDraft(selectedCampaign.id, newDraft);
    setShowAddDraftModal(false);
    setDraftForm({ title: '', description: '', platform: 'instagram', contentType: 'image', caption: '' });
  };

  const handleDraftAction = async (draftId: string, action: 'submit' | 'approve' | 'reject') => {
    if (!selectedCampaign) return;

    const statusMap = {
      submit: 'submitted',
      approve: 'approved',
      reject: 'rejected',
    };

    await updateDraft(selectedCampaign.id, draftId, {
      status: statusMap[action] as any,
      ...(action !== 'submit' ? { reviewedAt: new Date().toISOString() } : { submittedAt: new Date().toISOString() }),
    });
  };

  const handleCalendarAction = async (itemId: string, action: 'post' | 'cancel') => {
    if (!selectedCampaign) return;

    await updateCalendarItem(selectedCampaign.id, itemId, {
      status: action === 'post' ? 'posted' : 'cancelled',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'completed': return Colors.primary;
      case 'draft': return Colors.textMuted;
      case 'cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const calculateProgress = (campaign: Campaign) => {
    const completed = campaign.milestones.filter(m => m.status === 'completed').length;
    return campaign.milestones.length > 0 ? (completed / campaign.milestones.length) * 100 : 0;
  };

  if (selectedCampaign) {
    const progress = calculateProgress(selectedCampaign);
    const totalBudget = selectedCampaign.milestones.reduce((sum, m) => sum + m.amount, 0);
    const paidAmount = selectedCampaign.milestones.filter(m => m.status === 'completed' || m.status === 'paid').reduce((sum, m) => sum + m.amount, 0);

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: selectedCampaign.title, headerBackTitle: 'Campaigns' }} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedCampaign(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(selectedCampaign.status) }]}>{selectedCampaign.status}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {['overview', 'milestones', 'calendar', 'drafts', 'performance'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'overview' && (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <TrendingUp size={24} color={Colors.primary} />
                  <Text style={styles.statValue}>{Math.round(progress)}%</Text>
                  <Text style={styles.statLabel}>Progress</Text>
                </View>
                <View style={styles.statCard}>
                  <DollarSign size={24} color={Colors.success} />
                  <Text style={styles.statValue}>${paidAmount}</Text>
                  <Text style={styles.statLabel}>Paid / ${totalBudget}</Text>
                </View>
                <View style={styles.statCard}>
                  <Calendar size={24} color={Colors.accent} />
                  <Text style={styles.statValue}>{selectedCampaign.contentCalendar.length}</Text>
                  <Text style={styles.statLabel}>Scheduled</Text>
                </View>
                <View style={styles.statCard}>
                  <FileText size={24} color={Colors.warning} />
                  <Text style={styles.statValue}>{selectedCampaign.drafts.length}</Text>
                  <Text style={styles.statLabel}>Drafts</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{selectedCampaign.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <View style={styles.timelineRow}>
                  <Clock size={16} color={Colors.textSecondary} />
                  <Text style={styles.timelineText}>
                    {new Date(selectedCampaign.startDate).toLocaleDateString()}
                    {selectedCampaign.endDate && ` - ${new Date(selectedCampaign.endDate).toLocaleDateString()}`}
                  </Text>
                </View>
              </View>
            </>
          )}

          {activeTab === 'milestones' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Campaign Milestones</Text>
              {selectedCampaign.milestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <TouchableOpacity onPress={() => handleToggleMilestone(selectedCampaign.id, milestone.id, milestone.status)}>
                      {milestone.status === 'completed' || milestone.status === 'paid' ? (
                        <CheckCircle2 size={24} color={Colors.success} />
                      ) : (
                        <Circle size={24} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                    </View>
                  </View>
                  <View style={styles.milestoneFooter}>
                    <Text style={styles.milestoneAmount}>${milestone.amount}</Text>
                    <View style={[styles.milestoneBadge, { backgroundColor: getStatusColor(milestone.status) + '20' }]}>
                      <Text style={[styles.milestoneBadgeText, { color: getStatusColor(milestone.status) }]}>
                        {milestone.status}
                      </Text>
                    </View>
                  </View>
                  {milestone.dueDate && (
                    <Text style={styles.dueDate}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'calendar' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Content Calendar</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddCalendarModal(true)}>
                  <Plus size={20} color={Colors.text} />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {selectedCampaign.contentCalendar.map((item) => (
                <View key={item.id} style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>{item.title}</Text>
                    <View style={[styles.calendarBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.calendarBadgeText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.calendarDescription}>{item.description}</Text>
                  <View style={styles.calendarMeta}>
                    <Text style={styles.calendarPlatform}>{item.platform}</Text>
                    <Text style={styles.calendarDate}>{new Date(item.scheduledDate).toLocaleDateString()}</Text>
                  </View>
                  {item.status === 'scheduled' && (
                    <View style={styles.calendarActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleCalendarAction(item.id, 'post')}>
                        <Text style={styles.actionButtonText}>Mark Posted</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => handleCalendarAction(item.id, 'cancel')}>
                        <Text style={styles.actionButtonSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              {selectedCampaign.contentCalendar.length === 0 && (
                <Text style={styles.emptyText}>No content scheduled yet</Text>
              )}
            </View>
          )}

          {activeTab === 'drafts' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Content Drafts</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddDraftModal(true)}>
                  <Plus size={20} color={Colors.text} />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {selectedCampaign.drafts.map((draft) => (
                <View key={draft.id} style={styles.draftCard}>
                  <View style={styles.draftHeader}>
                    {draft.contentType === 'video' ? (
                      <Video size={20} color={Colors.primary} />
                    ) : (
                      <Image size={20} color={Colors.primary} />
                    )}
                    <Text style={styles.draftTitle}>{draft.title}</Text>
                    <View style={[styles.draftBadge, { backgroundColor: getStatusColor(draft.status) + '20' }]}>
                      <Text style={[styles.draftBadgeText, { color: getStatusColor(draft.status) }]}>
                        {draft.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.draftDescription}>{draft.description}</Text>
                  {draft.caption && (
                    <Text style={styles.draftCaption}>&ldquo;{draft.caption}&rdquo;</Text>
                  )}
                  <View style={styles.draftMeta}>
                    <Text style={styles.draftPlatform}>{draft.platform}</Text>
                    <Text style={styles.draftType}>{draft.contentType}</Text>
                  </View>
                  {draft.status === 'draft' && user?.role === 'influencer' && (
                    <TouchableOpacity style={styles.submitButton} onPress={() => handleDraftAction(draft.id, 'submit')}>
                      <Text style={styles.submitButtonText}>Submit for Review</Text>
                    </TouchableOpacity>
                  )}
                  {draft.status === 'submitted' && user?.role === 'sponsor' && (
                    <View style={styles.draftActions}>
                      <TouchableOpacity style={styles.approveButton} onPress={() => handleDraftAction(draft.id, 'approve')}>
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => handleDraftAction(draft.id, 'reject')}>
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              {selectedCampaign.drafts.length === 0 && (
                <Text style={styles.emptyText}>No drafts created yet</Text>
              )}
            </View>
          )}

          {activeTab === 'performance' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              {selectedCampaign.performanceTracking.length > 0 ? (
                selectedCampaign.performanceTracking.map((metric) => (
                  <View key={metric.id} style={styles.metricCard}>
                    <Text style={styles.metricDate}>{new Date(metric.date).toLocaleDateString()}</Text>
                    <View style={styles.metricGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{metric.views}</Text>
                        <Text style={styles.metricLabel}>Views</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{metric.likes}</Text>
                        <Text style={styles.metricLabel}>Likes</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{metric.comments}</Text>
                        <Text style={styles.metricLabel}>Comments</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{metric.shares}</Text>
                        <Text style={styles.metricLabel}>Shares</Text>
                      </View>
                    </View>
                    <Text style={styles.engagementRate}>
                      Engagement Rate: {(metric.engagementRate * 100).toFixed(2)}%
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No performance data yet</Text>
              )}
            </View>
          )}
        </ScrollView>

        <Modal visible={showAddCalendarModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Calendar Item</Text>
                <TouchableOpacity onPress={() => setShowAddCalendarModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={calendarForm.title}
                  onChangeText={(text) => setCalendarForm({ ...calendarForm, title: text })}
                  placeholder="e.g., Instagram Post"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={calendarForm.description}
                  onChangeText={(text) => setCalendarForm({ ...calendarForm, description: text })}
                  placeholder="Post details..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <Text style={styles.inputLabel}>Platform</Text>
                <TextInput
                  style={styles.input}
                  value={calendarForm.platform}
                  onChangeText={(text) => setCalendarForm({ ...calendarForm, platform: text })}
                  placeholder="e.g., instagram, tiktok"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Scheduled Date *</Text>
                <TextInput
                  style={styles.input}
                  value={calendarForm.scheduledDate}
                  onChangeText={(text) => setCalendarForm({ ...calendarForm, scheduledDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={calendarForm.notes}
                  onChangeText={(text) => setCalendarForm({ ...calendarForm, notes: text })}
                  placeholder="Additional notes..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleAddCalendarItem}>
                  <Text style={styles.modalButtonText}>Add to Calendar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showAddDraftModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Draft</Text>
                <TouchableOpacity onPress={() => setShowAddDraftModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={draftForm.title}
                  onChangeText={(text) => setDraftForm({ ...draftForm, title: text })}
                  placeholder="Content title"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={draftForm.description}
                  onChangeText={(text) => setDraftForm({ ...draftForm, description: text })}
                  placeholder="Content description..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <Text style={styles.inputLabel}>Platform</Text>
                <TextInput
                  style={styles.input}
                  value={draftForm.platform}
                  onChangeText={(text) => setDraftForm({ ...draftForm, platform: text })}
                  placeholder="e.g., instagram, tiktok"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputLabel}>Caption</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={draftForm.caption}
                  onChangeText={(text) => setDraftForm({ ...draftForm, caption: text })}
                  placeholder="Post caption..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleAddDraft}>
                  <Text style={styles.modalButtonText}>Create Draft</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Campaigns' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {userCampaigns.length === 0 ? (
          <Text style={styles.emptyText}>No campaigns yet</Text>
        ) : (
          userCampaigns.map((campaign) => {
            const progress = calculateProgress(campaign);
            return (
              <TouchableOpacity key={campaign.id} onPress={() => setSelectedCampaign(campaign)}>
                <View style={styles.campaignCard}>
                  <LinearGradient colors={[Colors.darkCard, Colors.backgroundSecondary]} style={styles.cardGradient}>
                    <Text style={styles.campaignTitle}>{campaign.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>{campaign.status}</Text>
                    </View>
                    
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                    </View>
                    
                    <View style={styles.campaignStats}>
                      <View style={styles.statRow}>
                        <CheckCircle2 size={16} color={Colors.success} />
                        <Text style={styles.statText}>
                          {campaign.milestones.filter(m => m.status === 'completed').length}/{campaign.milestones.length} Milestones
                        </Text>
                      </View>
                      <View style={styles.statRow}>
                        <Calendar size={16} color={Colors.accent} />
                        <Text style={styles.statText}>
                          {campaign.contentCalendar.length} Scheduled
                        </Text>
                      </View>
                      <View style={styles.statRow}>
                        <FileText size={16} color={Colors.warning} />
                        <Text style={styles.statText}>
                          {campaign.drafts.length} Drafts
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' as const, marginTop: 40 },
  campaignCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  cardGradient: { padding: 16 },
  campaignTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16 },
  statusText: { fontSize: 12, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  progressSection: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  progressValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.primary },
  progressBar: { height: 8, backgroundColor: Colors.backgroundSecondary, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  campaignStats: { gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontSize: 13, color: Colors.textSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  backButton: { padding: 8 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' as const },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: Colors.backgroundSecondary },
  tab: { paddingHorizontal: 20, paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  activeTabText: { color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.darkCard, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' as const },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineText: { fontSize: 14, color: Colors.textSecondary },
  milestoneCard: { backgroundColor: Colors.darkCard, padding: 16, borderRadius: 12, marginBottom: 12 },
  milestoneHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
  milestoneDescription: { fontSize: 13, color: Colors.textSecondary },
  milestoneFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneAmount: { fontSize: 16, fontWeight: '700' as const, color: Colors.success },
  milestoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  milestoneBadgeText: { fontSize: 12, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  dueDate: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  calendarCard: { backgroundColor: Colors.darkCard, padding: 16, borderRadius: 12, marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calendarTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, flex: 1 },
  calendarBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  calendarBadgeText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  calendarDescription: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  calendarMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  calendarPlatform: { fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' as const },
  calendarDate: { fontSize: 12, color: Colors.textMuted },
  calendarActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  actionButtonSecondary: { flex: 1, backgroundColor: Colors.backgroundSecondary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionButtonSecondaryText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  draftCard: { backgroundColor: Colors.darkCard, padding: 16, borderRadius: 12, marginBottom: 12 },
  draftHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  draftTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, flex: 1 },
  draftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  draftBadgeText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  draftDescription: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  draftCaption: { fontSize: 13, color: Colors.text, fontStyle: 'italic' as const, marginBottom: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.primary },
  draftMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  draftPlatform: { fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' as const },
  draftType: { fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' as const },
  submitButton: { backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  draftActions: { flexDirection: 'row', gap: 8 },
  approveButton: { flex: 1, backgroundColor: Colors.success, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveButtonText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  rejectButton: { flex: 1, backgroundColor: Colors.error, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  rejectButtonText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  metricCard: { backgroundColor: Colors.darkCard, padding: 16, borderRadius: 12, marginBottom: 12 },
  metricDate: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 12 },
  metricGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  metricLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  engagementRate: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary, textAlign: 'center' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.backgroundSecondary },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, marginBottom: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' as const },
  modalButton: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalButtonText: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
});
