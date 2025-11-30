import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { 
  User, 
  DollarSign, 
  CreditCard, 
  Settings, 
  LogOut, 
  Shield,
  TrendingUp,
  Users,
  Briefcase,
  Copy,
  CheckCircle2,
  RefreshCw,
  Gift,
  HelpCircle,
  Sparkles,
  Wallet,
  Bitcoin,
  Coins,
  BarChart3,
  Calendar,
  Handshake,
  MessageSquare,
  FileText,
  Search
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import type { SocialAccount } from '@/types';
import { calculateProfileCompletion } from '@/utils/profile-completion';
import { useMemo } from 'react';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const profileCompletion = useMemo(() => {
    if (!user) return null;
    return calculateProfileCompletion(user);
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const copyReferralCode = () => {
    if (user?.role === 'agent' && 'referralCode' in user) {
      Alert.alert('Copied!', `Referral code ${user.referralCode} copied to clipboard`);
    }
  };

  const handleRoleSwitch = (newRole: 'influencer' | 'sponsor' | 'agent') => {
    Alert.alert(
      'Switch Role',
      `Are you sure you want to switch to ${newRole}? Your current profile data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await switchRole(newRole);
            setShowRoleModal(false);
          },
        },
      ]
    );
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'influencer':
        return <Users size={32} color="#FFFFFF" />;
      case 'sponsor':
        return <Briefcase size={32} color="#FFFFFF" />;
      case 'agent':
        return <TrendingUp size={32} color="#FFFFFF" />;
      case 'admin':
        return <Shield size={32} color="#FFFFFF" />;
      default:
        return <User size={32} color="#FFFFFF" />;
    }
  };

  const getRoleGradient = (): [string, string] => {
    switch (user?.role) {
      case 'influencer':
        return [Colors.primary, Colors.secondary];
      case 'sponsor':
        return [Colors.secondary, '#8B5CF6'];
      case 'agent':
        return [Colors.warning, '#F97316'];
      case 'admin':
        return [Colors.danger, '#DC2626'];
      default:
        return [Colors.primary, Colors.secondary];
    }
  };

  const getCryptoIcon = (crypto: string) => {
    switch (crypto) {
      case 'BTC':
        return <Bitcoin size={16} color={Colors.warning} />;
      case 'ETH':
      case 'USDT':
      case 'USDC':
      case 'SOL':
        return <Coins size={16} color={Colors.primary} />;
      default:
        return <Coins size={16} color={Colors.primary} />;
    }
  };

  const renderInfluencerStats = () => {
    if (user?.role !== 'influencer') return null;
    const influencer = user as any;
    const hasVerifiedSocials = influencer.socialAccounts && influencer.socialAccounts.length > 0;
    const hasPaymentPreferences = influencer.paymentPreferences && influencer.paymentPreferences.length > 0;

    return (
      <>
        {hasVerifiedSocials && (
          <View style={styles.socialAccountsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Verified Accounts</Text>
              <TouchableOpacity onPress={() => router.push('/verify-socials')}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.socialAccountsList}>
              {influencer.socialAccounts.map((account: SocialAccount, index: number) => (
                <View key={index} style={styles.socialAccountCard}>
                  <View style={styles.socialAccountInfo}>
                    <Text style={styles.socialPlatform}>{account.platform}</Text>
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={12} color={Colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.socialFollowers}>
                    {account.followers.toLocaleString()} followers
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasPaymentPreferences && (
          <View style={styles.paymentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={() => router.push('/edit-profile')}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.paymentMethodsContainer}>
              {influencer.paymentPreferences.map((pref: string, index: number) => (
                <View key={index} style={styles.paymentMethodCard}>
                  <LinearGradient
                    colors={pref === 'fiat' ? [Colors.success + '20', Colors.success + '10'] : [Colors.primary + '20', Colors.secondary + '10']}
                    style={styles.paymentMethodGradient}
                  >
                    <View style={styles.paymentMethodIcon}>
                      {pref === 'fiat' ? (
                        <DollarSign size={24} color={Colors.success} />
                      ) : (
                        <Wallet size={24} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.paymentMethodLabel}>
                      {pref === 'fiat' ? 'Fiat Currency' : 'Cryptocurrency'}
                    </Text>
                    {pref === 'crypto' && influencer.acceptedCryptos && influencer.acceptedCryptos.length > 0 && (
                      <View style={styles.cryptoTypesContainer}>
                        {influencer.acceptedCryptos.map((crypto: string, idx: number) => (
                          <View key={idx} style={styles.cryptoTypeChip}>
                            {getCryptoIcon(crypto)}
                            <Text style={styles.cryptoTypeText}>{crypto}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(influencer.followers / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Total Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{influencer.engagementRate}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${influencer.ratePerPost}</Text>
            <Text style={styles.statLabel}>Per Post</Text>
          </View>
        </View>

        {!hasVerifiedSocials && (
          <TouchableOpacity 
            onPress={() => router.push('/verify-socials')}
            style={styles.verifyPromptCard}
          >
            <LinearGradient
              colors={[Colors.primary + '20', Colors.secondary + '20']}
              style={styles.verifyPromptGradient}
            >
              <CheckCircle2 size={24} color={Colors.primary} />
              <Text style={styles.verifyPromptTitle}>Verify Your Social Accounts</Text>
              <Text style={styles.verifyPromptText}>
                Connect your social media to build trust with sponsors
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const renderAgentStats = () => {
    if (user?.role !== 'agent') return null;
    const agent = user as any;

    return (
      <View style={styles.agentSection}>
        <View style={styles.referralCard}>
          <LinearGradient
            colors={[Colors.warning, Colors.secondary]}
            style={styles.referralGradient}
          >
            <Text style={styles.referralLabel}>Your Referral Code</Text>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralCode}>{agent.referralCode}</Text>
              <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
                <Copy size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.referralSubtext}>Share to earn 15% commission</Text>
          </LinearGradient>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${agent.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{agent.recruits?.length || 0}</Text>
            <Text style={styles.statLabel}>Recruits</Text>
          </View>
        </View>

        {!agent.isSubscribed && (
          <TouchableOpacity style={styles.subscribeCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.subscribeGradient}
            >
              <Text style={styles.subscribeTitle}>Upgrade to Pro</Text>
              <Text style={styles.subscribeText}>$80/month - Unlock full agent features</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getVerificationStatus = () => {
    if (!user?.stripeVerificationStatus || user.stripeVerificationStatus === 'not_started') {
      return { text: 'Not Verified', color: Colors.textMuted };
    }
    if (user.stripeVerificationStatus === 'pending') {
      return { text: 'Pending', color: Colors.warning };
    }
    if (user.stripeVerificationStatus === 'verified') {
      return { text: 'Verified', color: Colors.success };
    }
    return { text: 'Failed', color: Colors.danger };
  };

  type MenuItem = {
    icon: any;
    label: string;
    onPress: () => void;
    badge?: { text: string; color: string };
  };

  const menuItems: MenuItem[] = [
    { icon: Search, label: 'Advanced Search', onPress: () => router.push('/search') },
    { icon: User, label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { icon: DollarSign, label: 'Transactions', onPress: () => router.push('/transactions') },
    { icon: CreditCard, label: 'Payment Methods', onPress: () => router.push('/payment-methods') },
    { icon: Settings, label: 'Settings', onPress: () => router.push('/settings' as any) },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => router.push('/help') },
  ];

  if (user?.role === 'influencer') {
    menuItems.unshift({ 
      icon: BarChart3, 
      label: 'Portfolio Analytics', 
      onPress: () => router.push('/analytics' as any) 
    });
    menuItems.unshift({ 
      icon: FileText, 
      label: 'Content Library', 
      onPress: () => router.push('/content-library' as any) 
    });
  }

  if (user?.role === 'influencer' || user?.role === 'sponsor') {
    menuItems.unshift({ 
      icon: Calendar, 
      label: 'Campaign Management', 
      onPress: () => router.push('/campaigns' as any) 
    });
    menuItems.unshift({ 
      icon: MessageSquare, 
      label: 'Negotiations', 
      onPress: () => router.push('/negotiations' as any) 
    });
    menuItems.unshift({ 
      icon: Handshake, 
      label: 'Brand Collaboration Hub', 
      onPress: () => router.push('/brand-hub' as any) 
    });
  }

  if (user?.role === 'influencer' && !menuItems.find(m => m.label === 'My Applications')) {
    menuItems.push({ 
      icon: Briefcase, 
      label: 'My Applications', 
      onPress: () => router.push('/my-applications') 
    });
    menuItems.push({ 
      icon: CheckCircle2, 
      label: 'Verify Social Accounts', 
      onPress: () => router.push('/verify-socials') 
    });
    menuItems.push({ 
      icon: Shield, 
      label: 'Stripe Verification', 
      onPress: () => router.push('/stripe-verification'),
      badge: getVerificationStatus()
    });
  }

  if (user?.role === 'sponsor') {
    menuItems.unshift({ 
      icon: Briefcase, 
      label: 'Manage Gigs', 
      onPress: () => router.push('/manage-gigs') 
    });
  }

  if (user?.role === 'agent') {
    menuItems.unshift({ 
      icon: TrendingUp, 
      label: 'Agent Dashboard', 
      onPress: () => router.push('/agent-dashboard') 
    });
    menuItems.unshift({ 
      icon: Users, 
      label: 'Agent Invites', 
      onPress: () => router.push('/agent-invites') 
    });
  }

  if (user?.role === 'admin') {
    menuItems.unshift({ 
      icon: Shield, 
      label: 'Admin Rewards', 
      onPress: () => router.push('/admin-rewards') 
    });
  }

  menuItems.unshift({ 
    icon: Sparkles, 
    label: 'AI Matching', 
    onPress: () => router.push('/ai-matching') 
  });
  menuItems.unshift({ 
    icon: Gift, 
    label: 'Rewards', 
    onPress: () => router.push('/rewards') 
  });

  if (user?.role !== 'admin') {
    menuItems.push({ 
      icon: RefreshCw, 
      label: 'Switch Role', 
      onPress: () => setShowRoleModal(true) 
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={getRoleGradient()}
            style={styles.avatarGradient}
          >
            {getRoleIcon()}
          </LinearGradient>

          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
            </Text>
          </View>
        </View>

        {profileCompletion && profileCompletion.percentage < 100 && (
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Complete Your Profile</Text>
              <Text style={styles.completionPercentage}>{profileCompletion.percentage}%</Text>
            </View>
            <Text style={styles.completionSubtitle}>
              {profileCompletion.percentage < 50 
                ? 'Complete your profile to increase your visibility'
                : 'Almost there! Complete your profile to stand out'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={[styles.progressBarFill, { width: `${profileCompletion.percentage}%` }]}
                />
              </View>
            </View>
            {profileCompletion.nextAction && (
              <TouchableOpacity
                style={styles.nextActionButton}
                onPress={() => profileCompletion.nextAction?.route && router.push(profileCompletion.nextAction.route as any)}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.nextActionGradient}
                >
                  <Text style={styles.nextActionText}>✓ {profileCompletion.nextAction.label}</Text>
                  <Text style={styles.nextActionArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {profileCompletion.items.filter(item => !item.isComplete).slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.completionItem}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={styles.completionItemCheckbox}>
                  <View style={styles.completionItemCheckboxInner} />
                </View>
                <Text style={styles.completionItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {renderInfluencerStats()}
        {renderAgentStats()}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[Colors.darkCard, Colors.backgroundSecondary]}
                  style={styles.menuItemGradient}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Icon size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badge.color + '20' }]}>
                      <Text style={[styles.badgeText, { color: item.badge.color }]}>{item.badge.text}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.darkCard, Colors.backgroundSecondary]}
              style={styles.menuItemGradient}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, styles.logoutIcon]}>
                  <LogOut size={20} color={Colors.danger} />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Role</Text>
            <Text style={styles.modalSubtitle}>Choose your new role</Text>

            <View style={styles.roleOptions}>
              <TouchableOpacity
                onPress={() => handleRoleSwitch('influencer')}
                style={styles.roleOption}
                disabled={user?.role === 'influencer'}
              >
                <LinearGradient
                  colors={user?.role === 'influencer' ? [Colors.darkCard, Colors.darkCard] : [Colors.primary, Colors.secondary]}
                  style={styles.roleOptionGradient}
                >
                  <Users size={32} color="#FFFFFF" />
                  <Text style={styles.roleOptionTitle}>Influencer</Text>
                  <Text style={styles.roleOptionText}>Showcase your portfolio</Text>
                  {user?.role === 'influencer' && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRoleSwitch('sponsor')}
                style={styles.roleOption}
                disabled={user?.role === 'sponsor'}
              >
                <LinearGradient
                  colors={user?.role === 'sponsor' ? [Colors.darkCard, Colors.darkCard] : [Colors.secondary, '#8B5CF6']}
                  style={styles.roleOptionGradient}
                >
                  <Briefcase size={32} color="#FFFFFF" />
                  <Text style={styles.roleOptionTitle}>Sponsor</Text>
                  <Text style={styles.roleOptionText}>Post gigs & find talent</Text>
                  {user?.role === 'sponsor' && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRoleSwitch('agent')}
                style={styles.roleOption}
                disabled={user?.role === 'agent'}
              >
                <LinearGradient
                  colors={user?.role === 'agent' ? [Colors.darkCard, Colors.darkCard] : [Colors.warning, '#F97316']}
                  style={styles.roleOptionGradient}
                >
                  <TrendingUp size={32} color="#FFFFFF" />
                  <Text style={styles.roleOptionTitle}>Agent</Text>
                  <Text style={styles.roleOptionText}>Earn 15% commission</Text>
                  {user?.role === 'agent' && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowRoleModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  scrollContent: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  agentSection: {
    marginBottom: 24,
  },
  referralCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  referralGradient: {
    padding: 20,
    alignItems: 'center',
  },
  referralLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  referralSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subscribeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  subscribeGradient: {
    padding: 20,
    alignItems: 'center',
  },
  subscribeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subscribeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  menuSection: {
    gap: 12,
  },
  menuItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemGradient: {
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    backgroundColor: Colors.danger + '20',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  logoutText: {
    color: Colors.danger,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  socialAccountsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  socialAccountsList: {
    gap: 8,
  },
  socialAccountCard: {
    backgroundColor: Colors.darkCard,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialPlatform: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  socialFollowers: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  verifyPromptCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  verifyPromptGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  verifyPromptTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  verifyPromptText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  paymentMethodGradient: {
    padding: 16,
    gap: 12,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cryptoTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  cryptoTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cryptoTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  roleOptionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
    position: 'relative' as const,
  },
  roleOptionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  roleOptionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalCloseButton: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  completionCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  completionPercentage: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  completionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  nextActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  nextActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  nextActionArrow: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  completionItemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionItemCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  completionItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
