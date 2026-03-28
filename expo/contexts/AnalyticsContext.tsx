import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  AnalyticsDataPoint, 
  ContentPerformance, 
  AudienceDemographics, 
  PostingInsight, 
  ROICalculation 
} from '@/types';

const ANALYTICS_KEY = '@sourceimpact_analytics';
const CONTENT_PERFORMANCE_KEY = '@sourceimpact_content_performance';
const AUDIENCE_DEMOGRAPHICS_KEY = '@sourceimpact_audience_demographics';
const POSTING_INSIGHTS_KEY = '@sourceimpact_posting_insights';
const ROI_CALCULATIONS_KEY = '@sourceimpact_roi_calculations';

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const [engagementTrends, setEngagementTrends] = useState<AnalyticsDataPoint[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<AnalyticsDataPoint[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [audienceDemographics, setAudienceDemographics] = useState<AudienceDemographics | null>(null);
  const [postingInsights, setPostingInsights] = useState<PostingInsight[]>([]);
  const [roiCalculations, setRoiCalculations] = useState<ROICalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        analyticsData,
        performanceData,
        demographicsData,
        insightsData,
        roiData,
      ] = await Promise.all([
        AsyncStorage.getItem(ANALYTICS_KEY),
        AsyncStorage.getItem(CONTENT_PERFORMANCE_KEY),
        AsyncStorage.getItem(AUDIENCE_DEMOGRAPHICS_KEY),
        AsyncStorage.getItem(POSTING_INSIGHTS_KEY),
        AsyncStorage.getItem(ROI_CALCULATIONS_KEY),
      ]);

      if (analyticsData) {
        const parsed = JSON.parse(analyticsData);
        setEngagementTrends(parsed.engagementTrends || []);
        setFollowerGrowth(parsed.followerGrowth || []);
      } else {
        generateMockAnalytics();
      }

      if (performanceData) setContentPerformance(JSON.parse(performanceData));
      else generateMockContentPerformance();

      if (demographicsData) setAudienceDemographics(JSON.parse(demographicsData));
      else generateMockDemographics();

      if (insightsData) setPostingInsights(JSON.parse(insightsData));
      else generateMockInsights();

      if (roiData) setRoiCalculations(JSON.parse(roiData));
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      generateMockAnalytics();
      generateMockContentPerformance();
      generateMockDemographics();
      generateMockInsights();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAnalytics = () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const engagement: AnalyticsDataPoint[] = [];
    const followers: AnalyticsDataPoint[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      engagement.push({
        date: date.toISOString().split('T')[0],
        value: 3.5 + Math.random() * 1.5,
        label: `${(3.5 + Math.random() * 1.5).toFixed(1)}%`,
      });
      
      followers.push({
        date: date.toISOString().split('T')[0],
        value: 120000 + i * 150 + Math.random() * 300,
      });
    }
    
    setEngagementTrends(engagement);
    setFollowerGrowth(followers);
    
    AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify({
      engagementTrends: engagement,
      followerGrowth: followers,
    }));
  };

  const generateMockContentPerformance = () => {
    const mockPerformance: ContentPerformance[] = [
      {
        id: 'perf_001',
        portfolioItemId: 'port_001',
        title: '30-Day Fitness Challenge',
        platform: 'instagram',
        views: 450000,
        likes: 28000,
        comments: 1200,
        shares: 850,
        engagementRate: 6.7,
        postedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        reachRate: 42,
        clickThroughRate: 3.2,
      },
      {
        id: 'perf_002',
        portfolioItemId: 'port_002',
        title: 'Healthy Meal Prep Series',
        platform: 'youtube',
        views: 320000,
        likes: 19000,
        comments: 850,
        shares: 620,
        engagementRate: 6.4,
        postedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        reachRate: 38,
        clickThroughRate: 2.8,
      },
      {
        id: 'perf_003',
        portfolioItemId: 'port_003',
        title: 'Morning Yoga Routine',
        platform: 'tiktok',
        views: 280000,
        likes: 16500,
        comments: 720,
        shares: 950,
        engagementRate: 6.5,
        postedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        reachRate: 45,
        clickThroughRate: 4.1,
      },
    ];
    
    setContentPerformance(mockPerformance);
    AsyncStorage.setItem(CONTENT_PERFORMANCE_KEY, JSON.stringify(mockPerformance));
  };

  const generateMockDemographics = () => {
    const mockDemographics: AudienceDemographics = {
      ageGroups: [
        { range: '18-24', percentage: 32 },
        { range: '25-34', percentage: 45 },
        { range: '35-44', percentage: 18 },
        { range: '45+', percentage: 5 },
      ],
      genders: [
        { gender: 'Female', percentage: 68 },
        { gender: 'Male', percentage: 30 },
        { gender: 'Other', percentage: 2 },
      ],
      locations: [
        { country: 'United States', percentage: 42 },
        { country: 'United Kingdom', percentage: 18 },
        { country: 'Canada', percentage: 12 },
        { country: 'Australia', percentage: 10 },
        { country: 'Other', percentage: 18 },
      ],
      interests: [
        { interest: 'Fitness & Health', percentage: 85 },
        { interest: 'Nutrition', percentage: 72 },
        { interest: 'Wellness', percentage: 68 },
        { interest: 'Lifestyle', percentage: 54 },
        { interest: 'Sports', percentage: 48 },
      ],
    };
    
    setAudienceDemographics(mockDemographics);
    AsyncStorage.setItem(AUDIENCE_DEMOGRAPHICS_KEY, JSON.stringify(mockDemographics));
  };

  const generateMockInsights = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mockInsights: PostingInsight[] = [];
    
    days.forEach((day, dayIndex) => {
      [6, 9, 12, 15, 18, 21].forEach(hour => {
        mockInsights.push({
          dayOfWeek: day,
          hour,
          averageEngagement: 3.0 + Math.random() * 2.5,
          postCount: Math.floor(Math.random() * 10) + 1,
        });
      });
    });
    
    setPostingInsights(mockInsights);
    AsyncStorage.setItem(POSTING_INSIGHTS_KEY, JSON.stringify(mockInsights));
  };

  const addContentPerformance = useCallback(async (performance: ContentPerformance) => {
    const updated = [...contentPerformance, performance];
    setContentPerformance(updated);
    await AsyncStorage.setItem(CONTENT_PERFORMANCE_KEY, JSON.stringify(updated));
  }, [contentPerformance]);

  const addROICalculation = useCallback(async (roi: ROICalculation) => {
    const updated = [...roiCalculations, roi];
    setRoiCalculations(updated);
    await AsyncStorage.setItem(ROI_CALCULATIONS_KEY, JSON.stringify(updated));
  }, [roiCalculations]);

  const getBestPerformingContent = useCallback(() => {
    return [...contentPerformance]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);
  }, [contentPerformance]);

  const getOptimalPostingTimes = useCallback(() => {
    return [...postingInsights]
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 5);
  }, [postingInsights]);

  const calculateROI = useCallback((campaignId: string, investment: number, metrics: {
    engagement: number;
    reach: number;
    conversions: number;
  }): ROICalculation => {
    const engagementValue = metrics.engagement * 0.05;
    const reachValue = metrics.reach * 0.02;
    const conversionValue = metrics.conversions * 50;
    
    const revenue = engagementValue + reachValue + conversionValue;
    const roi = ((revenue - investment) / investment) * 100;
    
    return {
      campaignId,
      investment,
      revenue,
      roi,
      engagementValue,
      reachValue,
      conversionValue,
    };
  }, []);

  return useMemo(() => ({
    engagementTrends,
    followerGrowth,
    contentPerformance,
    audienceDemographics,
    postingInsights,
    roiCalculations,
    isLoading,
    addContentPerformance,
    addROICalculation,
    getBestPerformingContent,
    getOptimalPostingTimes,
    calculateROI,
  }), [
    engagementTrends,
    followerGrowth,
    contentPerformance,
    audienceDemographics,
    postingInsights,
    roiCalculations,
    isLoading,
    addContentPerformance,
    addROICalculation,
    getBestPerformingContent,
    getOptimalPostingTimes,
    calculateROI,
  ]);
});
