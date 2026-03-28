import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X, DollarSign, MapPin, Users, Briefcase, CheckCircle } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { influencerTypesList, contentCategoriesList, athleteSportsList, INFLUENCER_TYPES } from '@/constants/influencer-types';
import type { Gig } from '@/types';

export default function ManageGigsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { gigs, addGig, applications } = useData();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    requirements: '',
    deliverables: '',
    deadline: '',
    categories: [] as string[],
    influencerTypes: [] as string[],
    athleteSports: [] as string[],
  });

  const sponsorGigs = gigs.filter(g => g.sponsorId === user?.id);

  const handleCreateGig = async () => {
    if (!user || !formData.title || !formData.description) return;

    const price = parseInt(formData.price) || 0;
    const newGig: Gig = {
      id: Date.now().toString(),
      sponsorId: user.id,
      sponsorName: user.name,
      sponsorAvatar: user.avatar,
      title: formData.title,
      description: formData.description,
      price: price,
      budget: {
        min: price,
        max: price,
      },
      categories: formData.categories,
      influencerTypes: formData.influencerTypes,
      athleteSports: formData.athleteSports,
      location: formData.location,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      deliverables: formData.deliverables.split('\n').filter(d => d.trim()),
      deadline: formData.deadline || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    await addGig(newGig);
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      price: '',
      location: '',
      requirements: '',
      deliverables: '',
      deadline: '',
      categories: [],
      influencerTypes: [],
      athleteSports: [],
    });
  };

  const getApplicationCount = (gigId: string) => {
    return applications.filter(a => a.gigId === gigId).length;
  };

  const getPendingCount = (gigId: string) => {
    return applications.filter(a => a.gigId === gigId && a.status === 'pending').length;
  };

  const renderGigCard = (gig: Gig) => {
    const appCount = getApplicationCount(gig.id);
    const pendingCount = getPendingCount(gig.id);

    return (
      <TouchableOpacity
        key={gig.id}
        activeOpacity={0.8}
        style={styles.gigCard}
        onPress={() => router.push({ pathname: '/gig-applicants', params: { gigId: gig.id } })}
      >
        <LinearGradient
          colors={[Colors.darkCard, Colors.backgroundSecondary]}
          style={styles.gigCardGradient}
        >
          <View style={styles.gigHeader}>
            <Text style={styles.gigTitle} numberOfLines={2}>
              {gig.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: gig.status === 'open' ? Colors.success + '20' : Colors.textMuted + '20' }]}>
              <Text style={[styles.statusText, { color: gig.status === 'open' ? Colors.success : Colors.textMuted }]}>
                {gig.status}
              </Text>
            </View>
          </View>

          <Text style={styles.gigDescription} numberOfLines={2}>
            {gig.description}
          </Text>

          <View style={styles.gigStats}>
            <View style={styles.gigStat}>
              <DollarSign size={16} color={Colors.warning} />
              <Text style={styles.gigStatText}>
                ${(gig.price || 0).toLocaleString()}
              </Text>
            </View>
            {gig.location && (
              <View style={styles.gigStat}>
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.gigStatText}>{gig.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.gigFooter}>
            <View style={styles.applicantStats}>
              <View style={styles.applicantStat}>
                <Users size={16} color={Colors.primary} />
                <Text style={styles.applicantStatText}>{appCount} applicants</Text>
              </View>
              {pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>{pendingCount} pending</Text>
                </View>
              )}
            </View>
            <Text style={styles.gigDate}>
              {new Date(gig.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Gigs</Text>
          <Text style={styles.headerSubtitle}>Manage your opportunities</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.createButtonGradient}
          >
            <Plus size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.gigsList}
        contentContainerStyle={styles.gigsListContent}
        showsVerticalScrollIndicator={false}
      >
        {sponsorGigs.length > 0 ? (
          sponsorGigs.map(renderGigCard)
        ) : (
          <View style={styles.emptyState}>
            <Briefcase size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No gigs yet</Text>
            <Text style={styles.emptyText}>
              Create your first gig to start finding influencers
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyButton}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.emptyButtonGradient}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Gig</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Gig</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalForm} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="e.g. Instagram Campaign for Fashion Brand"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe what you're looking for..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price (USD) *</Text>
                <Text style={styles.formHint}>Set the exact payment amount for this gig</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="2500"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="e.g. New York, NY"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deadline (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.deadline}
                  onChangeText={(text) => setFormData({ ...formData, deadline: text })}
                  placeholder="e.g. 2025-12-31"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Influencer Types</Text>
                <Text style={styles.formHint}>Select the types of influencers you want</Text>
                <View style={styles.chipContainer}>
                  {influencerTypesList.slice(0, 12).map((type) => {
                    const isSelected = formData.influencerTypes.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              influencerTypes: formData.influencerTypes.filter(t => t !== type),
                              athleteSports: type === INFLUENCER_TYPES.ATHLETE ? [] : formData.athleteSports,
                            });
                          } else {
                            setFormData({
                              ...formData,
                              influencerTypes: [...formData.influencerTypes, type],
                            });
                          }
                        }}
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                      >
                        {isSelected && <CheckCircle size={14} color={Colors.primary} />}
                        <Text style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {formData.influencerTypes.includes(INFLUENCER_TYPES.ATHLETE) && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sports</Text>
                  <Text style={styles.formHint}>Select specific sports for athlete influencers</Text>
                  <View style={styles.chipContainer}>
                    {athleteSportsList.map((sport) => {
                      const isSelected = formData.athleteSports.includes(sport);
                      return (
                        <TouchableOpacity
                          key={sport}
                          onPress={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                athleteSports: formData.athleteSports.filter(s => s !== sport),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                athleteSports: [...formData.athleteSports, sport],
                              });
                            }
                          }}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                        >
                          {isSelected && <CheckCircle size={14} color={Colors.primary} />}
                          <Text style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}>
                            {sport}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Categories</Text>
                <Text style={styles.formHint}>Select relevant content categories</Text>
                <View style={styles.chipContainer}>
                  {contentCategoriesList.slice(0, 20).map((category) => {
                    const isSelected = formData.categories.includes(category);
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              categories: formData.categories.filter(c => c !== category),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              categories: [...formData.categories, category],
                            });
                          }
                        }}
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                      >
                        {isSelected && <CheckCircle size={14} color={Colors.primary} />}
                        <Text style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Requirements (one per line)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.requirements}
                  onChangeText={(text) => setFormData({ ...formData, requirements: text })}
                  placeholder="50K+ followers&#10;High engagement rate&#10;Fashion niche"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deliverables (one per line)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.deliverables}
                  onChangeText={(text) => setFormData({ ...formData, deliverables: text })}
                  placeholder="3 Instagram posts&#10;5 Stories&#10;1 Reel"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateGig}
                style={styles.submitButton}
                disabled={!formData.title || !formData.description || !formData.price}
              >
                <LinearGradient
                  colors={formData.title && formData.description && formData.price ? [Colors.primary, Colors.secondary] : [Colors.textMuted, Colors.textMuted]}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Create Gig</Text>
                </LinearGradient>
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  createButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gigsList: {
    flex: 1,
  },
  gigsListContent: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  gigCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gigCardGradient: {
    padding: 16,
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  gigTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
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
  gigDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  gigStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  gigStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gigStatText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  applicantStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applicantStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantStatText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  gigDate: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    marginBottom: 12,
  },
  emptyButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalForm: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
