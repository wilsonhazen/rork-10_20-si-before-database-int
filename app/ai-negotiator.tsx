import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, TrendingUp, DollarSign, Award, Target, Zap, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { generateText } from '@rork-ai/toolkit-sdk';

type NegotiationAdvice = {
  suggestedOffer: number;
  minAcceptable: number;
  maxReasonable: number;
  marketRate: string;
  strengths: string[];
  justifications: string[];
  negotiationStrategy: string[];
  counterOfferScript: string;
};

export default function AINegotiatorScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [role, setRole] = useState<'influencer' | 'sponsor'>(user?.role === 'sponsor' ? 'sponsor' : 'influencer');
  const [followers, setFollowers] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [niche, setNiche] = useState('');
  const [currentOffer, setCurrentOffer] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [brandBudget, setBrandBudget] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<NegotiationAdvice | null>(null);

  const handleAnalyze = async () => {
    if (role === 'influencer' && (!followers.trim() || !engagementRate.trim() || !niche.trim())) {
      Alert.alert('Missing Information', 'Please fill in your followers, engagement rate, and niche.');
      return;
    }
    if (role === 'sponsor' && (!currentOffer.trim() || !deliverables.trim())) {
      Alert.alert('Missing Information', 'Please fill in current offer and deliverables.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const prompt = role === 'influencer'
        ? `You are an expert influencer marketing negotiation advisor helping an influencer negotiate better rates.

Influencer Details:
- Followers: ${followers}
- Engagement Rate: ${engagementRate}%
- Niche: ${niche}
- Current Offer: $${currentOffer || 'Not specified'}
- Deliverables: ${deliverables || 'Not specified'}

Provide strategic negotiation advice in this EXACT format:

SUGGESTED_OFFER: [number only, optimal counter-offer]

MIN_ACCEPTABLE: [number only, minimum to accept]

MAX_REASONABLE: [number only, maximum they could justify]

MARKET_RATE: [brief market analysis for this niche/size]

STRENGTHS:
• [Strength 1]
• [Strength 2]
• [Strength 3]
• [Strength 4]

JUSTIFICATIONS:
• [Justification 1]
• [Justification 2]
• [Justification 3]

STRATEGY:
• [Strategy point 1]
• [Strategy point 2]
• [Strategy point 3]
• [Strategy point 4]

COUNTER_SCRIPT:
[Write a professional 2-3 paragraph counter-offer email/message that the influencer can use. Make it confident, data-driven, and collaborative in tone.]

Base recommendations on industry standards, engagement value, and market data.`
        : `You are an expert brand negotiation advisor helping a sponsor negotiate fair influencer partnerships.

Brand Details:
- Current Offer: $${currentOffer}
- Requested Deliverables: ${deliverables}
- Budget Range: $${brandBudget || 'Flexible'}
- Target Niche: ${niche || 'Various'}

Provide strategic negotiation advice in this EXACT format:

SUGGESTED_OFFER: [number only, optimal offer]

MIN_ACCEPTABLE: [number only, minimum quality threshold]

MAX_REASONABLE: [number only, maximum budget-justified offer]

MARKET_RATE: [brief market analysis for this type of campaign]

STRENGTHS:
• [Your negotiation strength 1]
• [Your negotiation strength 2]
• [Your negotiation strength 3]

JUSTIFICATIONS:
• [Budget justification 1]
• [Budget justification 2]
• [Budget justification 3]

STRATEGY:
• [Strategy point 1]
• [Strategy point 2]
• [Strategy point 3]
• [Strategy point 4]

COUNTER_SCRIPT:
[Write a professional 2-3 paragraph negotiation message that is firm yet collaborative, emphasizing ROI and partnership value.]

Base recommendations on campaign goals, influencer market rates, and ROI expectations.`;

      const response = await generateText(prompt);
      
      const suggestedMatch = response.match(/SUGGESTED_OFFER:\s*(\d+)/);
      const suggestedOffer = suggestedMatch ? parseInt(suggestedMatch[1]) : 5000;

      const minMatch = response.match(/MIN_ACCEPTABLE:\s*(\d+)/);
      const minAcceptable = minMatch ? parseInt(minMatch[1]) : Math.floor(suggestedOffer * 0.7);

      const maxMatch = response.match(/MAX_REASONABLE:\s*(\d+)/);
      const maxReasonable = maxMatch ? parseInt(maxMatch[1]) : Math.ceil(suggestedOffer * 1.3);

      const marketMatch = response.match(/MARKET_RATE:\s*(.+?)(?=\n\n|STRENGTHS:|$)/s);
      const marketRate = marketMatch?.[1]?.trim() || 'Market analysis not available';

      const strengthsMatch = response.match(/STRENGTHS:\s*([\s\S]*?)(?=\nJUSTIFICATIONS:|$)/);
      const strengths = strengthsMatch?.[1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim()) || [];

      const justMatch = response.match(/JUSTIFICATIONS:\s*([\s\S]*?)(?=\nSTRATEGY:|$)/);
      const justifications = justMatch?.[1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim()) || [];

      const stratMatch = response.match(/STRATEGY:\s*([\s\S]*?)(?=\nCOUNTER_SCRIPT:|$)/);
      const negotiationStrategy = stratMatch?.[1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim()) || [];

      const scriptMatch = response.match(/COUNTER_SCRIPT:\s*([\s\S]*?)$/);
      const counterOfferScript = scriptMatch?.[1]?.trim() || '';

      setAdvice({
        suggestedOffer,
        minAcceptable,
        maxReasonable,
        marketRate,
        strengths: strengths.length > 0 ? strengths : ['Strong engagement metrics', 'Niche authority', 'Professional portfolio'],
        justifications: justifications.length > 0 ? justifications : ['Market rate analysis', 'Value proposition', 'Historical performance'],
        negotiationStrategy: negotiationStrategy.length > 0 ? negotiationStrategy : ['Start with data', 'Emphasize value', 'Be collaborative', 'Set clear expectations'],
        counterOfferScript: counterOfferScript || 'Professional counter-offer message not generated.',
      });
    } catch (error) {
      console.error('Failed to analyze negotiation:', error);
      Alert.alert('Error', 'Failed to generate negotiation advice. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRangeColor = (value: number, min: number, max: number) => {
    if (value < min) return Colors.danger;
    if (value > max) return Colors.warning;
    return Colors.success;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Negotiator',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.warning, Colors.secondary]}
        style={styles.header}
      >
        <TrendingUp size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>AI Negotiator</Text>
          <Text style={styles.headerSubtitle}>Get paid what you're worth</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!advice ? (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💰 Maximize Your Earnings</Text>
                <Text style={styles.infoText}>
                  {role === 'influencer'
                    ? 'Our AI analyzes your metrics, market rates, and negotiation leverage to suggest optimal pricing and provide you with data-backed scripts for counter-offers.'
                    : 'Get data-driven budget recommendations and negotiation strategies to secure fair partnerships with influencers while maximizing ROI.'}
                </Text>
              </View>

              <View style={styles.roleToggle}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'influencer' && styles.roleButtonActive]}
                  onPress={() => setRole('influencer')}
                >
                  <Text style={[styles.roleButtonText, role === 'influencer' && styles.roleButtonTextActive]}>
                    Influencer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'sponsor' && styles.roleButtonActive]}
                  onPress={() => setRole('sponsor')}
                >
                  <Text style={[styles.roleButtonText, role === 'sponsor' && styles.roleButtonTextActive]}>
                    Brand/Sponsor
                  </Text>
                </TouchableOpacity>
              </View>

              {role === 'influencer' ? (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>Your Followers *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 50000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={followers}
                      onChangeText={setFollowers}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Engagement Rate (%) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 4.5"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                      value={engagementRate}
                      onChangeText={setEngagementRate}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Your Niche *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Fitness, Fashion, Tech"
                      placeholderTextColor={Colors.textMuted}
                      value={niche}
                      onChangeText={setNiche}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Current Offer (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 2500"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={currentOffer}
                      onChangeText={setCurrentOffer}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Requested Deliverables (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="e.g., 1 feed post, 3 stories, usage rights"
                      placeholderTextColor={Colors.textMuted}
                      value={deliverables}
                      onChangeText={setDeliverables}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>Current Offer Amount *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 3000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={currentOffer}
                      onChangeText={setCurrentOffer}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Requested Deliverables *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="What are you asking for? (posts, stories, videos, etc.)"
                      placeholderTextColor={Colors.textMuted}
                      value={deliverables}
                      onChangeText={setDeliverables}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Budget Range (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 5000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={brandBudget}
                      onChangeText={setBrandBudget}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Target Niche (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Fitness, Tech, Lifestyle"
                      placeholderTextColor={Colors.textMuted}
                      value={niche}
                      onChangeText={setNiche}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                disabled={isAnalyzing}
              >
                <LinearGradient
                  colors={[Colors.warning, Colors.secondary]}
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
                      <Text style={styles.analyzeButtonText}>Get Negotiation Advice</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>🎯 Your Negotiation Strategy</Text>
                <TouchableOpacity onPress={() => setAdvice(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>New Analysis</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceRangeCard}>
                <LinearGradient
                  colors={[Colors.warning, Colors.secondary]}
                  style={styles.priceRangeGradient}
                >
                  <Text style={styles.priceRangeLabel}>Suggested Offer</Text>
                  <Text style={styles.priceRangeValue}>${advice.suggestedOffer.toLocaleString()}</Text>
                  <View style={styles.priceRangeBar}>
                    <View style={styles.priceRangeLine}>
                      <View style={[styles.priceRangeMarker, { left: 0 }]}>
                        <Text style={styles.priceRangeMarkerText}>${advice.minAcceptable.toLocaleString()}</Text>
                        <Text style={styles.priceRangeMarkerLabel}>Min</Text>
                      </View>
                      <View style={[styles.priceRangeMarker, { left: '50%', marginLeft: -40 }]}>
                        <Text style={[styles.priceRangeMarkerText, { fontWeight: '700' as const }]}>
                          ${advice.suggestedOffer.toLocaleString()}
                        </Text>
                        <Text style={styles.priceRangeMarkerLabel}>Target</Text>
                      </View>
                      <View style={[styles.priceRangeMarker, { right: 0 }]}>
                        <Text style={styles.priceRangeMarkerText}>${advice.maxReasonable.toLocaleString()}</Text>
                        <Text style={styles.priceRangeMarkerLabel}>Max</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.marketCard}>
                <View style={styles.marketHeader}>
                  <Target size={20} color={Colors.info} />
                  <Text style={styles.marketTitle}>Market Analysis</Text>
                </View>
                <Text style={styles.marketText}>{advice.marketRate}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Award size={20} color={Colors.success} />
                  <Text style={styles.sectionTitle}>Your Strengths</Text>
                </View>
                {advice.strengths.map((strength, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <CheckCircle2 size={16} color={Colors.success} />
                    <Text style={styles.listText}>{strength}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <DollarSign size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Justifications</Text>
                </View>
                {advice.justifications.map((justification, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <CheckCircle2 size={16} color={Colors.primary} />
                    <Text style={styles.listText}>{justification}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={20} color={Colors.warning} />
                  <Text style={styles.sectionTitle}>Strategy</Text>
                </View>
                {advice.negotiationStrategy.map((strategy, idx) => (
                  <View key={idx} style={styles.strategyCard}>
                    <View style={styles.strategyNumber}>
                      <Text style={styles.strategyNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.strategyText}>{strategy}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.scriptCard}>
                <View style={styles.scriptHeader}>
                  <AlertCircle size={20} color={Colors.info} />
                  <Text style={styles.scriptTitle}>📧 Counter-Offer Script</Text>
                </View>
                <Text style={styles.scriptSubtitle}>Use this template for your negotiation:</Text>
                <View style={styles.scriptContent}>
                  <Text style={styles.scriptText}>{advice.counterOfferScript}</Text>
                </View>
                <TouchableOpacity style={styles.copyScriptButton}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.copyScriptGradient}
                  >
                    <Text style={styles.copyScriptText}>Copy Script</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.regenerateButton} onPress={handleAnalyze} disabled={isAnalyzing}>
                <Sparkles size={20} color={Colors.warning} />
                <Text style={styles.regenerateButtonText}>Regenerate Advice</Text>
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
  infoBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: Colors.warning,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  priceRangeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  priceRangeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  priceRangeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  priceRangeValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  priceRangeBar: {
    width: '100%',
  },
  priceRangeLine: {
    position: 'relative',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  priceRangeMarker: {
    position: 'absolute',
    alignItems: 'center',
    top: -28,
  },
  priceRangeMarkerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceRangeMarkerLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  marketCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.info,
  },
  marketText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  strategyNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  strategyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  scriptCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  scriptTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scriptSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  scriptContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scriptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  copyScriptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  copyScriptGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyScriptText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
});
