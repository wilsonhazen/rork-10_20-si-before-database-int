import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo } from 'react';
import type { Gig, Deal, Match, Conversation, Message, Commission, Withdrawal, User, GigApplication, Notification, FeedActivity, Negotiation, SavedGig, GigComparison, BrandReputation, Campaign } from '@/types';

const GIGS_KEY = '@sourceimpact_gigs';
const DEALS_KEY = '@sourceimpact_deals';
const MATCHES_KEY = '@sourceimpact_matches';
const CONVERSATIONS_KEY = '@sourceimpact_conversations';
const MESSAGES_KEY = '@sourceimpact_messages';
const COMMISSIONS_KEY = '@sourceimpact_commissions';
const WITHDRAWALS_KEY = '@sourceimpact_withdrawals';
const USERS_KEY = '@sourceimpact_users';
const APPLICATIONS_KEY = '@sourceimpact_applications';
const NOTIFICATIONS_KEY = '@sourceimpact_notifications';
const FEED_ACTIVITIES_KEY = '@sourceimpact_feed_activities';
const NEGOTIATIONS_KEY = '@sourceimpact_negotiations';
const SAVED_GIGS_KEY = '@sourceimpact_saved_gigs';
const GIG_COMPARISONS_KEY = '@sourceimpact_gig_comparisons';
const BRAND_REPUTATIONS_KEY = '@sourceimpact_brand_reputations';
const CAMPAIGNS_KEY = '@sourceimpact_campaigns';

