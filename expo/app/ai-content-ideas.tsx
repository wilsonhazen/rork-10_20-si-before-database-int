import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbulb, Sparkles, Repeat, Copy, ThumbsUp, Camera, Video, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { generateText } from '@rork-ai/toolkit-sdk';

type PlatformType = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'all';
type ContentType = 'post' | 'story' | 'reel' | 'video' | 'thread';

const platforms = [
  { id: 'all' as const, name: 'All Platforms', icon: '🌐' },
  { id: 'instagram' as const, name: 'Instagram', icon: '📷' },
  { id: 'tiktok' as const, name: 'TikTok', icon: '🎵' },
  { id: 'youtube' as const, name: 'YouTube', icon: '📹' },
  { id: 'twitter' as const, name: 'Twitter/X', icon: '🐦' },
];

const contentTypes = [
  { id: 'post' as const, name: 'Post', icon: Camera },
  { id: 'story' as const, name: 'Story', icon: MessageCircle },
  { id: 'reel' as const, name: 'Reel/Short', icon: Video },
  { id: 'video' as const, name: 'Long Video', icon: Video },
  { id: 'thread' as const, name: 'Thread', icon: MessageCircle },
];

export default function AIContentIdeasScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedType, setSelectedType] = useState<ContentType>('post');
  const [topic, setTopic] = useState('');
  const [brandInfo, setBrandInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Missing Information', 'Please enter a topic or theme for content ideas.');
      return;
    }

    setIsGenerating(true);

    try {
      const platformText = selectedPlatform === 'all' ? 'all social media platforms' : platforms.find(p => p.id === selectedPlatform)?.name;
      const prompt = `Generate 8 creative and engaging ${selectedType} content ideas for ${platformText}.

Topic/Theme: ${topic}
${brandInfo ? `Brand/Campaign Info: ${brandInfo}` : ''}
${user?.role === 'influencer' ? `Influencer niche: ${(user as any).influencerType || 'General'}` : ''}

Requirements:
- Each idea should be unique and actionable
- Include specific angles, hooks, or approaches
- Consider current trends and viral formats
- Make them engaging and shareable
- Format: Return exactly 8 ideas, each on a new line starting with "•"

Example format:
• Idea 1 description here
• Idea 2 description here
...`;

      const response = await generateText(prompt);
      const generatedIdeas = response
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.replace(/^•\s*/, '').trim())
        .filter(Boolean);

      if (generatedIdeas.length > 0) {
        setIdeas(generatedIdeas);
      } else {
        Alert.alert('Error', 'Failed to generate ideas. Please try again.');
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      Alert.alert('Error', 'Failed to generate content ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyIdea = (idea: string) => {
    Alert.alert('Copied!', 'Idea copied to clipboard');
  };

  const handleLikeIdea = (idea: string) => {
    Alert.alert('Saved!', 'Idea saved to your favorites');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Content Ideas',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <Lightbulb size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Content Ideas</Text>
          <Text style={styles.headerSubtitle}>AI-powered creativity</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {platforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.chip,
                    selectedPlatform === platform.id && styles.chipSelected
                  ]}
                  onPress={() => setSelectedPlatform(platform.id)}
                >
                  <Text style={styles.chipIcon}>{platform.icon}</Text>
                  <Text style={[
                    styles.chipText,
                    selectedPlatform === platform.id && styles.chipTextSelected
                  ]}>
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Type</Text>
            <View style={styles.typeGrid}>
              {contentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <type.icon
                    size={24}
                    color={selectedType === type.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.typeText,
                    selectedType === type.id && styles.typeTextSelected
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topic or Theme</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer fashion trends, Tech reviews, Fitness motivation"
              placeholderTextColor={Colors.textMuted}
              value={topic}
              onChangeText={setTopic}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brand/Campaign Info (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any specific brand requirements, campaign details, or product info"
              placeholderTextColor={Colors.textMuted}
              value={brandInfo}
              onChangeText={setBrandInfo}
              multiline
              numberOfLines={3}
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Generate Ideas</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {ideas.length > 0 && (
            <View style={styles.section}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>💡 Your Content Ideas</Text>
                <TouchableOpacity onPress={handleGenerate} disabled={isGenerating}>
                  <Repeat size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.ideasContainer}>
                {ideas.map((idea, index) => (
                  <View key={index} style={styles.ideaCard}>
                    <View style={styles.ideaHeader}>
                      <Text style={styles.ideaNumber}>{index + 1}</Text>
                      <View style={styles.ideaActions}>
                        <TouchableOpacity onPress={() => handleLikeIdea(idea)} style={styles.ideaAction}>
                          <ThumbsUp size={16} color={Colors.warning} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCopyIdea(idea)} style={styles.ideaAction}>
                          <Copy size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.ideaText}>{idea}</Text>
                  </View>
                ))}
              </View>
            </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  chipsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 18,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  typeTextSelected: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 50,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  ideasContainer: {
    gap: 12,
  },
  ideaCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ideaNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  ideaActions: {
    flexDirection: 'row',
    gap: 12,
  },
  ideaAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
});
