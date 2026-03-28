import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { TrendingUp, Users, Clock } from 'lucide-react-native';

import { useAnalytics } from '@/contexts/AnalyticsContext';
import Colors from '@/constants/colors';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  const {
    engagementTrends,
    followerGrowth,

    isLoading,
    getBestPerformingContent,
    getOptimalPostingTimes,
  } = useAnalytics();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Analytics' }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const bestContent = getBestPerformingContent();
  const optimalTimes = getOptimalPostingTimes();
  const currentEngagement = engagementTrends[engagementTrends.length - 1]?.value || 0;
  const currentFollowers = followerGrowth[followerGrowth.length - 1]?.value || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Analytics Dashboard' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.statGradient}>
              <TrendingUp size={24} color="#FFF" />
              <Text style={styles.statValue}>{currentEngagement.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Engagement</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient colors={[Colors.secondary, Colors.primary]} style={styles.statGradient}>
              <Users size={24} color="#FFF" />
              <Text style={styles.statValue}>{(currentFollowers / 1000).toFixed(0)}K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Content</Text>
          {bestContent.slice(0, 3).map((content, index) => (
            <View key={content.id} style={styles.contentCard}>
              <View style={styles.contentRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{content.title}</Text>
                <Text style={styles.contentMeta}>
                  {(content.views / 1000).toFixed(0)}K views • {content.engagementRate.toFixed(1)}% engagement
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Times to Post</Text>
          {optimalTimes.slice(0, 3).map((time, index) => (
            <View key={`${time.dayOfWeek}-${time.hour}`} style={styles.timeCard}>
              <Clock size={20} color={Colors.primary} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeDay}>{time.dayOfWeek}</Text>
                <Text style={styles.timeHour}>
                  {time.hour > 12 ? `${time.hour - 12}:00 PM` : `${time.hour}:00 AM`}
                </Text>
              </View>
              <Text style={styles.timeEngagement}>{time.averageEngagement.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  loadingText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' as const, marginTop: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', height: 120 },
  statGradient: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  statValue: { fontSize: 28, fontWeight: '700' as const, color: '#FFF' },
  statLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  contentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.darkCard, borderRadius: 12, marginBottom: 10 },
  contentRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  contentInfo: { flex: 1 },
  contentTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
  contentMeta: { fontSize: 12, color: Colors.textSecondary },
  timeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: Colors.darkCard, borderRadius: 12, marginBottom: 10 },
  timeInfo: { flex: 1 },
  timeDay: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  timeHour: { fontSize: 12, color: Colors.textSecondary },
  timeEngagement: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
});
