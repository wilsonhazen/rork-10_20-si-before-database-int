import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useInvites } from '@/contexts/InviteContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Zap,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Clock,
  Percent,
  Star,
  Send,
  ChevronRight,
  ArrowUp,
  Activity,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

type TimeRange = '7d' | '30d' | '90d' | 'all';
type ABTestStatus = 'planning' | 'running' | 'completed';

export default function ReferralAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    getTemplatePerformance,
    getReferralFunnel,
    getContactPerformance,
    getReferralInsights,
    templates,
  } = useInvites();

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [abTestStatus] = useState<ABTestStatus>('planning');

  const getTimeRangeDates = (range: TimeRange) => {
    const end = new Date().toISOString();
    let start: string;
    
    switch (range) {
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        start = new Date(0).toISOString();
    }
    
    return { start, end };
  };

  const timeRangeDates = getTimeRangeDates(selectedTimeRange);
  const templatePerformance = user && user.role === 'agent' ? getTemplatePerformance(user.id) : [];
  const referralFunnel = user && user.role === 'agent' ? getReferralFunnel(user.id, timeRangeDates) : {
    agentId: '',
    stages: [],
    overallConversionRate: 0,
    totalContacted: 0,
    totalVerified: 0,
    timeRange: timeRangeDates,
  };
  const contactPerformance = user && user.role === 'agent' ? getContactPerformance(user.id) : [];
  const insights = user && user.role === 'agent' ? getReferralInsights(user.id) : {
    bestPerformingTemplate: {
      templateId: '',
      templateName: 'N/A',
      sent: 0,
      accepted: 0,
      verified: 0,
      conversionRate: 0,
      contactsReached: 0,
    },
    worstPerformingTemplate: {
      templateId: '',
      templateName: 'N/A',
      sent: 0,
      accepted: 0,
      verified: 0,
      conversionRate: 0,
      contactsReached: 0,
    },
    bestPerformingContacts: [],
    avgTimeToConversion: 0,
    peakSendingTimes: [],
    recommendedActions: [],
  };

  const sortedTemplates = useMemo(() => {
    return [...templatePerformance].sort((a, b) => b.conversionRate - a.conversionRate);
  }, [templatePerformance]);

  const topPerformers = useMemo(() => {
    return contactPerformance.slice(0, 5);
  }, [contactPerformance]);

  const abTestPairs = useMemo(() => {
    if (templates.length < 2) return [];
    
    const pairs = [];
    for (let i = 0; i < templates.length - 1; i += 2) {
      const templateA = templatePerformance.find(t => t.templateId === templates[i].id);
      const templateB = templatePerformance.find(t => t.templateId === templates[i + 1].id);
      
      if (templateA && templateB && (templateA.sent > 0 || templateB.sent > 0)) {
        const winner = templateA.conversionRate > templateB.conversionRate ? 'A' : 
                      templateB.conversionRate > templateA.conversionRate ? 'B' : 'tie';
        
        pairs.push({
          id: `test_${i}`,
          templateA,
          templateB,
          winner,
          confidenceLevel: Math.min(
            ((templateA.sent + templateB.sent) / 100) * 100,
            95
          ),
        });
      }
    }
    return pairs;
  }, [templates, templatePerformance]);

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const funnelData = referralFunnel.stages.map(stage => ({
    stage: stage.stage,
    count: stage.count,
    percentage: stage.percentage,
    dropoff: stage.dropoffFromPrevious || 0,
  }));

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            selectedTimeRange === range && styles.timeRangeButtonActive,
          ]}
          onPress={() => setSelectedTimeRange(range)}
        >
          <Text
            style={[
              styles.timeRangeText,
              selectedTimeRange === range && styles.timeRangeTextActive,
            ]}
          >
            {range === 'all' ? 'All Time' : range.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewStats = () => {
    const avgConversionTime = insights.avgTimeToConversion;
    const bestTemplate = insights.bestPerformingTemplate;
    const topContact = topPerformers[0];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <Target size={20} color={colors.primary} />
              </View>
              <Text style={styles.statLabel}>Conversion Rate</Text>
            </View>
            <Text style={styles.statValue}>
              {referralFunnel.overallConversionRate.toFixed(1)}%
            </Text>
            <View style={styles.statTrend}>
              <TrendingUp size={16} color={colors.success} />
              <Text style={styles.statTrendText}>+5.2% vs last period</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <Clock size={20} color={colors.accent} />
              </View>
              <Text style={styles.statLabel}>Avg. Conversion Time</Text>
            </View>
            <Text style={styles.statValue}>
              {avgConversionTime.toFixed(1)} days
            </Text>
            <View style={styles.statTrend}>
              <TrendingDown size={16} color={colors.success} />
              <Text style={styles.statTrendText}>-2.1 days faster</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <MessageSquare size={20} color={colors.warning} />
              </View>
              <Text style={styles.statLabel}>Best Template</Text>
            </View>
            <Text style={styles.statValueSmall} numberOfLines={1}>
              {bestTemplate.templateName}
            </Text>
            <View style={styles.statTrend}>
              <Star size={16} color={colors.warning} />
              <Text style={styles.statTrendText}>
                {bestTemplate.conversionRate.toFixed(1)}% rate
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <Award size={20} color={colors.success} />
              </View>
              <Text style={styles.statLabel}>Top Contact</Text>
            </View>
            <Text style={styles.statValueSmall} numberOfLines={1}>
              {topContact?.contactName || 'N/A'}
            </Text>
            <View style={styles.statTrend}>
              <Zap size={16} color={colors.success} />
              <Text style={styles.statTrendText}>
                Score: {topContact?.engagementScore || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderConversionFunnel = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Referral Funnel</Text>
        <Text style={styles.sectionSubtitle}>
          {referralFunnel.totalContacted} contacts tracked
        </Text>
      </View>

      <View style={styles.funnelContainer}>
        {funnelData.map((stage, index) => {
          const width_percentage = Math.max(stage.percentage, 10);
          
          return (
            <View key={stage.stage} style={styles.funnelStage}>
              <View style={styles.funnelStageInfo}>
                <Text style={styles.funnelStageLabel}>
                  {stage.stage.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.funnelStageCount}>{stage.count}</Text>
              </View>
              
              <View style={styles.funnelBarContainer}>
                <View
                  style={[
                    styles.funnelBar,
                    {
                      width: `${width_percentage}%`,
                      backgroundColor:
                        index === 0 ? colors.primary :
                        index === 1 ? colors.accent :
                        index === 2 ? colors.success :
                        colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.funnelBarText}>
                    {stage.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              {stage.dropoff > 0 && (
                <Text style={styles.funnelDropoff}>
                  -{stage.dropoff} dropoff
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderTemplatePerformance = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Template Performance</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {}}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.templateList}>
        {sortedTemplates.slice(0, 5).map((template, index) => {
          const isTopPerformer = index === 0;
          const conversionTrend = template.conversionRate > 0 ? 'up' : 'neutral';

          return (
            <View key={template.templateId} style={styles.templateCard}>
              <View style={styles.templateHeader}>
                <View style={styles.templateRank}>
                  <Text style={styles.templateRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.templateName}</Text>
                  {isTopPerformer && (
                    <View style={styles.topPerformerBadge}>
                      <Star size={12} color={colors.warning} />
                      <Text style={styles.topPerformerText}>Top Performer</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.templateMetrics}>
                <View style={styles.templateMetric}>
                  <Send size={14} color={colors.textSecondary} />
                  <Text style={styles.templateMetricLabel}>Sent</Text>
                  <Text style={styles.templateMetricValue}>{template.sent}</Text>
                </View>
                
                <View style={styles.templateMetric}>
                  <CheckCircle2 size={14} color={colors.success} />
                  <Text style={styles.templateMetricLabel}>Accepted</Text>
                  <Text style={styles.templateMetricValue}>{template.accepted}</Text>
                </View>

                <View style={styles.templateMetric}>
                  <Percent size={14} color={colors.primary} />
                  <Text style={styles.templateMetricLabel}>Rate</Text>
                  <View style={styles.templateMetricTrend}>
                    <Text style={styles.templateMetricValue}>
                      {template.conversionRate.toFixed(1)}%
                    </Text>
                    {conversionTrend === 'up' && (
                      <ArrowUp size={12} color={colors.success} />
                    )}
                  </View>
                </View>
              </View>

              {template.avgTimeToAccept && (
                <View style={styles.templateFooter}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={styles.templateFooterText}>
                    Avg. {template.avgTimeToAccept.toFixed(1)}h to accept
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderABTesting = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>A/B Test Results</Text>
        <View style={styles.abTestStatusContainer}>
          <View
            style={[
              styles.abTestStatusDot,
              abTestStatus === 'running' && styles.abTestStatusDotActive,
            ]}
          />
          <Text style={styles.abTestStatusText}>
            {abTestStatus === 'planning' ? 'Ready to Test' :
             abTestStatus === 'running' ? 'Tests Running' :
             'Tests Completed'}
          </Text>
        </View>
      </View>

      {abTestPairs.length === 0 ? (
        <View style={styles.emptyState}>
          <BarChart3 size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No A/B tests yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create multiple templates to start testing
          </Text>
        </View>
      ) : (
        <View style={styles.abTestList}>
          {abTestPairs.map((test) => (
            <View key={test.id} style={styles.abTestCard}>
              <View style={styles.abTestHeader}>
                <Text style={styles.abTestTitle}>Message Comparison</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {test.confidenceLevel.toFixed(0)}% confidence
                  </Text>
                </View>
              </View>

              <View style={styles.abTestComparison}>
                <View style={[
                  styles.abTestVariant,
                  test.winner === 'A' && styles.abTestVariantWinner,
                ]}>
                  <View style={styles.abTestVariantHeader}>
                    <Text style={styles.abTestVariantLabel}>Variant A</Text>
                    {test.winner === 'A' && (
                      <View style={styles.winnerBadge}>
                        <Award size={12} color={colors.success} />
                        <Text style={styles.winnerText}>Winner</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.abTestVariantName} numberOfLines={1}>
                    {test.templateA.templateName}
                  </Text>
                  <Text style={styles.abTestVariantRate}>
                    {test.templateA.conversionRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.abTestVariantSent}>
                    {test.templateA.sent} sent
                  </Text>
                </View>

                <View style={styles.abTestVs}>
                  <Text style={styles.abTestVsText}>VS</Text>
                </View>

                <View style={[
                  styles.abTestVariant,
                  test.winner === 'B' && styles.abTestVariantWinner,
                ]}>
                  <View style={styles.abTestVariantHeader}>
                    <Text style={styles.abTestVariantLabel}>Variant B</Text>
                    {test.winner === 'B' && (
                      <View style={styles.winnerBadge}>
                        <Award size={12} color={colors.success} />
                        <Text style={styles.winnerText}>Winner</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.abTestVariantName} numberOfLines={1}>
                    {test.templateB.templateName}
                  </Text>
                  <Text style={styles.abTestVariantRate}>
                    {test.templateB.conversionRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.abTestVariantSent}>
                    {test.templateB.sent} sent
                  </Text>
                </View>
              </View>

              <View style={styles.abTestInsight}>
                <Activity size={14} color={colors.accent} />
                <Text style={styles.abTestInsightText}>
                  {test.winner === 'tie'
                    ? 'Performance is similar - continue testing'
                    : `Variant ${test.winner} performs ${Math.abs(
                        test.templateA.conversionRate - test.templateB.conversionRate
                      ).toFixed(1)}% better`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderTopContacts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best Performing Contacts</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {}}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {topPerformers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No contact data yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Send invites to track contact performance
          </Text>
        </View>
      ) : (
        <View style={styles.contactList}>
          {topPerformers.map((contact, index) => (
            <View key={contact.contactId} style={styles.contactCard}>
              <View style={styles.contactRank}>
                <Text style={styles.contactRankText}>#{index + 1}</Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.contactName}</Text>
                {contact.contactEmail && (
                  <Text style={styles.contactEmail}>{contact.contactEmail}</Text>
                )}
              </View>

              <View style={styles.contactMetrics}>
                <View style={styles.contactScore}>
                  <Zap size={16} color={colors.warning} />
                  <Text style={styles.contactScoreValue}>
                    {contact.engagementScore}
                  </Text>
                </View>

                {contact.daysToConversion && (
                  <View style={styles.contactStat}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={styles.contactStatText}>
                      {contact.daysToConversion.toFixed(0)}d
                    </Text>
                  </View>
                )}

                {contact.acceptanceStatus === 'accepted' && (
                  <View style={styles.contactStatusBadge}>
                    <CheckCircle2 size={12} color={colors.success} />
                    <Text style={styles.contactStatusText}>Converted</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended Actions</Text>
      
      <View style={styles.insightsList}>
        {insights.recommendedActions.map((action, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Target size={20} color={colors.primary} />
            </View>
            <Text style={styles.insightText}>{action}</Text>
          </View>
        ))}

        {insights.recommendedActions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Keep sending invites to unlock insights
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Referral Analytics',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderTimeRangeSelector()}
        {renderOverviewStats()}
        {renderConversionFunnel()}
        {renderTemplatePerformance()}
        {renderABTesting()}
        {renderTopContacts()}
        {renderInsights()}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  timeRangeTextActive: {
    color: '#FFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 11,
    color: colors.success,
  },
  funnelContainer: {
    gap: 16,
  },
  funnelStage: {
    gap: 8,
  },
  funnelStageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  funnelStageLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  funnelStageCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  funnelBarContainer: {
    height: 40,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  funnelBarText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  funnelDropoff: {
    fontSize: 11,
    color: colors.error,
    fontStyle: 'italic' as const,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  templateList: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  templateRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  topPerformerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topPerformerText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600' as const,
  },
  templateMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  templateMetric: {
    flex: 1,
    gap: 4,
  },
  templateMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  templateMetricValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  templateMetricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  templateFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  abTestStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  abTestStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  abTestStatusDotActive: {
    backgroundColor: colors.success,
  },
  abTestStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  abTestList: {
    gap: 16,
  },
  abTestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  abTestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  abTestTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  confidenceBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  abTestComparison: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  abTestVariant: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  abTestVariantWinner: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}05`,
  },
  abTestVariantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  abTestVariantLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.success,
  },
  abTestVariantName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  abTestVariantRate: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 2,
  },
  abTestVariantSent: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  abTestVs: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  abTestVsText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  abTestInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  abTestInsightText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  contactList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  contactRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contactScoreValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.warning,
  },
  contactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactStatText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  contactStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.success,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
