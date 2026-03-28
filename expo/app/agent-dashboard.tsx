import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, Alert, Linking, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useData } from '@/contexts/DataContext';
import { useAgentVerification } from '@/contexts/AgentVerificationContext';
import { useGamification } from '@/contexts/GamificationContext';
import { DollarSign, Users, TrendingUp, Copy, Share2, UserPlus, Send, MessageCircle, Mail, Facebook, Twitter, Linkedin, QrCode, Download, Sparkles, Shield, Award, Trophy } from 'lucide-react-native';
import colors from '@/constants/colors';
import * as Clipboard from 'expo-clipboard';

export default function AgentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, generateReferralCode } = useAuth();
  const { getUserBalance, getAgentReferrals, transactions } = usePayment();
  const { users, conversations, addConversation } = useData();
  const { getVerification } = useAgentVerification();
  const { getAgentBadge, getAchievements, getTopEarners, checkAndUnlockAchievements } = useGamification();
  const [referralLink, setReferralLink] = useState('');

  React.useEffect(() => {
    if (user && user.role === 'agent') {
      checkAndUnlockAchievements(user.id);
    }
  }, [user, checkAndUnlockAchievements]);

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const balance = getUserBalance(user.id);
  const referrals = getAgentReferrals(user.id);
  const agentTransactions = transactions.filter(t => 
    t.type === 'agent_commission' && t.toUser === user.id
  );

  const agentBadge = getAgentBadge(user.id);
  const achievements = getAchievements(user.id);
  const completedAchievements = achievements.filter(a => a.isCompleted).length;
  const topEarners = getTopEarners('month');
  const myRank = topEarners.findIndex(e => e.agentId === user.id) + 1;

  const totalCommissions = agentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const sponsorRecruits = referrals.filter(r => r.recruitedUserType === 'sponsor').length;
  const influencerRecruits = referrals.filter(r => r.recruitedUserType === 'influencer').length;

  const handleGenerateLink = async () => {
    let code = user.referralCode;
    if (!code) {
      code = await generateReferralCode();
    }
    const link = `https://famematch.app/ref/${code}`;
    setReferralLink(link);
  };

  const handleCopyLink = async () => {
    if (referralLink) {
      await Share.share({
        message: `Join FameMatch using my referral link: ${referralLink}`,
      });
    } else {
      Alert.alert('Generate Link', 'Please generate a referral link first');
    }
  };

  const handleShareLink = async () => {
    if (referralLink) {
      await Share.share({
        message: `Join FameMatch and connect with top brands and influencers! Use my referral link: ${referralLink}`,
        title: 'Join FameMatch',
      });
    } else {
      Alert.alert('Generate Link', 'Please generate a referral link first');
    }
  };

  const handleCopyToClipboard = async () => {
    if (referralLink) {
      await Clipboard.setStringAsync(referralLink);
      Alert.alert('Copied!', 'Referral link copied to clipboard');
    } else {
      Alert.alert('Generate Link', 'Please generate a referral link first');
    }
  };

  const handleShareViaWhatsApp = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const message = encodeURIComponent(`Join FameMatch and connect with top brands and influencers! Use my referral link: ${referralLink}`);
    const url = `whatsapp://send?text=${message}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          const webUrl = `https://wa.me/?text=${message}`;
          await Linking.openURL(webUrl);
        } else {
          Alert.alert(
            'WhatsApp Not Available', 
            'WhatsApp is not installed on this device. You can share via SMS or other platforms instead.',
            [
              { text: 'OK', style: 'cancel' },
              { text: 'Share via SMS', onPress: handleShareViaSMS }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'Unable to Open WhatsApp',
        Platform.OS === 'ios' 
          ? 'WhatsApp sharing requires app configuration. Please use SMS, Email, or other sharing options instead.'
          : 'Unable to open WhatsApp. Please try another sharing method.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Share Another Way', onPress: handleShareLink }
        ]
      );
    }
  };

  const handleShareViaSMS = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const message = encodeURIComponent(`Join FameMatch! Use my referral link: ${referralLink}`);
    const url = Platform.OS === 'ios' ? `sms:&body=${message}` : `sms:?body=${message}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening SMS:', error);
    }
  };

  const handleShareViaEmail = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const subject = encodeURIComponent('Join FameMatch - Connect with Top Brands & Influencers');
    const body = encodeURIComponent(`Hi,\n\nI wanted to personally invite you to join FameMatch, the premier platform connecting brands with influencers.\n\nUse my referral link to get started: ${referralLink}\n\nBenefits:\n• Direct access to verified brands and influencers\n• Secure payment processing\n• Real-time deal tracking\n• Exclusive rewards program\n\nLooking forward to seeing you on the platform!\n\nBest regards,\n${user.name}`);
    const url = `mailto:?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const handleShareViaFacebook = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Facebook:', error);
    }
  };

  const handleShareViaTwitter = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const text = encodeURIComponent(`Join FameMatch and connect with top brands and influencers! ${referralLink}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Twitter:', error);
    }
  };

  const handleShareViaLinkedIn = async () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening LinkedIn:', error);
    }
  };

  const handleGenerateQRCode = () => {
    if (!referralLink) {
      Alert.alert('Generate Link', 'Please generate a referral link first');
      return;
    }
    Alert.alert(
      'QR Code',
      'QR Code generation will open in a new screen where you can download and share it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;
            Linking.openURL(qrUrl);
          }
        },
      ]
    );
  };

  const handleDownloadMarketingKit = () => {
    Alert.alert(
      'Marketing Kit',
      'Download pre-made graphics, banners, and templates to promote FameMatch on your social media.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            Alert.alert('Coming Soon', 'Marketing kit download will be available soon!');
          }
        },
      ]
    );
  };

  const handleAutoPostScheduler = () => {
    Alert.alert(
      'Auto-Post Scheduler',
      'Schedule automatic posts to your social media accounts to promote your referral link.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Up', 
          onPress: () => {
            Alert.alert('Coming Soon', 'Auto-post scheduler will be available soon!');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Agent Dashboard',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>${balance?.availableBalance.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Available Balance</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>${totalCommissions.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Commissions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Users size={24} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Total Recruits</Text>
          </View>
        </View>

        {user.stripeVerificationStatus !== 'verified' && (
          <TouchableOpacity 
            style={styles.verificationBanner}
            onPress={() => router.push('/agent-stripe-verification')}
          >
            <Shield size={24} color={colors.warning} />
            <View style={styles.verificationBannerContent}>
              <Text style={styles.verificationBannerTitle}>Stripe Verification Required</Text>
              <Text style={styles.verificationBannerText}>
                Complete verification to receive commission payouts
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {(() => {
          const verification = getVerification(user.id);
          if (verification.level !== 'fully_verified') {
            return (
              <TouchableOpacity 
                style={styles.verificationBanner}
                onPress={() => router.push('/agent-verification')}
              >
                <Award size={24} color={colors.primary} />
                <View style={styles.verificationBannerContent}>
                  <Text style={styles.verificationBannerTitle}>Complete Agent Verification</Text>
                  <Text style={styles.verificationBannerText}>
                    Earn trust badges and boost your credibility with recruits
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
          return null;
        })()}

        {agentBadge && (
          <View style={styles.badgeCard}>
            <Trophy size={28} color={colors.warning} />
            <View style={styles.badgeContent}>
              <Text style={styles.badgeTitle}>{agentBadge}</Text>
              <Text style={styles.badgeSubtitle}>Keep up the great work!</Text>
            </View>
          </View>
        )}

        <View style={styles.gamificationSection}>
          <View style={styles.gamificationHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <TouchableOpacity onPress={() => router.push('/leaderboards')}>
              <Text style={styles.viewAllText}>View Leaderboards</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gamificationCards}>
            <TouchableOpacity 
              style={styles.gamificationCard}
              onPress={() => router.push('/achievements')}
            >
              <Award size={24} color={colors.primary} />
              <Text style={styles.gamificationValue}>{completedAchievements}/{achievements.length}</Text>
              <Text style={styles.gamificationLabel}>Achievements</Text>
            </TouchableOpacity>

            {myRank > 0 && (
              <View style={styles.gamificationCard}>
                <Trophy size={24} color={colors.warning} />
                <Text style={styles.gamificationValue}>#{myRank}</Text>
                <Text style={styles.gamificationLabel}>Rank (Month)</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Referral Link</Text>
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => router.push('/agent-invites')}
            >
              <Send size={16} color="#FFF" />
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.referralCard}>
            <Text style={styles.referralDescription}>
              Share your unique referral link to recruit sponsors and influencers. Earn 10% commission on all deals from your recruits!
            </Text>
            
            {user.referralCode && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your Code:</Text>
                <Text style={styles.codeText}>{user.referralCode}</Text>
              </View>
            )}

            {referralLink ? (
              <View style={styles.linkContainer}>
                <TextInput
                  style={styles.linkInput}
                  value={referralLink}
                  editable={false}
                  selectTextOnFocus
                />
                <View style={styles.linkActions}>
                  <TouchableOpacity style={styles.linkButton} onPress={handleCopyToClipboard}>
                    <Copy size={20} color={colors.primary} />
                    <Text style={styles.linkButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.linkButton} onPress={handleShareLink}>
                    <Share2 size={20} color={colors.primary} />
                    <Text style={styles.linkButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.generateButton} onPress={handleGenerateLink}>
                <UserPlus size={20} color="#FFF" />
                <Text style={styles.generateButtonText}>Generate Referral Link</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Share</Text>
          <View style={styles.quickShareCard}>
            <Text style={styles.quickShareDescription}>
              Share your referral link instantly via your favorite platforms
            </Text>
            <View style={styles.quickShareGrid}>
              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaWhatsApp}>
                <View style={[styles.quickShareIcon, { backgroundColor: '#25D366' }]}>
                  <MessageCircle size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaSMS}>
                <View style={[styles.quickShareIcon, { backgroundColor: colors.primary }]}>
                  <MessageCircle size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaEmail}>
                <View style={[styles.quickShareIcon, { backgroundColor: '#EA4335' }]}>
                  <Mail size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaFacebook}>
                <View style={[styles.quickShareIcon, { backgroundColor: '#1877F2' }]}>
                  <Facebook size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaTwitter}>
                <View style={[styles.quickShareIcon, { backgroundColor: '#1DA1F2' }]}>
                  <Twitter size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>Twitter</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickShareButton} onPress={handleShareViaLinkedIn}>
                <View style={[styles.quickShareIcon, { backgroundColor: '#0A66C2' }]}>
                  <Linkedin size={24} color="#FFF" />
                </View>
                <Text style={styles.quickShareLabel}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing Tools</Text>
          <View style={styles.marketingToolsCard}>
            <TouchableOpacity style={styles.marketingToolItem} onPress={handleGenerateQRCode}>
              <View style={styles.marketingToolIcon}>
                <QrCode size={24} color={colors.primary} />
              </View>
              <View style={styles.marketingToolContent}>
                <Text style={styles.marketingToolTitle}>Generate QR Code</Text>
                <Text style={styles.marketingToolDescription}>
                  Create a QR code for easy sharing at events
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.marketingToolDivider} />

            <TouchableOpacity style={styles.marketingToolItem} onPress={handleDownloadMarketingKit}>
              <View style={styles.marketingToolIcon}>
                <Download size={24} color={colors.primary} />
              </View>
              <View style={styles.marketingToolContent}>
                <Text style={styles.marketingToolTitle}>Marketing Kit</Text>
                <Text style={styles.marketingToolDescription}>
                  Download pre-made graphics and templates
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.marketingToolDivider} />

            <TouchableOpacity style={styles.marketingToolItem} onPress={handleAutoPostScheduler}>
              <View style={styles.marketingToolIcon}>
                <Sparkles size={24} color={colors.primary} />
              </View>
              <View style={styles.marketingToolContent}>
                <Text style={styles.marketingToolTitle}>Auto-Post Scheduler</Text>
                <Text style={styles.marketingToolDescription}>
                  Schedule posts to your social media accounts
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recruit Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Text style={styles.breakdownLabel}>Sponsors</Text>
                <Text style={styles.breakdownSubLabel}>
                  {sponsorRecruits > 0 ? `${referrals.filter(r => r.recruitedUserType === 'sponsor').reduce((sum, r) => sum + r.totalCommissionsEarned, 0).toFixed(2)} earned` : 'No sponsors yet'}
                </Text>
              </View>
              <Text style={styles.breakdownValue}>{sponsorRecruits}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Text style={styles.breakdownLabel}>Influencers</Text>
                <Text style={styles.breakdownSubLabel}>
                  {influencerRecruits > 0 ? `${referrals.filter(r => r.recruitedUserType === 'influencer').reduce((sum, r) => sum + r.totalCommissionsEarned, 0).toFixed(2)} earned` : 'No influencers yet'}
                </Text>
              </View>
              <Text style={styles.breakdownValue}>{influencerRecruits}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Text style={styles.breakdownLabel}>Total Earnings</Text>
                <Text style={styles.breakdownSubLabel}>From all recruits</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                ${referrals.reduce((sum, r) => sum + r.totalCommissionsEarned, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Recruits</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No recruits yet</Text>
              <Text style={styles.emptyStateSubtext}>Share your referral link to start earning commissions</Text>
            </View>
          ) : (
            <View style={styles.recruitsList}>
              {referrals.slice(0, 10).map((referral) => {
                const recruitedUser = users.find(u => u.id === referral.recruitedUserId);
                const handleMessage = () => {
                  const existingConv = conversations.find(c => 
                    c.participants.includes(user.id) && c.participants.includes(referral.recruitedUserId)
                  );

                  if (existingConv) {
                    router.push(`/conversation?conversationId=${existingConv.id}`);
                  } else {
                    const newConv = {
                      id: `conv_${Date.now()}`,
                      participants: [user.id, referral.recruitedUserId],
                      participantNames: [user.name, recruitedUser?.name || 'User'],
                      participantAvatars: [user.avatar, recruitedUser?.avatar || 'https://i.pravatar.cc/150'],
                      unreadCount: 0,
                    };
                    addConversation(newConv);
                    router.push(`/conversation?conversationId=${newConv.id}`);
                  }
                };

                return (
                  <View key={referral.id} style={styles.recruitCard}>
                    <TouchableOpacity 
                      style={styles.recruitInfo}
                      onPress={() => router.push(`/view-profile?userId=${referral.recruitedUserId}`)}
                    >
                      <Text style={styles.recruitName}>{recruitedUser?.name || 'Unknown User'}</Text>
                      <Text style={styles.recruitType}>
                        {referral.recruitedUserType === 'sponsor' ? 'Sponsor' : 'Influencer'}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.recruitActions}>
                      <View style={styles.recruitStats}>
                        <Text style={styles.recruitEarnings}>
                          ${referral.totalCommissionsEarned.toFixed(2)}
                        </Text>
                        <Text style={styles.recruitEarningsLabel}>earned</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.messageIconButton}
                        onPress={handleMessage}
                      >
                        <MessageCircle size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Commissions</Text>
          {agentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No commissions yet</Text>
              <Text style={styles.emptyStateSubtext}>Commissions will appear here when your recruits complete deals</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {agentTransactions.slice(0, 10).map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>+${transaction.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.withdrawButton}
          onPress={() => router.push('/transactions')}
        >
          <Text style={styles.withdrawButtonText}>View All Transactions</Text>
        </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  referralCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  referralDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  linkContainer: {
    gap: 12,
  },
  linkInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  breakdownCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  breakdownLabelContainer: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  breakdownSubLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  recruitsList: {
    gap: 12,
  },
  recruitCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recruitInfo: {
    flex: 1,
  },
  recruitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recruitName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  recruitType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recruitStats: {
    alignItems: 'flex-end',
  },
  recruitEarnings: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.success,
  },
  recruitEarningsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.success,
  },
  withdrawButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  verificationBannerContent: {
    flex: 1,
  },
  verificationBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.warning,
    marginBottom: 4,
  },
  verificationBannerText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  quickShareCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  quickShareDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  quickShareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickShareButton: {
    alignItems: 'center',
    width: '30%',
  },
  quickShareIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickShareLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  marketingToolsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  marketingToolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  marketingToolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  marketingToolContent: {
    flex: 1,
  },
  marketingToolTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  marketingToolDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  marketingToolDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.warning + '10',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning + '40',
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.warning,
    marginBottom: 4,
  },
  badgeSubtitle: {
    fontSize: 14,
    color: colors.text,
  },
  gamificationSection: {
    padding: 16,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  gamificationCards: {
    flexDirection: 'row',
    gap: 12,
  },
  gamificationCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  gamificationValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  gamificationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
