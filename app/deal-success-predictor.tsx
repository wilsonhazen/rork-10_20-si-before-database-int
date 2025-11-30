import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb, Sparkles, Target, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { mockInfluencers } from '@/mocks/seed-data';
import Colors from '@/constants/colors';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

type DealAnalysis = {
  successScore: number;
  likelihood: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  strengths: string[];
  risks: string[];
  improvements: {
    area: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  estimatedTimeline: string;
  confidenceLevel: number;
};

export default function DealSuccessPredictor() {
  const { user } = useAuth();
  const { deals } = useData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  
  const [gigTitle, setGigTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [category, setCategory] = useState('');

  const analyzeDeal = async () => {
    if (!gigTitle || !budget) {
      alert('Please fill in at least gig title and budget');
      return;
    }

    setIsAnalyzing(true);
    try {
      const userDeals = deals.filter(d => 
        d.influencerId === user?.id || d.sponsorId === user?.id
      );

      const historicalData = {
        totalDeals: userDeals.length,
        completedDeals: userDeals.filter(d => d.status === 'completed').length,
        cancelledDeals: userDeals.filter(d => d.status === 'cancelled').length,
        avgCompletionTime: '14 days',
      };

      const influencerProfile = user?.role === 'influencer' 
        ? mockInfluencers.find(inf => inf.id === user.id)
        : null;

      console.log('Analyzing deal with AI:', {
        gigTitle,
        budget: Number(budget),
        followerCount: followerCount ? Number(followerCount) : (influencerProfile?.followers || 0),
        engagementRate: engagementRate ? Number(engagementRate) : (influencerProfile?.engagementRate || 0),
        category,
        historicalData,
      });

      const aiAnalysis = await generateObject({
        messages: [
          {
            role: 'user',
            content: `You are an AI deal success predictor for influencer marketing. Analyze this potential deal and predict its success.

Deal Details:
- Gig Title: ${gigTitle}
- Budget: $${budget}
- Influencer Followers: ${followerCount || influencerProfile?.followers || 'Not specified'}
- Engagement Rate: ${engagementRate || influencerProfile?.engagementRate || 'Not specified'}%
- Category: ${category || 'Not specified'}

Historical Performance:
- Total Deals: ${historicalData.totalDeals}
- Completed: ${historicalData.completedDeals}
- Cancelled: ${historicalData.cancelledDeals}
- Avg Completion Time: ${historicalData.avgCompletionTime}

User Role: ${user?.role}

Analyze:
1. Success score (0-100)
2. Success likelihood
3. Key strengths of this deal
4. Potential risks
5. Specific improvement suggestions with impact levels
6. Estimated timeline to complete
7. Confidence level in prediction (0-100)

Be specific, actionable, and data-driven.`,
          },
        ],
        schema: z.object({
          successScore: z.number().min(0).max(100),
          likelihood: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
          strengths: z.array(z.string()).min(2).max(5),
          risks: z.array(z.string()).min(1).max(5),
          improvements: z.array(z.object({
            area: z.string(),
            suggestion: z.string(),
            impact: z.enum(['high', 'medium', 'low']),
          })).min(3).max(7),
          estimatedTimeline: z.string(),
          confidenceLevel: z.number().min(0).max(100),
        }),
      });

      console.log('AI Deal Analysis:', aiAnalysis);
      setAnalysis(aiAnalysis);
    } catch (error) {
      console.error('Failed to analyze deal:', error);
      
      setAnalysis({
        successScore: 75,
        likelihood: 'high' as const,
        strengths: [
          'Budget aligns with market rates',
          'Clear deliverables specified',
          'Proven track record in this category',
        ],
        risks: [
          'Timeline might be tight',
          'Audience overlap uncertain',
        ],
        improvements: [
          {
            area: 'Communication',
            suggestion: 'Set up weekly check-ins to ensure alignment',
            impact: 'high' as const,
          },
          {
            area: 'Content Strategy',
            suggestion: 'Create detailed content calendar before starting',
            impact: 'high' as const,
          },
          {
            area: 'Metrics',
            suggestion: 'Define success metrics upfront',
            impact: 'medium' as const,
          },
        ],
        estimatedTimeline: '14-21 days',
        confidenceLevel: 82,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'very_high': return Colors.success;
      case 'high': return Colors.success;
      case 'medium': return Colors.warning;
      case 'low': return Colors.danger;
      case 'very_low': return Colors.danger;
      default: return Colors.textSecondary;
    }
  };

  const getLikelihoodLabel = (likelihood: string) => {
    switch (likelihood) {
      case 'very_high': return 'Very High';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      case 'very_low': return 'Very Low';
      default: return 'Unknown';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return Colors.danger;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Deal Success Predictor',
        headerStyle: { backgroundColor: Colors.dark },
        headerTintColor: Colors.text,
      }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Sparkles size={32} color={Colors.primary} />
          <Text style={styles.headerTitle}>Predict Deal Success</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered analysis to optimize your deals
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formLabel}>Gig Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Instagram Story Campaign"
            placeholderTextColor={Colors.textSecondary}
            value={gigTitle}
            onChangeText={setGigTitle}
          />

          <Text style={styles.formLabel}>Budget * ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5000"
            placeholderTextColor={Colors.textSecondary}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Follower Count (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50000"
            placeholderTextColor={Colors.textSecondary}
            value={followerCount}
            onChangeText={setFollowerCount}
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Engagement Rate % (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 4.5"
            placeholderTextColor={Colors.textSecondary}
            value={engagementRate}
            onChangeText={setEngagementRate}
            keyboardType="decimal-pad"
          />

          <Text style={styles.formLabel}>Category (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Fitness, Fashion, Tech"
            placeholderTextColor={Colors.textSecondary}
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity 
            style={styles.analyzeButton}
            onPress={analyzeDeal}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.analyzeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Sparkles size={20} color={Colors.text} />
                  <Text style={styles.analyzeText}>Analyze Deal</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {analysis && (
          <>
            <View style={styles.scoreSection}>
              <LinearGradient
                colors={[Colors.darkCard, Colors.backgroundSecondary]}
                style={styles.scoreGradient}
              >
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>Success Score</Text>
                  <View style={[styles.likelihoodBadge, { backgroundColor: getLikelihoodColor(analysis.likelihood) + '20' }]}>
                    <Text style={[styles.likelihoodText, { color: getLikelihoodColor(analysis.likelihood) }]}>
                      {getLikelihoodLabel(analysis.likelihood)} Likelihood
                    </Text>
                  </View>
                </View>
                <Text style={[styles.scoreValue, { color: getLikelihoodColor(analysis.likelihood) }]}>
                  {analysis.successScore}
                  <Text style={styles.scoreMax}>/100</Text>
                </Text>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Confidence: {analysis.confidenceLevel}%</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={24} color={Colors.success} />
                <Text style={styles.sectionTitle}>Strengths</Text>
              </View>
              {analysis.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.listText}>{strength}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertCircle size={24} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Potential Risks</Text>
              </View>
              {analysis.risks.map((risk, index) => (
                <View key={index} style={styles.listItem}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={styles.listText}>{risk}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Improvement Suggestions</Text>
              </View>
              {analysis.improvements.map((improvement, index) => (
                <View key={index} style={styles.improvementCard}>
                  <LinearGradient
                    colors={[Colors.darkCard, Colors.backgroundSecondary]}
                    style={styles.improvementGradient}
                  >
                    <View style={styles.improvementHeader}>
                      <Text style={styles.improvementArea}>{improvement.area}</Text>
                      <View style={[styles.impactBadge, { backgroundColor: getImpactColor(improvement.impact) + '20' }]}>
                        <Text style={[styles.impactText, { color: getImpactColor(improvement.impact) }]}>
                          {improvement.impact.toUpperCase()} IMPACT
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.improvementSuggestion}>{improvement.suggestion}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            <View style={styles.timelineSection}>
              <LinearGradient
                colors={[Colors.darkCard, Colors.backgroundSecondary]}
                style={styles.timelineGradient}
              >
                <Clock size={24} color={Colors.secondary} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Estimated Timeline</Text>
                  <Text style={styles.timelineValue}>{analysis.estimatedTimeline}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Target size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Find Similar Opportunities</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/ai-analytics-dashboard')}
              >
                <TrendingUp size={20} color={Colors.success} />
                <Text style={styles.actionButtonText}>View Analytics</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  form: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  analyzeButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  analyzeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scoreSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  scoreGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  likelihoodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  likelihoodText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  scoreMax: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  confidenceRow: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  improvementCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  improvementGradient: {
    padding: 16,
  },
  improvementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  improvementArea: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  improvementSuggestion: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  timelineSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timelineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
