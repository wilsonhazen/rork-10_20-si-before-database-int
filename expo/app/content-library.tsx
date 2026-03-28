import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { FileText, Image as ImageIcon, Award, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useContentLibrary } from '@/contexts/ContentLibraryContext';
import Colors from '@/constants/colors';

export default function ContentLibraryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAssetsByUser, getMediaKitsByUser, getCaseStudiesByUser } = useContentLibrary();
  
  const userAssets = user ? getAssetsByUser(user.id) : [];
  const userKits = user ? getMediaKitsByUser(user.id) : [];
  const userCaseStudies = user ? getCaseStudiesByUser(user.id) : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Content Library' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.createCard}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.createGradient}>
            <Sparkles size={28} color="#FFFFFF" />
            <View style={styles.createContent}>
              <Text style={styles.createTitle}>Generate Media Kit</Text>
              <Text style={styles.createDescription}>Auto-create a professional PDF</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Media ({userAssets.length})</Text>
          </View>
          
          {userAssets.length === 0 ? (
            <Text style={styles.emptyText}>No media assets yet</Text>
          ) : (
            <View style={styles.assetsGrid}>
              {userAssets.slice(0, 6).map((asset) => (
                <View key={asset.id} style={styles.assetCard}>
                  <ImageIcon size={24} color={Colors.primary} />
                  <Text style={styles.assetTitle} numberOfLines={1}>{asset.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Media Kits ({userKits.length})</Text>
          </View>
          
          {userKits.length === 0 ? (
            <Text style={styles.emptyText}>No media kits yet</Text>
          ) : (
            userKits.map((kit) => (
              <View key={kit.id} style={styles.kitCard}>
                <Text style={styles.kitTitle}>{kit.title}</Text>
                <Text style={styles.kitDescription}>{kit.description}</Text>
                <Text style={styles.kitSections}>{kit.sections.length} sections</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Case Studies ({userCaseStudies.length})</Text>
          </View>
          
          {userCaseStudies.length === 0 ? (
            <Text style={styles.emptyText}>No case studies yet</Text>
          ) : (
            userCaseStudies.map((study) => (
              <View key={study.id} style={styles.caseCard}>
                <Text style={styles.caseTitle}>{study.title}</Text>
                <Text style={styles.caseDescription} numberOfLines={2}>{study.description}</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Impact</Text>
                    <Text style={styles.metricValue}>+{Object.values(study.metrics.improvement)[0]}%</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  createCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  createGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  createContent: { flex: 1 },
  createTitle: { fontSize: 18, fontWeight: '700' as const, color: '#FFFFFF', marginBottom: 4 },
  createDescription: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' as const },
  assetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  assetCard: { width: '31%', padding: 16, backgroundColor: Colors.darkCard, borderRadius: 12, alignItems: 'center', gap: 8 },
  assetTitle: { fontSize: 12, fontWeight: '600' as const, color: Colors.text, textAlign: 'center' as const },
  kitCard: { padding: 16, backgroundColor: Colors.darkCard, borderRadius: 12, marginBottom: 12 },
  kitTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
  kitDescription: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  kitSections: { fontSize: 11, color: Colors.textMuted },
  caseCard: { padding: 16, backgroundColor: Colors.darkCard, borderRadius: 12, marginBottom: 12 },
  caseTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
  caseDescription: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricBox: { flex: 1, backgroundColor: Colors.success + '20', padding: 12, borderRadius: 8, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.success },
});
