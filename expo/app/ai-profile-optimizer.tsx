import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Sparkles, TrendingUp, Users, DollarSign, CheckCircle2, XCircle, AlertCircle, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { generateText } from '@rork-ai/toolkit-sdk';

type ScoreCategory = {
  name: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs-improvement';
};

type ProfileAnalysis = {
  overallScore: number;
  categories: ScoreCategory[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
};

export default function AIProfileOptimizerScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!user) return;

    setIsAnalyzing(true);

    try {
      const userInfo = `
Role: ${user.role}
Name: ${user.name}
${user.role === 'influencer' ? `
Influencer Type: ${(user as any).influencerType || 'Not specified'}
Followers: ${(user as any).followers || 'Not specified'}
Engagement Rate: ${(user as any).engagementRate || 'Not specified'}%
Rate Per Post: $${(user as any).ratePerPost || 'Not specified'}
Bio: ${(user as any).bio || 'Not provided'}
Categories: ${(user as any).categories?.join(', ') || 'Not specified'}
` : user.role === 'sponsor' ? `
Company: ${(user as any).company || 'Not specified'}
Industry: ${(user as any).industry || 'Not specified'}
Budget: $${(user as any).budget || 'Not specified'}
Bio: ${(user as any).bio || 'Not provided'}
` : `
Bio: ${(user as any).bio || 'Not provided'}
Experience: ${(user as any).experience || 'Not specified'}
`}
      `;

      const prompt = `Analyze this ${user.role} profile and provide a comprehensive optimization report.

${userInfo}

Analyze the profile across these dimensions:
1. Profile Completeness (0-100)
2. Content Quality (0-100)
3. Market Positioning (0-100)
4. Engagement Potential (0-100)
5. Professional Presentation (0-100)

For each dimension, evaluate:
- Current score out of 100
- Status: "excellent" (80+), "good" (60-79), or "needs-improvement" (below 60)

Then provide:
- 3-5 key strengths
- 3-5 areas for improvement
- 5-7 actionable recommendations

Format your response EXACTLY as follows (use this exact structure):

OVERALL_SCORE: [number 0-100]

CATEGORIES:
Profile Completeness|[score]|[status]
Content Quality|[score]|[status]
Market Positioning|[score]|[status]
Engagement Potential|[score]|[status]
Professional Presentation|[score]|[status]

STRENGTHS:
• [strength 1]
• [strength 2]
• [strength 3]

IMPROVEMENTS:
• [improvement 1]
• [improvement 2]
• [improvement 3]

RECOMMENDATIONS:
• [recommendation 1]
• [recommendation 2]
• [recommendation 3]
• [recommendation 4]
• [recommendation 5]
`;

      const response = await generateText(prompt);
      
      const overallScoreMatch = response.match(/OVERALL_SCORE:\s*(\d+)/);
      const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 75;

      const categoriesSection = response.match(/CATEGORIES:(.*?)STRENGTHS:/s)?.[1] || '';
      const categories: ScoreCategory[] = categoriesSection
        .split('\n')
        .filter(line => line.includes('|'))
        .map(line => {
          const [name, scoreStr, status] = line.split('|').map(s => s.trim());
          return {
            name,
            score: parseInt(scoreStr) || 70,
            maxScore: 100,
            status: (status as 'excellent' | 'good' | 'needs-improvement') || 'good',
          };
        });

      const strengthsSection = response.match(/STRENGTHS:(.*?)IMPROVEMENTS:/s)?.[1] || '';
      const strengths = strengthsSection
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim());

      const improvementsSection = response.match(/IMPROVEMENTS:(.*?)RECOMMENDATIONS:/s)?.[1] || '';
      const improvements = improvementsSection
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim());

      const recommendationsSection = response.match(/RECOMMENDATIONS:(.*?)$/s)?.[1] || '';
      const recommendations = recommendationsSection
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim());

      setAnalysis({
        overallScore,
        categories: categories.length > 0 ? categories : [
          { name: 'Profile Completeness', score: 75, maxScore: 100, status: 'good' },
          { name: 'Content Quality', score: 82, maxScore: 100, status: 'excellent' },
          { name: 'Market Positioning', score: 68, maxScore: 100, status: 'good' },
          { name: 'Engagement Potential', score: 71, maxScore: 100, status: 'good' },
          { name: 'Professional Presentation', score: 79, maxScore: 100, status: 'good' },
        ],
        strengths: strengths.length > 0 ? strengths : ['Strong engagement metrics', 'Professional presentation', 'Clear niche focus'],
        improvements: improvements.length > 0 ? improvements : ['Add more detailed bio', 'Include portfolio samples', 'Optimize pricing strategy'],
        recommendations: recommendations.length > 0 ? recommendations : [
          'Update your bio to highlight unique value proposition',
          'Add portfolio examples of best work',
          'Include specific metrics and results',
          'Optimize your rate structure',
          'Add testimonials from previous clients',
        ],
      });
    } catch (error) {
      console.error('Failed to analyze profile:', error);
      Alert.alert('Error', 'Failed to analyze profile. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.danger;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle2 size={20} color={Colors.success} />;
      case 'good':
        return <AlertCircle size={20} color={Colors.warning} />;
      default:
        return <XCircle size={20} color={Colors.danger} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Profile Optimizer',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <Target size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Profile Optimizer</Text>
          <Text style={styles.headerSubtitle}>AI-powered analysis</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!analysis ? (
            <View style={styles.introContainer}>
              <View style={styles.introIcon}>
                <Target size={48} color={Colors.primary} />
              </View>
              <Text style={styles.introTitle}>Optimize Your Profile</Text>
              <Text style={styles.introSubtitle}>
                Get AI-powered insights to improve your profile and attract more opportunities. 
                We'll analyze your profile across multiple dimensions and provide actionable recommendations.
              </Text>

              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <TrendingUp size={24} color={Colors.success} />
                  <Text style={styles.benefitText}>Increase visibility</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Users size={24} color={Colors.primary} />
                  <Text style={styles.benefitText}>Better matches</Text>
                </View>
                <View style={styles.benefitItem}>
                  <DollarSign size={24} color={Colors.warning} />
                  <Text style={styles.benefitText}>Higher earnings</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.analyzeButtonGradient}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                    </>
                  ) : (
                    <>
                      <Zap size={20} color="#FFFFFF" />
                      <Text style={styles.analyzeButtonText}>Analyze My Profile</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.scoreCard}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.scoreCardGradient}
                >
                  <Text style={styles.scoreLabel}>Overall Profile Score</Text>
                  <Text style={styles.scoreValue}>{analysis.overallScore}/100</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreBarFill, { width: `${analysis.overallScore}%` }]} />
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Breakdown</Text>
                {analysis.categories.map((category, index) => (
                  <View key={index} style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {getStatusIcon(category.status)}
                    </View>
                    <View style={styles.categoryScore}>
                      <View style={styles.categoryBar}>
                        <LinearGradient
                          colors={[getScoreColor(category.score), getScoreColor(category.score) + '80']}
                          style={[styles.categoryBarFill, { width: `${(category.score / category.maxScore) * 100}%` }]}
                        />
                      </View>
                      <Text style={[styles.categoryScoreText, { color: getScoreColor(category.score) }]}>
                        {category.score}/{category.maxScore}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Your Strengths</Text>
                <View style={styles.listContainer}>
                  {analysis.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: Colors.success + '30' }]}>
                        <CheckCircle2 size={16} color={Colors.success} />
                      </View>
                      <Text style={styles.listText}>{strength}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Areas to Improve</Text>
                <View style={styles.listContainer}>
                  {analysis.improvements.map((improvement, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: Colors.warning + '30' }]}>
                        <AlertCircle size={16} color={Colors.warning} />
                      </View>
                      <Text style={styles.listText}>{improvement}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Recommendations</Text>
                <View style={styles.listContainer}>
                  {analysis.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationCard}>
                      <View style={styles.recommendationNumber}>
                        <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.reanalyzeButton}
                onPress={() => {
                  setAnalysis(null);
                  handleAnalyze();
                }}
              >
                <Sparkles size={20} color={Colors.primary} />
                <Text style={styles.reanalyzeButtonText}>Re-analyze Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  introIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  benefitsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  benefitItem: {
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  analyzeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scoreCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  scoreCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryScoreText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
  },
  listBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reanalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
  },
  reanalyzeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
