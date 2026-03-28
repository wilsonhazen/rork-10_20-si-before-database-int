import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  Campaign, 
  CampaignMilestone, 
  ContentCalendarItem, 
  ContentDraft, 
  PerformanceMetrics 
} from '@/types';

const CAMPAIGNS_KEY = '@sourceimpact_campaigns';

export const [CampaignProvider, useCampaigns] = createContextHook(() => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const stored = await AsyncStorage.getItem(CAMPAIGNS_KEY);
      if (stored) {
        setCampaigns(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCampaigns = async (updated: Campaign[]) => {
    setCampaigns(updated);
    await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
  };

  const addCampaign = useCallback(async (campaign: Campaign) => {
    const updated = [...campaigns, campaign];
    await saveCampaigns(updated);
  }, [campaigns]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    await saveCampaigns(updated);
  }, [campaigns]);

  const updateMilestone = useCallback(async (campaignId: string, milestoneId: string, updates: Partial<CampaignMilestone>) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          milestones: c.milestones.map(m => m.id === milestoneId ? { ...m, ...updates } : m),
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const addCalendarItem = useCallback(async (campaignId: string, item: ContentCalendarItem) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          contentCalendar: [...c.contentCalendar, item],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const updateCalendarItem = useCallback(async (campaignId: string, itemId: string, updates: Partial<ContentCalendarItem>) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          contentCalendar: c.contentCalendar.map(item => item.id === itemId ? { ...item, ...updates } : item),
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const addDraft = useCallback(async (campaignId: string, draft: ContentDraft) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          drafts: [...c.drafts, draft],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const updateDraft = useCallback(async (campaignId: string, draftId: string, updates: Partial<ContentDraft>) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          drafts: c.drafts.map(d => d.id === draftId ? { ...d, ...updates } : d),
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const addPerformanceMetrics = useCallback(async (campaignId: string, metrics: PerformanceMetrics) => {
    const updated = campaigns.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          performanceTracking: [...c.performanceTracking, metrics],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    await saveCampaigns(updated);
  }, [campaigns]);

  const getCampaignsByDeal = useCallback((dealId: string) => {
    return campaigns.filter(c => c.dealId === dealId);
  }, [campaigns]);

  const getCampaignsByUser = useCallback((userId: string, role: 'sponsor' | 'influencer') => {
    if (role === 'sponsor') {
      return campaigns.filter(c => c.sponsorId === userId);
    }
    return campaigns.filter(c => c.influencerId === userId);
  }, [campaigns]);

  const createCampaignFromDeal = useCallback(async (
    dealId: string,
    gigId: string,
    sponsorId: string,
    influencerId: string,
    title: string,
    description: string,
    amount: number
  ) => {
    const campaign: Campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      dealId,
      title,
      description,
      sponsorId,
      influencerId,
      status: 'active',
      milestones: [
        {
          id: `milestone_${Date.now()}_1`,
          title: 'Project Kickoff',
          description: 'Initial briefing and content planning',
          percentage: 20,
          amount: amount * 0.2,
          status: 'pending',
        },
        {
          id: `milestone_${Date.now()}_2`,
          title: 'Content Creation',
          description: 'Draft and submit content for review',
          percentage: 40,
          amount: amount * 0.4,
          status: 'pending',
        },
        {
          id: `milestone_${Date.now()}_3`,
          title: 'Content Publication',
          description: 'Publish approved content',
          percentage: 30,
          amount: amount * 0.3,
          status: 'pending',
        },
        {
          id: `milestone_${Date.now()}_4`,
          title: 'Performance Report',
          description: 'Submit performance metrics and final report',
          percentage: 10,
          amount: amount * 0.1,
          status: 'pending',
        },
      ],
      contentCalendar: [],
      drafts: [],
      performanceTracking: [],
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addCampaign(campaign);
    return campaign;
  }, [addCampaign]);

  return useMemo(() => ({
    campaigns,
    isLoading,
    addCampaign,
    updateCampaign,
    updateMilestone,
    addCalendarItem,
    updateCalendarItem,
    addDraft,
    updateDraft,
    addPerformanceMetrics,
    getCampaignsByDeal,
    getCampaignsByUser,
    createCampaignFromDeal,
  }), [
    campaigns,
    isLoading,
    addCampaign,
    updateCampaign,
    updateMilestone,
    addCalendarItem,
    updateCalendarItem,
    addDraft,
    updateDraft,
    addPerformanceMetrics,
    getCampaignsByDeal,
    getCampaignsByUser,
    createCampaignFromDeal,
  ]);
});
