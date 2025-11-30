import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useState, useMemo } from 'react';
import { MessageSquare, DollarSign, Clock, CheckCircle2, XCircle, ChevronDown, Calendar, Package, X, Plus, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNegotiations } from '@/contexts/NegotiationContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected';

export default function NegotiationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { negotiations, addCounterOffer, acceptOffer, rejectOffer } = useNegotiations();
  const { gigs, getUserById } = useData();
  
  const [counterAmount, setCounterAmount] = useState('');
  const [counterTimeline, setCounterTimeline] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [counterDeliverables, setCounterDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [selectedNegId, setSelectedNegId] = useState<string | null>(null);
  const [detailsNegId, setDetailsNegId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const userNegotiations = useMemo(() => {
    if (!user) return [];
    
    let filtered = negotiations.filter(n => 
      (user.role === 'influencer' && n.influencerId === user.id) ||
      (user.role === 'sponsor' && n.sponsorId === user.id)
    );

    if (filter === 'pending') {
      filtered = filtered.filter(n => n.status === 'open');
    } else if (filter === 'accepted') {
      filtered = filtered.filter(n => n.status === 'accepted');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(n => n.status === 'rejected');
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [user, negotiations, filter]);

  const handleAccept = async (negId: string) => {
    await acceptOffer(negId);
    Alert.alert('Success', 'Offer accepted!');
  };

  const handleCounter = async () => {
    if (!selectedNegId || !counterAmount || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    await addCounterOffer(selectedNegId, user.id, user.role, {
      amount: parseFloat(counterAmount),
      deliverables: counterDeliverables.length > 0 ? counterDeliverables : ['Counter offer'],
      timeline: counterTimeline || '2 weeks',
      message: counterMessage,
    });
    
    setCounterAmount('');
    setCounterTimeline('');
    setCounterMessage('');
    setCounterDeliverables([]);
    setSelectedNegId(null);
    Alert.alert('Success', 'Counter offer sent!');
  };

  const handleReject = async (negId: string) => {
    Alert.alert(
      'Reject Offer',
      'Are you sure you want to reject this offer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            await rejectOffer(negId);
            Alert.alert('Rejected', 'Offer has been rejected');
          },
        },
      ]
    );
  };

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setCounterDeliverables([...counterDeliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const removeDeliverable = (index: number) => {
    setCounterDeliverables(counterDeliverables.filter((_, i) => i !== index));
  };

  const getGigInfo = (gigId: string) => {
    return gigs.find(g => g.id === gigId);
  };

  const getOtherUser = (neg: any) => {
    const otherUserId = user?.role === 'influencer' ? neg.sponsorId : neg.influencerId;
    return getUserById(otherUserId);
  };

  const isExpiringSoon = (expiresAt: string | undefined) => {
    if (!expiresAt) return false;
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 2;
  };

  const selectedNeg = negotiations.find(n => n.id === detailsNegId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Negotiations' }} />
      
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Text style={styles.filterText}>
            {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : filter === 'accepted' ? 'Accepted' : 'Rejected'}
          </Text>
          <ChevronDown size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        {showFilterMenu && (
          <View style={styles.filterMenu}>
            {(['all', 'pending', 'accepted', 'rejected'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.filterMenuItem}
                onPress={() => {
                  setFilter(f);
                  setShowFilterMenu(false);
                }}
              >
                <Text style={[styles.filterMenuText, filter === f && styles.filterMenuTextActive]}>
                  {f === 'all' ? 'All Negotiations' : f === 'pending' ? 'Pending' : f === 'accepted' ? 'Accepted' : 'Rejected'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Negotiations ({userNegotiations.length})</Text>
        </View>
        
        {userNegotiations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Negotiations Yet</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Start negotiating on deals to see them here'
                : `No ${filter} negotiations found`}
            </Text>
            {user?.role === 'sponsor' && filter === 'all' && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/discover')}
              >
                <Text style={styles.emptyButtonText}>Browse Influencers</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          userNegotiations.map((neg) => {
            const lastOffer = neg.offers[neg.offers.length - 1];
            const isYourTurn = (user?.role === 'influencer' && lastOffer.fromUserRole === 'sponsor') ||
                              (user?.role === 'sponsor' && lastOffer.fromUserRole === 'influencer');
            const gig = getGigInfo(neg.gigId);
            const otherUser = getOtherUser(neg);
            const expiringSoon = isExpiringSoon(neg.expiresAt);
            
            return (
              <TouchableOpacity 
                key={neg.id} 
                style={styles.negCard}
                onPress={() => setDetailsNegId(neg.id)}
                activeOpacity={0.7}
              >
                <LinearGradient colors={[Colors.darkCard, Colors.backgroundSecondary]} style={styles.negGradient}>
                  <View style={styles.negHeader}>
                    <View style={styles.negTitleRow}>
                      <Text style={styles.negTitle}>{gig?.title || `Gig #${neg.gigId.slice(-6)}`}</Text>
                      {otherUser && (
                        <Text style={styles.negSubtitle}>with {otherUser.name}</Text>
                      )}
                    </View>
                    <View style={[styles.badge, { 
                      backgroundColor: neg.status === 'open' 
                        ? Colors.primary + '20' 
                        : neg.status === 'accepted'
                        ? Colors.success + '20'
                        : Colors.error + '20'
                    }]}>
                      <Text style={[styles.badgeText, { 
                        color: neg.status === 'open' 
                          ? Colors.primary 
                          : neg.status === 'accepted'
                          ? Colors.success
                          : Colors.error
                      }]}>
                        {neg.status}
                      </Text>
                    </View>
                  </View>

                  {expiringSoon && neg.status === 'open' && neg.expiresAt && (
                    <View style={styles.warningBox}>
                      <Clock size={14} color={Colors.warning} />
                      <Text style={styles.warningText}>
                        Expires in {Math.ceil((new Date(neg.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </Text>
                    </View>
                  )}

                  <View style={styles.offerBox}>
                    <DollarSign size={20} color={Colors.primary} />
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerAmount}>${lastOffer.amount.toLocaleString()}</Text>
                      <Text style={styles.offerFrom}>from {lastOffer.fromUserRole}</Text>
                    </View>
                    {isYourTurn && lastOffer.status === 'pending' && (
                      <View style={styles.yourTurnBadge}>
                        <Text style={styles.yourTurnText}>Your turn</Text>
                      </View>
                    )}
                  </View>

                  {lastOffer.deliverables && lastOffer.deliverables.length > 0 && (
                    <View style={styles.deliverablesPreview}>
                      <Package size={14} color={Colors.textSecondary} />
                      <Text style={styles.deliverablesText}>
                        {lastOffer.deliverables.length} deliverable{lastOffer.deliverables.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}

                  {lastOffer.timeline && (
                    <View style={styles.timelinePreview}>
                      <Calendar size={14} color={Colors.textSecondary} />
                      <Text style={styles.timelineText}>{lastOffer.timeline}</Text>
                    </View>
                  )}

                  {lastOffer.message && (
                    <View style={styles.messageBox}>
                      <MessageSquare size={16} color={Colors.textSecondary} />
                      <Text style={styles.messageText} numberOfLines={2}>{lastOffer.message}</Text>
                    </View>
                  )}

                  {isYourTurn && lastOffer.status === 'pending' && neg.status === 'open' && (
                    <View style={styles.actions}>
                      {selectedNegId === neg.id ? (
                        <View style={styles.counterForm}>
                          <TextInput
                            style={styles.input}
                            placeholder="Amount ($)"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={counterAmount}
                            onChangeText={setCounterAmount}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Timeline (e.g., 2 weeks)"
                            placeholderTextColor={Colors.textMuted}
                            value={counterTimeline}
                            onChangeText={setCounterTimeline}
                          />
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Message (optional)"
                            placeholderTextColor={Colors.textMuted}
                            value={counterMessage}
                            onChangeText={setCounterMessage}
                            multiline
                            numberOfLines={2}
                          />
                          
                          <View style={styles.deliverablesSection}>
                            <Text style={styles.sectionLabel}>Deliverables</Text>
                            {counterDeliverables.map((d, i) => (
                              <View key={i} style={styles.deliverableItem}>
                                <Text style={styles.deliverableText}>{d}</Text>
                                <TouchableOpacity onPress={() => removeDeliverable(i)}>
                                  <Trash2 size={16} color={Colors.error} />
                                </TouchableOpacity>
                              </View>
                            ))}
                            <View style={styles.addDeliverableRow}>
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Add deliverable"
                                placeholderTextColor={Colors.textMuted}
                                value={newDeliverable}
                                onChangeText={setNewDeliverable}
                              />
                              <TouchableOpacity style={styles.addButton} onPress={addDeliverable}>
                                <Plus size={20} color={Colors.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.counterActions}>
                            <TouchableOpacity 
                              style={styles.cancelButton} 
                              onPress={() => {
                                setSelectedNegId(null);
                                setCounterAmount('');
                                setCounterTimeline('');
                                setCounterMessage('');
                                setCounterDeliverables([]);
                                setNewDeliverable('');
                              }}
                            >
                              <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sendButton} onPress={handleCounter}>
                              <Text style={styles.sendText}>Send Counter</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(neg.id)}>
                              <LinearGradient colors={[Colors.success, Colors.success + 'CC']} style={styles.buttonGradient}>
                                <CheckCircle2 size={18} color="#FFF" />
                                <Text style={styles.buttonText}>Accept</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.counterButton} onPress={() => {
                              setSelectedNegId(neg.id);
                              setCounterAmount(lastOffer.amount.toString());
                              setCounterTimeline(lastOffer.timeline || '');
                              setCounterDeliverables(lastOffer.deliverables || []);
                            }}>
                              <Text style={styles.counterText}>Counter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(neg.id)}>
                              <XCircle size={18} color={Colors.error} />
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  <View style={styles.footerRow}>
                    <Text style={styles.offersCount}>{neg.offers.length} offer{neg.offers.length > 1 ? 's' : ''}</Text>
                    <Text style={styles.viewDetails}>Tap to view details</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={!!detailsNegId}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsNegId(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailsNegId(null)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Negotiation History</Text>
              <TouchableOpacity onPress={() => setDetailsNegId(null)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedNeg && (
              <ScrollView style={styles.modalScroll}>
                {selectedNeg.offers.map((offer, index) => {
                  const isFromUser = offer.fromUserId === user?.id;
                  return (
                    <View 
                      key={offer.id} 
                      style={[
                        styles.offerHistoryItem,
                        isFromUser && styles.offerHistoryItemRight
                      ]}
                    >
                      <View style={styles.offerHistoryHeader}>
                        <Text style={styles.offerHistoryRole}>
                          {isFromUser ? 'You' : offer.fromUserRole}
                        </Text>
                        <Text style={styles.offerHistoryDate}>
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <View style={styles.offerHistoryAmount}>
                        <DollarSign size={18} color={Colors.primary} />
                        <Text style={styles.offerHistoryAmountText}>
                          ${offer.amount.toLocaleString()}
                        </Text>
                      </View>

                      {offer.timeline && (
                        <View style={styles.offerHistoryDetail}>
                          <Calendar size={14} color={Colors.textSecondary} />
                          <Text style={styles.offerHistoryDetailText}>{offer.timeline}</Text>
                        </View>
                      )}

                      {offer.deliverables && offer.deliverables.length > 0 && (
                        <View style={styles.offerHistoryDeliverables}>
                          <Package size={14} color={Colors.textSecondary} />
                          <Text style={styles.offerHistoryDetailText}>Deliverables:</Text>
                        </View>
                      )}
                      {offer.deliverables?.map((d, i) => (
                        <Text key={i} style={styles.deliverableItemText}>• {d}</Text>
                      ))}

                      {offer.message && (
                        <Text style={styles.offerHistoryMessage}>{offer.message}</Text>
                      )}

                      <View style={[
                        styles.offerStatusBadge,
                        { backgroundColor: 
                          offer.status === 'accepted' ? Colors.success + '20' :
                          offer.status === 'rejected' ? Colors.error + '20' :
                          offer.status === 'countered' ? Colors.warning + '20' :
                          Colors.primary + '20'
                        }
                      ]}>
                        <Text style={[
                          styles.offerStatusText,
                          { color:
                            offer.status === 'accepted' ? Colors.success :
                            offer.status === 'rejected' ? Colors.error :
                            offer.status === 'countered' ? Colors.warning :
                            Colors.primary
                          }
                        ]}>
                          {offer.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  filterBar: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.backgroundSecondary },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, alignSelf: 'flex-start' },
  filterText: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  filterMenu: { position: 'absolute' as const, top: 60, left: 20, backgroundColor: Colors.darkCard, borderRadius: 12, paddingVertical: 8, zIndex: 1000, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  filterMenuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  filterMenuText: { fontSize: 14, color: Colors.text },
  filterMenuTextActive: { color: Colors.primary, fontWeight: '600' as const },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' as const, marginTop: 8, paddingHorizontal: 40 },
  emptyButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: Colors.primary, borderRadius: 12 },
  emptyButtonText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
  negCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  negGradient: { padding: 16 },
  negHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  negTitleRow: { flex: 1, marginRight: 12 },
  negTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  negSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: Colors.warning + '15', borderRadius: 8, marginBottom: 12 },
  warningText: { fontSize: 12, color: Colors.warning, fontWeight: '600' as const },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  offerBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, backgroundColor: Colors.backgroundSecondary, borderRadius: 12 },
  offerInfo: { flex: 1 },
  offerAmount: { fontSize: 24, fontWeight: '700' as const, color: Colors.primary },
  offerFrom: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' as const },
  yourTurnBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yourTurnText: { fontSize: 11, fontWeight: '600' as const, color: Colors.success },
  deliverablesPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliverablesText: { fontSize: 13, color: Colors.textSecondary },
  timelinePreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  timelineText: { fontSize: 13, color: Colors.textSecondary },
  messageBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.backgroundSecondary, borderRadius: 8, marginBottom: 12 },
  messageText: { fontSize: 13, color: Colors.text, flex: 1 },
  actions: { marginTop: 4, marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  counterForm: { gap: 10 },
  input: { backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' as const },
  sectionLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  deliverablesSection: { gap: 8 },
  deliverableItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: Colors.backgroundSecondary, borderRadius: 8 },
  deliverableText: { fontSize: 13, color: Colors.text, flex: 1 },
  addDeliverableRow: { flexDirection: 'row', gap: 8 },
  addButton: { width: 50, height: 50, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  counterActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.backgroundSecondary, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  sendButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  sendText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
  acceptButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  buttonGradient: { padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '600' as const, color: '#FFFFFF' },
  counterButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  rejectButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  offersCount: { fontSize: 11, color: Colors.textMuted },
  viewDetails: { fontSize: 11, color: Colors.primary },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Colors.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.backgroundSecondary },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },
  offerHistoryItem: { backgroundColor: Colors.darkCard, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  offerHistoryItemRight: { borderLeftColor: Colors.success },
  offerHistoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  offerHistoryRole: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  offerHistoryDate: { fontSize: 11, color: Colors.textMuted },
  offerHistoryAmount: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  offerHistoryAmountText: { fontSize: 20, fontWeight: '700' as const, color: Colors.primary },
  offerHistoryDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  offerHistoryDetailText: { fontSize: 13, color: Colors.textSecondary },
  offerHistoryDeliverables: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  deliverableItemText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 20, marginBottom: 2 },
  offerHistoryMessage: { fontSize: 13, color: Colors.text, marginTop: 8, fontStyle: 'italic' as const },
  offerStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  offerStatusText: { fontSize: 11, fontWeight: '600' as const, textTransform: 'capitalize' as const },
});
