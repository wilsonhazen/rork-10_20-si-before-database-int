import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Briefcase, DollarSign, Users, Tag, Copy, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';
import { generateText } from '@rork-ai/toolkit-sdk';

type GigDetails = {
  title: string;
  description: string;
  requirements: string[];
  deliverables: string[];
  suggestedPrice: number;
  targetAudience: string;
  categories: string[];
};

export default function AIGigGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addGig } = useData();
  const [brandName, setBrandName] = useState('');
  const [productService, setProductService] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [budget, setBudget] = useState('');
  const [goals, setGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGig, setGeneratedGig] = useState<GigDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandName.trim() || !productService.trim() || !goals.trim()) {
      Alert.alert('Missing Information', 'Please fill in brand name, product/service, and campaign goals.');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `You are a professional campaign manager creating an influencer marketing gig listing.

Brand Name: ${brandName}
Product/Service: ${productService}
Target Market: ${targetMarket || 'General audience'}
Budget Range: ${budget || 'Flexible'}
Campaign Goals: ${goals}

Generate a complete, professional gig listing in this EXACT format:

TITLE: [Create a compelling, specific title]

DESCRIPTION:
[Write 3-4 paragraphs describing the campaign, brand, and opportunity. Make it exciting and professional.]

REQUIREMENTS:
• [Requirement 1]
• [Requirement 2]
• [Requirement 3]
• [Requirement 4]
• [Requirement 5]

DELIVERABLES:
• [Deliverable 1]
• [Deliverable 2]
• [Deliverable 3]
• [Deliverable 4]

SUGGESTED_PRICE: [number only, e.g., 5000]

TARGET_AUDIENCE: [Brief description]

CATEGORIES: [category1], [category2], [category3]

Make it specific, professional, and attractive to top-tier influencers. Focus on value and ROI.`;

      const response = await generateText(prompt);
      
      const titleMatch = response.match(/TITLE:\s*(.+?)(?=\n|$)/);
      const title = titleMatch?.[1]?.trim() || 'Untitled Campaign';

      const descMatch = response.match(/DESCRIPTION:\s*([\s\S]*?)(?=\nREQUIREMENTS:|$)/);
      const description = descMatch?.[1]?.trim() || '';

      const reqMatch = response.match(/REQUIREMENTS:\s*([\s\S]*?)(?=\nDELIVERABLES:|$)/);
      const requirements = reqMatch?.[1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim()) || [];

      const delMatch = response.match(/DELIVERABLES:\s*([\s\S]*?)(?=\nSUGGESTED_PRICE:|$)/);
      const deliverables = delMatch?.[1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim()) || [];

      const priceMatch = response.match(/SUGGESTED_PRICE:\s*(\d+)/);
      const suggestedPrice = priceMatch ? parseInt(priceMatch[1]) : 5000;

      const audienceMatch = response.match(/TARGET_AUDIENCE:\s*(.+?)(?=\n|$)/);
      const targetAudience = audienceMatch?.[1]?.trim() || 'General audience';

      const catMatch = response.match(/CATEGORIES:\s*(.+?)(?=\n|$)/);
      const categories = catMatch?.[1]?.split(',').map(c => c.trim()) || ['Marketing'];

      setGeneratedGig({
        title,
        description,
        requirements: requirements.length > 0 ? requirements : ['Professional content creation', 'Authentic brand alignment'],
        deliverables: deliverables.length > 0 ? deliverables : ['High-quality social posts', 'Content rights'],
        suggestedPrice,
        targetAudience,
        categories,
      });
    } catch (error) {
      console.error('Failed to generate gig:', error);
      Alert.alert('Error', 'Failed to generate gig. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedGig || !user) return;

    const newGig = {
      id: `gig_${Date.now()}`,
      sponsorId: user.id,
      sponsorName: user.name,
      sponsorAvatar: user.avatar,
      title: generatedGig.title,
      description: generatedGig.description,
      categories: generatedGig.categories,
      price: generatedGig.suggestedPrice,
      budget: {
        min: generatedGig.suggestedPrice,
        max: generatedGig.suggestedPrice * 1.2,
      },
      influencerTypes: generatedGig.categories,
      status: 'open' as const,
      requirements: generatedGig.requirements,
      deliverables: generatedGig.deliverables,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    addGig(newGig);
    Alert.alert('Success!', 'Your gig has been published and is now live.', [
      {
        text: 'View Gig',
        onPress: () => router.push(`/gig-details?id=${newGig.id}`),
      },
      {
        text: 'Create Another',
        onPress: () => setGeneratedGig(null),
      },
    ]);
  };

  const handleCopy = (text: string, label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Gig Generator',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <Briefcase size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Gig Generator</Text>
          <Text style={styles.headerSubtitle}>AI-powered listings</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!generatedGig ? (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 Create Perfect Gig Listings</Text>
                <Text style={styles.infoText}>
                  Our AI analyzes your campaign details and generates professional, high-converting gig listings that attract top influencers. Save hours of writing!
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Brand Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Nike, Apple, Tesla"
                  placeholderTextColor={Colors.textMuted}
                  value={brandName}
                  onChangeText={setBrandName}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Product/Service *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What are you promoting? Be specific."
                  placeholderTextColor={Colors.textMuted}
                  value={productService}
                  onChangeText={setProductService}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Target Market</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Gen Z fitness enthusiasts, Tech professionals"
                  placeholderTextColor={Colors.textMuted}
                  value={targetMarket}
                  onChangeText={setTargetMarket}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Budget Range</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., $5,000 - $10,000"
                  placeholderTextColor={Colors.textMuted}
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Campaign Goals *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What do you want to achieve? (e.g., brand awareness, product launch, sales)"
                  placeholderTextColor={Colors.textMuted}
                  value={goals}
                  onChangeText={setGoals}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.generateButtonGradient}
                >
                  {isGenerating ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate Gig Listing</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>✨ Your AI-Generated Gig</Text>
                <TouchableOpacity onPress={() => setGeneratedGig(null)} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Start Over</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.resultSection}>
                  <View style={styles.resultSectionHeader}>
                    <Text style={styles.resultSectionTitle}>Title</Text>
                    <TouchableOpacity onPress={() => handleCopy(generatedGig.title, 'title')}>
                      {copied === 'title' ? (
                        <Check size={18} color={Colors.success} />
                      ) : (
                        <Copy size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.gigTitleText}>{generatedGig.title}</Text>
                </View>

                <View style={styles.resultSection}>
                  <View style={styles.resultSectionHeader}>
                    <Text style={styles.resultSectionTitle}>Description</Text>
                    <TouchableOpacity onPress={() => handleCopy(generatedGig.description, 'description')}>
                      {copied === 'description' ? (
                        <Check size={18} color={Colors.success} />
                      ) : (
                        <Copy size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.gigText}>{generatedGig.description}</Text>
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Requirements</Text>
                  {generatedGig.requirements.map((req, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{req}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Deliverables</Text>
                  {generatedGig.deliverables.map((del, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{del}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCard}>
                    <DollarSign size={20} color={Colors.warning} />
                    <Text style={styles.metaLabel}>Suggested Price</Text>
                    <Text style={styles.metaValue}>${generatedGig.suggestedPrice.toLocaleString()}</Text>
                  </View>
                  <View style={styles.metaCard}>
                    <Users size={20} color={Colors.primary} />
                    <Text style={styles.metaLabel}>Target Audience</Text>
                    <Text style={styles.metaValue} numberOfLines={2}>{generatedGig.targetAudience}</Text>
                  </View>
                </View>

                <View style={styles.categoriesSection}>
                  <Text style={styles.resultSectionTitle}>Categories</Text>
                  <View style={styles.categoriesContainer}>
                    {generatedGig.categories.map((cat, idx) => (
                      <View key={idx} style={styles.categoryBadge}>
                        <Tag size={12} color={Colors.primary} />
                        <Text style={styles.categoryText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
                <LinearGradient
                  colors={[Colors.success, '#10b981']}
                  style={styles.publishButtonGradient}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.publishButtonText}>Publish This Gig</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.regenerateButton} onPress={handleGenerate} disabled={isGenerating}>
                <Sparkles size={20} color={Colors.primary} />
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
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
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
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
    borderWidth: 1,
    borderColor: Colors.darkCard,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.darkCard,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  resultCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  resultSection: {
    gap: 12,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  gigTitleText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 26,
  },
  gigText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  categoriesSection: {
    gap: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  publishButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  publishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
    marginTop: 12,
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
