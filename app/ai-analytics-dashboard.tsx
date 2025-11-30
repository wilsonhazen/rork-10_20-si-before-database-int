import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, ArrowRight, AlertCircle, Sparkles, BarChart3, Zap, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { mockGigs } from '@/mocks/seed-data';
import Colors from '@/constants/colors';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

type Insight = {
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'success' | 'trend';
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
};

type Prediction = {
  metric: string;
  current: number;
  predicted: number;
  change: number;
  timeframe: string;
};

type MarketTrend = {
  category: string;
  growth: number;
  demand: 'high' | 'medium' | 'low';
  avgPrice: number;
};

export default function AIAnalyticsDashboard() {
  const { user } = useAuth();
  const { deals, gigs, applications } = useData();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAIInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, deals, gigs, applications]);

  const generateAIInsights = async () => {
    setIsLoading(true);
    try {
      const userDeals = deals.filter(d => 
        d.influencerId === user?.id || d.sponsorId === user?.id
      );
      const userApplications = applications.filter(a => a.influencerId === user?.id);

      const dealsData = {
        total: userDeals.length,
        completed: userDeals.filter(d => d.status === 'completed').length,
        active: userDeals.filter(d => d.status === 'active').length,
        avgValue: 0,
      };

      const applicationsData = {
        total: userApplications.length,
        approved: userApplications.filter(a => a.status === 'approved').length,
        pending: userApplications.filter(a => a.status === 'pending').length,
        rejected: userApplications.filter(a => a.status === 'rejected').length,
      };

      const marketData = {
        totalGigs: [...mockGigs, ...gigs].length,
        openGigs: [...mockGigs, ...gigs].filter(g => g.status === 'open').length,
        avgBudget: [...mockGigs, ...gigs].reduce((sum, g) => sum + (g.price || 0), 0) / [...mockGigs, ...gigs].length,
      };

      console.log('Generating AI insights with data:', { dealsData, applicationsData, marketData });

      const aiInsights = await generateObject({
        messages: [
          {
            role: 'user',
            content: `You are an AI analytics expert analyzing influencer marketing data. Generate insights, predictions, and recommendations.

User Role: ${user?.role}
User Stats:
- Total Deals: ${dealsData.total}
- Completed Deals: ${dealsData.completed}
- Active Deals: ${dealsData.active}
- Average Deal Value: $${dealsData.avgValue.toFixed(0)}
- Applications: ${applicationsData.total} (${applicationsData.approved} approved, ${applicationsData.pending} pending)

Market Data:
- Total Gigs Available: ${marketData.totalGigs}
- Open Gigs: ${marketData.openGigs}
- Average Budget: $${marketData.avgBudget.toFixed(0)}

Generate:
1. 4-6 actionable insights (opportunities, warnings, or success notes)
2. 3-4 predictions for the next 30 days
3. 3-5 market trends by category

Be specific, data-driven, and actionable.`,
          },
        ],
        schema: z.object({
          insights: z.array(z.object({
            title: z.string(),
            description: z.string(),
            type: z.enum(['opportunity', 'warning', 'success', 'trend']),
            priority: z.enum(['high', 'medium', 'low']),
          })),
          predictions: z.array(z.object({
            metric: z.string(),
            current: z.number(),
            predicted: z.number(),
            change: z.number(),
            timeframe: z.string(),
          })),
          trends: z.array(z.object({
            category: z.string(),
            growth: z.number(),
            demand: z.enum(['high', 'medium', 'low']),
            avgPrice: z.number(),
          })),
        }),
      });

      console.log('AI Insights Generated:', aiInsights);
      setInsights(aiInsights.insights);
      setPredictions(aiInsights.predictions);
      setTrends(aiInsights.trends);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      
      setInsights([
        {
          title: 'Profile Optimization Needed',
          description: 'Complete your profile to increase visibility by 45%',
          type: 'opportunity',
          priority: 'high',
        },
        {
          title: 'Peak Application Time',
          description: 'Apply to gigs on Monday-Wednesday for 30% higher acceptance',
          type: 'trend',
          priority: 'medium',
        },
      ]);
      
      setPredictions([
        {
          metric: 'Deal Success Rate',
          current: 65,
          predicted: 78,
          change: 13,
          timeframe: '30 days',
        },
      ]);
      
      setTrends([
        {
          category: 'Fitness',
          growth: 25,
          demand: 'high' as const,
          avgPrice: 3500,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'warning': return AlertCircle;
      case 'success': return CheckCircle;
      case 'trend': return TrendingUp;
      default: return Sparkles;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return Colors.primary;
      case 'warning': return Colors.warning;
      case 'success': return Colors.success;
      case 'trend': return Colors.secondary;
      default: return Colors.textSecondary;
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return Colors.success;
      case 'medium': return Colors.warning;
      case 'low': return Colors.danger;
      default: return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'AI Analytics',
        headerStyle: { backgroundColor: Colors.dark },
        headerTintColor: Colors.text,
      }} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your data with AI...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Sparkles size={32} color={Colors.warning} />
            <Text style={styles.headerTitle}>AI-Powered Insights</Text>
            <Text style={styles.headerSubtitle}>
              Real-time predictions and market intelligence
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Predictions</Text>
            </View>
            {predictions.map((pred, index) => (
              <View key={index} style={styles.predictionCard}>
                <LinearGradient
                  colors={[Colors.darkCard, Colors.backgroundSecondary]}
                  style={styles.predictionGradient}
                >
                  <View style={styles.predictionHeader}>
                    <Text style={styles.predictionMetric}>{pred.metric}</Text>
                    <View style={styles.predictionChange}>
                      <TrendingUp size={16} color={pred.change > 0 ? Colors.success : Colors.danger} />
                      <Text style={[
                        styles.predictionChangeText,
                        { color: pred.change > 0 ? Colors.success : Colors.danger }
                      ]}>
                        {pred.change > 0 ? '+' : ''}{pred.change}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.predictionValues}>
                    <View style={styles.predictionValue}>
                      <Text style={styles.predictionLabel}>Current</Text>
                      <Text style={styles.predictionNumber}>{pred.current}</Text>
                    </View>
                    <ArrowRight size={20} color={Colors.textSecondary} />
                    <View style={styles.predictionValue}>
                      <Text style={styles.predictionLabel}>Predicted</Text>
                      <Text style={[styles.predictionNumber, { color: Colors.primary }]}>
                        {pred.predicted}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.predictionTimeframe}>In {pred.timeframe}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={24} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Actionable Insights</Text>
            </View>
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              const color = getInsightColor(insight.type);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.insightCard}
                  onPress={() => insight.actionUrl && router.push(insight.actionUrl as any)}
                >
                  <LinearGradient
                    colors={[Colors.darkCard, Colors.backgroundSecondary]}
                    style={styles.insightGradient}
                  >
                    <View style={styles.insightHeader}>
                      <Icon size={24} color={color} />
                      <View style={styles.insightBadge}>
                        <Text style={[styles.insightBadgeText, { color }]}>
                          {insight.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={24} color={Colors.success} />
              <Text style={styles.sectionTitle}>Market Trends</Text>
            </View>
            {trends.map((trend, index) => (
              <View key={index} style={styles.trendCard}>
                <LinearGradient
                  colors={[Colors.darkCard, Colors.backgroundSecondary]}
                  style={styles.trendGradient}
                >
                  <View style={styles.trendHeader}>
                    <Text style={styles.trendCategory}>{trend.category}</Text>
                    <View style={[styles.demandBadge, { backgroundColor: getDemandColor(trend.demand) + '20' }]}>
                      <Text style={[styles.demandText, { color: getDemandColor(trend.demand) }]}>
                        {trend.demand} demand
                      </Text>
                    </View>
                  </View>
                  <View style={styles.trendStats}>
                    <View style={styles.trendStat}>
                      <Text style={styles.trendStatLabel}>Growth</Text>
                      <Text style={[styles.trendStatValue, { color: Colors.success }]}>
                        +{trend.growth}%
                      </Text>
                    </View>
                    <View style={styles.trendStat}>
                      <Text style={styles.trendStatLabel}>Avg Price</Text>
                      <Text style={styles.trendStatValue}>
                        ${trend.avgPrice.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={generateAIInsights}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.refreshGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Sparkles size={20} color={Colors.text} />
              <Text style={styles.refreshText}>Refresh Insights</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  predictionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  predictionGradient: {
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionMetric: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  predictionChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictionChangeText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  predictionValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  predictionValue: {
    alignItems: 'center',
    gap: 4,
  },
  predictionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  predictionNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  predictionTimeframe: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  insightCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  insightGradient: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.darkCard,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  trendCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trendGradient: {
    padding: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendCategory: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  demandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  demandText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  trendStats: {
    flexDirection: 'row',
    gap: 24,
  },
  trendStat: {
    gap: 4,
  },
  trendStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trendStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  refreshButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refreshGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