export const [DataProvider, useData] = createContextHook(() => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<GigApplication[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedActivities, setFeedActivities] = useState<FeedActivity[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [savedGigs, setSavedGigs] = useState<SavedGig[]>([]);
  const [gigComparisons, setGigComparisons] = useState<GigComparison[]>([]);
  const [brandReputations, setBrandReputations] = useState<BrandReputation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);



  const loadData = useCallback(async () => {
    if (!isLoading) return;
    try {
      const [gigsData, dealsData, usersData] = await Promise.all([
        AsyncStorage.getItem(GIGS_KEY),
        AsyncStorage.getItem(DEALS_KEY),
        AsyncStorage.getItem(USERS_KEY),
      ]);

      if (gigsData) setGigs(JSON.parse(gigsData));
      if (dealsData) setDeals(JSON.parse(dealsData));
      if (usersData) setUsers(JSON.parse(usersData));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const addGig = useCallback(async (gig: Gig) => {
    const updated = [...gigs, gig];
    setGigs(updated);
    await AsyncStorage.setItem(GIGS_KEY, JSON.stringify(updated));
  }, [gigs]);

  const updateGig = useCallback(async (id: string, updates: Partial<Gig>) => {
    const updated = gigs.map(g => g.id === id ? { ...g, ...updates } : g);
    setGigs(updated);
    await AsyncStorage.setItem(GIGS_KEY, JSON.stringify(updated));
  }, [gigs]);

  const addDeal = useCallback(async (deal: Deal) => {
    const updated = [...deals, deal];
    setDeals(updated);
    await AsyncStorage.setItem(DEALS_KEY, JSON.stringify(updated));
  }, [deals]);

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    const updated = deals.map(d => d.id === id ? { ...d, ...updates } : d);
    setDeals(updated);
    await AsyncStorage.setItem(DEALS_KEY, JSON.stringify(updated));
  }, [deals]);

  const addMatch = useCallback(async (match: Match) => {
    const updated = [...matches, match];
    setMatches(updated);
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(updated));
  }, [matches]);

  const addMessage = useCallback(async (message: Message) => {
    const updated = [...messages, message];
    setMessages(updated);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));

    const convIndex = conversations.findIndex(c => c.id === message.conversationId);
    if (convIndex !== -1) {
      const updatedConvs = [...conversations];
      updatedConvs[convIndex] = {
        ...updatedConvs[convIndex],
        lastMessage: message,
        unreadCount: updatedConvs[convIndex].unreadCount + 1,
      };
      setConversations(updatedConvs);
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
    }
  }, [messages, conversations]);

  const addConversation = useCallback(async (conversation: Conversation) => {
    const updated = [...conversations, conversation];
    setConversations(updated);
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }, [conversations]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    const updated = conversations.map(c => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    setConversations(updated);
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }, [conversations]);

  const addCommission = useCallback(async (commission: Commission) => {
    const updated = [...commissions, commission];
    setCommissions(updated);
    await AsyncStorage.setItem(COMMISSIONS_KEY, JSON.stringify(updated));
  }, [commissions]);

  const updateCommission = useCallback(async (id: string, updates: Partial<Commission>) => {
    const updated = commissions.map(c => c.id === id ? { ...c, ...updates } : c);
    setCommissions(updated);
    await AsyncStorage.setItem(COMMISSIONS_KEY, JSON.stringify(updated));
  }, [commissions]);

  const addWithdrawal = useCallback(async (withdrawal: Withdrawal) => {
    const updated = [...withdrawals, withdrawal];
    setWithdrawals(updated);
    await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(updated));
  }, [withdrawals]);

  const updateWithdrawal = useCallback(async (id: string, updates: Partial<Withdrawal>) => {
    const updated = withdrawals.map(w => w.id === id ? { ...w, ...updates } : w);
    setWithdrawals(updated);
    await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(updated));
  }, [withdrawals]);

  const addUser = useCallback(async (user: User) => {
    const updated = [...users, user];
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  }, [users]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  }, [users]);

  const addApplication = useCallback(async (application: GigApplication) => {
    console.log('Adding application:', application);
    setApplications(prev => {
      const updated = [...prev, application];
      AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updated));
      console.log('Application added successfully. Total applications:', updated.length);
      console.log('Application influencer ID:', application.influencerId);
      console.log('All applications:', updated.map(a => ({ id: a.id, influencerId: a.influencerId, gigId: a.gigId })));
      return updated;
    });
  }, []);

  const updateApplication = useCallback(async (id: string, updates: Partial<GigApplication>) => {
    setApplications(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addNotification = useCallback(async (notification: Notification) => {
    const updated = [...notifications, notification];
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    console.log('Notification sent:', notification.title, notification.message);
  }, [notifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }, [notifications]);

  const addFeedActivity = useCallback(async (activity: FeedActivity) => {
    const updated = [activity, ...feedActivities];
    setFeedActivities(updated);
    await AsyncStorage.setItem(FEED_ACTIVITIES_KEY, JSON.stringify(updated));
    console.log('Feed activity added:', activity.title);
  }, [feedActivities]);

  const loadMessages = useCallback(async () => {
    const data = await AsyncStorage.getItem(MESSAGES_KEY);
    if (data) setMessages(JSON.parse(data));
  }, []);

  const loadConversations = useCallback(async () => {
    const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (data) setConversations(JSON.parse(data));
  }, []);

  const loadApplications = useCallback(async () => {
    const data = await AsyncStorage.getItem(APPLICATIONS_KEY);
    if (data) setApplications(JSON.parse(data));
  }, []);

  const loadNotifications = useCallback(async () => {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (data) setNotifications(JSON.parse(data));
  }, []);

  const getUserById = useCallback((userId: string) => {
    return users.find(u => u.id === userId);
  }, [users]);

  const addNegotiation = useCallback(async (negotiation: Negotiation) => {
    const updated = [...negotiations, negotiation];
    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
  }, [negotiations]);

  const updateNegotiation = useCallback(async (id: string, updates: Partial<Negotiation>) => {
    const updated = negotiations.map(n => n.id === id ? { ...n, ...updates } : n);
    setNegotiations(updated);
    await AsyncStorage.setItem(NEGOTIATIONS_KEY, JSON.stringify(updated));
  }, [negotiations]);

  const saveGig = useCallback(async (savedGig: SavedGig) => {
    const updated = [...savedGigs, savedGig];
    setSavedGigs(updated);
    await AsyncStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(updated));
  }, [savedGigs]);

  const unsaveGig = useCallback(async (id: string) => {
    const updated = savedGigs.filter(sg => sg.id !== id);
    setSavedGigs(updated);
    await AsyncStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(updated));
  }, [savedGigs]);

  const getSavedGigsByUser = useCallback((userId: string) => {
    return savedGigs.filter(sg => sg.userId === userId);
  }, [savedGigs]);

  const addGigComparison = useCallback(async (comparison: GigComparison) => {
    const updated = [...gigComparisons, comparison];
    setGigComparisons(updated);
    await AsyncStorage.setItem(GIG_COMPARISONS_KEY, JSON.stringify(updated));
  }, [gigComparisons]);

  const removeGigComparison = useCallback(async (id: string) => {
    const updated = gigComparisons.filter(gc => gc.id !== id);
    setGigComparisons(updated);
    await AsyncStorage.setItem(GIG_COMPARISONS_KEY, JSON.stringify(updated));
  }, [gigComparisons]);

  const updateBrandReputation = useCallback(async (sponsorId: string, updates: Partial<BrandReputation>) => {
    const existing = brandReputations.find(br => br.sponsorId === sponsorId);
    let updated: BrandReputation[];
    if (existing) {
      updated = brandReputations.map(br => br.sponsorId === sponsorId ? { ...br, ...updates } : br);
    } else {
      updated = [...brandReputations, { sponsorId, ...updates } as BrandReputation];
    }
    setBrandReputations(updated);
    await AsyncStorage.setItem(BRAND_REPUTATIONS_KEY, JSON.stringify(updated));
  }, [brandReputations]);

  const getBrandReputation = useCallback((sponsorId: string) => {
    return brandReputations.find(br => br.sponsorId === sponsorId);
  }, [brandReputations]);

  const addCampaign = useCallback(async (campaign: Campaign) => {
    const updated = [...campaigns, campaign];
    setCampaigns(updated);
    await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
  }, [campaigns]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, ...updates } : c);
    setCampaigns(updated);
    await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
  }, [campaigns]);

  const loadNegotiations = useCallback(async () => {
    const data = await AsyncStorage.getItem(NEGOTIATIONS_KEY);
    if (data) setNegotiations(JSON.parse(data));
  }, []);

  const loadSavedGigs = useCallback(async () => {
    const data = await AsyncStorage.getItem(SAVED_GIGS_KEY);
    if (data) setSavedGigs(JSON.parse(data));
  }, []);

  const loadCampaigns = useCallback(async () => {
    const data = await AsyncStorage.getItem(CAMPAIGNS_KEY);
    if (data) setCampaigns(JSON.parse(data));
  }, []);

  return useMemo(() => ({
    gigs,
    deals,
    matches,
    conversations,
    messages,
    commissions,
    withdrawals,
    users,
    applications,
    notifications,
    feedActivities,
    negotiations,
    savedGigs,
    gigComparisons,
    brandReputations,
    campaigns,
    isLoading,
    addGig,
    updateGig,
    addDeal,
    updateDeal,
    addMatch,
    addMessage,
    addConversation,
    markConversationRead,
    addCommission,
    updateCommission,
    addWithdrawal,
    updateWithdrawal,
    addUser,
    updateUser,
    addApplication,
    updateApplication,
    addNotification,
    markNotificationRead,
    addFeedActivity,
    getUserById,
    addNegotiation,
    updateNegotiation,
    saveGig,
    unsaveGig,
    getSavedGigsByUser,
    addGigComparison,
    removeGigComparison,
    updateBrandReputation,
    getBrandReputation,
    addCampaign,
    updateCampaign,
    loadData,
    loadMessages,
    loadConversations,
    loadApplications,
    loadNotifications,
    loadNegotiations,
    loadSavedGigs,
    loadCampaigns,
  }), [gigs, deals, matches, conversations, messages, commissions, withdrawals, users, applications, notifications, feedActivities, negotiations, savedGigs, gigComparisons, brandReputations, campaigns, isLoading, addGig, updateGig, addDeal, updateDeal, addMatch, addMessage, addConversation, markConversationRead, addCommission, updateCommission, addWithdrawal, updateWithdrawal, addUser, updateUser, addApplication, updateApplication, addNotification, markNotificationRead, addFeedActivity, getUserById, addNegotiation, updateNegotiation, saveGig, unsaveGig, getSavedGigsByUser, addGigComparison, removeGigComparison, updateBrandReputation, getBrandReputation, addCampaign, updateCampaign, loadData, loadMessages, loadConversations, loadApplications, loadNotifications, loadNegotiations, loadSavedGigs, loadCampaigns]);
});
