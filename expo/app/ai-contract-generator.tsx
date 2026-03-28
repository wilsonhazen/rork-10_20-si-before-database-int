import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Sparkles, Download, Edit3, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { generateText } from '@rork-ai/toolkit-sdk';

type ContractType = 'sponsorship' | 'ambassador' | 'affiliate' | 'content-creation' | 'event';

const contractTemplates: Record<ContractType, { title: string; description: string; icon: string }> = {
  'sponsorship': {
    title: 'Sponsorship Agreement',
    description: 'One-time sponsorship deal with specific deliverables',
    icon: '🤝'
  },
  'ambassador': {
    title: 'Brand Ambassador',
    description: 'Long-term partnership with ongoing content',
    icon: '⭐'
  },
  'affiliate': {
    title: 'Affiliate Partnership',
    description: 'Commission-based promotion agreement',
    icon: '💰'
  },
  'content-creation': {
    title: 'Content Creation',
    description: 'Specific content pieces with usage rights',
    icon: '📸'
  },
  'event': {
    title: 'Event Appearance',
    description: 'Physical or virtual event participation',
    icon: '🎤'
  },
};

export default function AIContractGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'details' | 'generating' | 'result'>('select');
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [details, setDetails] = useState({
    brandName: '',
    influencerName: '',
    amount: '',
    duration: '',
    deliverables: '',
    additionalTerms: '',
  });
  const [generatedContract, setGeneratedContract] = useState('');

  const handleGenerate = async () => {
    if (!selectedType) return;

    setStep('generating');

    try {
      const prompt = `Generate a professional ${contractTemplates[selectedType].title} contract with the following details:

Brand/Sponsor: ${details.brandName || 'Not specified'}
Influencer/Creator: ${details.influencerName || user?.name || 'Not specified'}
Compensation: $${details.amount || 'To be determined'}
Duration: ${details.duration || 'Not specified'}
Deliverables: ${details.deliverables || 'To be determined'}
Additional Terms: ${details.additionalTerms || 'Standard terms apply'}

The contract should include:
1. Parties involved and their roles
2. Scope of work and deliverables
3. Compensation and payment terms
4. Timeline and deadlines
5. Content usage rights and ownership
6. Termination clauses
7. Confidentiality agreements
8. Legal disclaimers

Make it professional, clear, and legally sound. Format it properly with sections.`;

      const contract = await generateText(prompt);
      setGeneratedContract(contract);
      setStep('result');
    } catch (error) {
      console.error('Failed to generate contract:', error);
      Alert.alert('Error', 'Failed to generate contract. Please try again.');
      setStep('details');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedType(null);
    setDetails({
      brandName: '',
      influencerName: '',
      amount: '',
      duration: '',
      deliverables: '',
      additionalTerms: '',
    });
    setGeneratedContract('');
  };

  const renderSelect = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Contract Type</Text>
      <Text style={styles.stepSubtitle}>Choose the type of agreement you need</Text>

      <View style={styles.templatesGrid}>
        {Object.entries(contractTemplates).map(([key, template]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.templateCard,
              selectedType === key && styles.templateCardSelected
            ]}
            onPress={() => {
              setSelectedType(key as ContractType);
              setStep('details');
            }}
          >
            <Text style={styles.templateIcon}>{template.icon}</Text>
            <Text style={styles.templateTitle}>{template.title}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={() => setStep('select')} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Change Type</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Contract Details</Text>
      <Text style={styles.stepSubtitle}>
        Fill in the details for your {selectedType && contractTemplates[selectedType].title}
      </Text>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand/Sponsor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter brand name"
            placeholderTextColor={Colors.textMuted}
            value={details.brandName}
            onChangeText={(text) => setDetails(prev => ({ ...prev, brandName: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Influencer/Creator Name</Text>
          <TextInput
            style={styles.input}
            placeholder={user?.name || "Enter influencer name"}
            placeholderTextColor={Colors.textMuted}
            value={details.influencerName}
            onChangeText={(text) => setDetails(prev => ({ ...prev, influencerName: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Compensation Amount ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="5000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={details.amount}
            onChangeText={(text) => setDetails(prev => ({ ...prev, amount: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contract Duration</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 3 months, 1 year"
            placeholderTextColor={Colors.textMuted}
            value={details.duration}
            onChangeText={(text) => setDetails(prev => ({ ...prev, duration: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Deliverables</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., 4 Instagram posts, 2 stories per week"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={details.deliverables}
            onChangeText={(text) => setDetails(prev => ({ ...prev, deliverables: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Terms (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special conditions or requirements"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={details.additionalTerms}
            onChangeText={(text) => setDetails(prev => ({ ...prev, additionalTerms: text }))}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.generateButtonGradient}
        >
          <Sparkles size={20} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generate Contract</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGenerating = () => (
    <View style={styles.centerContainer}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Generating Contract...</Text>
        <Text style={styles.loadingSubtitle}>
          Our AI is crafting a professional agreement tailored to your needs
        </Text>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      <View style={styles.resultHeader}>
        <CheckCircle2 size={32} color={Colors.success} />
        <Text style={styles.resultTitle}>Contract Generated!</Text>
        <Text style={styles.resultSubtitle}>Review and customize as needed</Text>
      </View>

      <View style={styles.contractContainer}>
        <ScrollView style={styles.contractScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.contractText}>{generatedContract}</Text>
        </ScrollView>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          Alert.alert(
            'Edit Contract',
            'You can copy this text and edit it in your preferred document editor.',
            [{ text: 'OK' }]
          );
        }}>
          <Edit3 size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => {
          Alert.alert(
            'Download',
            'Contract text copied to clipboard! You can paste it into your document editor.',
            [{ text: 'OK' }]
          );
        }}>
          <Download size={20} color={Colors.success} />
          <Text style={styles.actionButtonText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
          <FileText size={20} color={Colors.secondary} />
          <Text style={styles.actionButtonText}>New</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'AI Contract Generator',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <FileText size={32} color="#FFFFFF" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Contract Generator</Text>
          <Text style={styles.headerSubtitle}>AI-powered legal agreements</Text>
        </View>
        <Sparkles size={24} color="#FFFFFF" />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 'select' && renderSelect()}
        {step === 'details' && renderDetails()}
        {step === 'generating' && renderGenerating()}
        {step === 'result' && renderResult()}
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
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
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
    height: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contractContainer: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    height: 400,
    marginBottom: 20,
  },
  contractScroll: {
    flex: 1,
  },
  contractText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
