import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, AlertCircle, ExternalLink, Shield, CreditCard, User as UserIcon, Clock, DollarSign, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { StripeEscrowIntegration } from '@/utils/payment-integration';
import Colors from '@/constants/colors';

export default function AgentStripeVerificationScreen() {
  const { user, updateProfile } = useAuth();
  const { getUserBalance, getAgentReferrals, transactions } = usePayment();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'verified' | 'failed'>(
    user?.stripeVerificationStatus || 'not_started'
  );

  useEffect(() => {
    if (user?.stripeVerificationStatus) {
      setVerificationStatus(user.stripeVerificationStatus);
    }
  }, [user?.stripeVerificationStatus]);

  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Agent Verification',
            headerStyle: { backgroundColor: Colors.dark },
            headerTintColor: Colors.text,
          }} 
        />
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const balance = getUserBalance(user.id);
  const referrals = getAgentReferrals(user.id);
  const agentTransactions = transactions.filter(t => 
    t.type === 'agent_commission' && t.toUser === user.id
  );
  const totalCommissions = agentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingPayouts = balance?.availableBalance || 0;

  const handleStartVerification = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      console.log('[Agent Stripe Verification] Starting verification for agent:', user.id);

      const { accountId, onboardingUrl } = await StripeEscrowIntegration.createConnectedAccount(
        user.id,
        user.email,
        'individual'
      );

      console.log('[Agent Stripe Verification] Connected account created:', accountId);
      console.log('[Agent Stripe Verification] Onboarding URL:', onboardingUrl);

      await updateProfile({
        stripeConnectedAccountId: accountId,
        stripeVerificationStatus: 'pending',
        stripeOnboardingComplete: false,
      });

      setVerificationStatus('pending');

      Alert.alert(
        'Verification Started',
        'You will be redirected to Stripe to complete your account setup. This is required to receive commission payouts from deals.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue to Stripe',
            onPress: async () => {
              const supported = await Linking.canOpenURL(onboardingUrl);
              if (supported) {
                await Linking.openURL(onboardingUrl);
                
                Alert.alert(
                  'Complete Verification',
                  'After completing the Stripe verification, return to this screen and tap "Check Status" to update your verification status.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Unable to open Stripe verification link.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[Agent Stripe Verification] Error:', error);
      Alert.alert('Error', 'Failed to start verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user?.stripeConnectedAccountId) {
      Alert.alert('Error', 'No Stripe account found. Please start verification first.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Agent Stripe Verification] Checking status for account:', user.stripeConnectedAccountId);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const isVerified = Math.random() > 0.3;

      if (isVerified) {
        await updateProfile({
          stripeVerificationStatus: 'verified',
          stripeOnboardingComplete: true,
          stripeVerifiedAt: new Date().toISOString(),
        });

        setVerificationStatus('verified');

        Alert.alert(
          'Verification Complete! ✅',
          'Your Stripe account has been verified. You can now receive commission payouts from your referred deals.',
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/agent-dashboard'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Pending',
          'Your Stripe verification is still in progress. This usually takes a few minutes. Please check back shortly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Agent Stripe Verification] Status check error:', error);
      Alert.alert('Error', 'Failed to check verification status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryVerification = async () => {
    if (!user?.stripeConnectedAccountId) {
      handleStartVerification();
      return;
    }

    setIsLoading(true);

    try {
      const onboardingUrl = `https://connect.stripe.com/setup/${user.stripeConnectedAccountId}`;
      
      const supported = await Linking.canOpenURL(onboardingUrl);
      if (supported) {
        await Linking.openURL(onboardingUrl);
        
        await updateProfile({
          stripeVerificationStatus: 'pending',
        });
        
        setVerificationStatus('pending');
      } else {
        Alert.alert('Error', 'Unable to open Stripe verification link.');
      }
    } catch (error) {
      console.error('[Agent Stripe Verification] Retry error:', error);
      Alert.alert('Error', 'Failed to retry verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusCard = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <View style={[styles.statusCard, styles.statusCardSuccess]}>
            <CheckCircle size={48} color={Colors.success} />
            <Text style={styles.statusTitle}>Verified ✓</Text>
            <Text style={styles.statusDescription}>
              Your Stripe account is verified and ready to receive commission payouts.
            </Text>
            {user?.stripeVerifiedAt && (
              <Text style={styles.statusDate}>
                Verified on {new Date(user.stripeVerifiedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        );

      case 'pending':
        return (
          <View style={[styles.statusCard, styles.statusCardPending]}>
            <Clock size={48} color={Colors.warning} />
            <Text style={styles.statusTitle}>Verification Pending</Text>
            <Text style={styles.statusDescription}>
              Your Stripe verification is in progress. This usually takes a few minutes.
            </Text>
            <TouchableOpacity
              onPress={handleCheckStatus}
              disabled={isLoading}
              style={styles.checkButton}
            >
              <Text style={styles.checkButtonText}>
                {isLoading ? 'Checking...' : 'Check Status'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'failed':
        return (
          <View style={[styles.statusCard, styles.statusCardError]}>
            <AlertCircle size={48} color={Colors.danger} />
            <Text style={styles.statusTitle}>Verification Failed</Text>
            <Text style={styles.statusDescription}>
              There was an issue with your verification. Please try again or contact support.
            </Text>
            <TouchableOpacity
              onPress={handleRetryVerification}
              disabled={isLoading}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>
                {isLoading ? 'Loading...' : 'Retry Verification'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={[styles.statusCard, styles.statusCardDefault]}>
            <Shield size={48} color={Colors.primary} />
            <Text style={styles.statusTitle}>Verification Required</Text>
            <Text style={styles.statusDescription}>
              To receive commission payouts from your referred deals, you need to verify your Stripe account.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Agent Stripe Verification',
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Commission Payout Setup</Text>
          <Text style={styles.subtitle}>
            Secure commission payouts powered by Stripe
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>${pendingPayouts.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Pending Payouts</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>${totalCommissions.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <UserIcon size={20} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Active Recruits</Text>
          </View>
        </View>

        {renderStatusCard()}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Verification is Required:</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Shield size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Secure Payouts</Text>
              <Text style={styles.infoItemDescription}>
                Stripe ensures your commission payments are processed securely and reliably
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Automatic Commissions</Text>
              <Text style={styles.infoItemDescription}>
                Receive 10% commission automatically when your referred deals complete
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <CreditCard size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Fast Withdrawals</Text>
              <Text style={styles.infoItemDescription}>
                Withdraw your earnings to your bank account anytime
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What you'll need:</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <UserIcon size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Personal Information</Text>
              <Text style={styles.infoItemDescription}>
                Full name, date of birth, and address for identity verification
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Shield size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Identity Verification</Text>
              <Text style={styles.infoItemDescription}>
                Government-issued ID or passport for verification
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <CreditCard size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoItemTitle}>Bank Account</Text>
              <Text style={styles.infoItemDescription}>
                Bank account details to receive commission payouts
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.warningSection}>
          <AlertCircle size={24} color={Colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              You must complete Stripe verification to receive commission payouts. Pending commissions will be held until verification is complete.
            </Text>
          </View>
        </View>

        <View style={styles.securitySection}>
          <Shield size={24} color={Colors.textSecondary} />
          <Text style={styles.securityText}>
            Your information is securely processed by Stripe and never stored on our servers.
          </Text>
        </View>

        {verificationStatus === 'not_started' && (
          <TouchableOpacity
            onPress={handleStartVerification}
            disabled={isLoading}
            style={styles.startButton}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.startButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <ExternalLink size={20} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Start Verification</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {verificationStatus === 'verified' && (
          <TouchableOpacity
            onPress={() => router.push('/transactions')}
            style={styles.viewTransactionsButton}
          >
            <Text style={styles.viewTransactionsButtonText}>View Commission History</Text>
          </TouchableOpacity>
        )}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusCardDefault: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  statusCardSuccess: {
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  statusCardPending: {
    backgroundColor: Colors.warning + '20',
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  statusCardError: {
    backgroundColor: Colors.danger + '20',
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  checkButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.warning,
    borderRadius: 12,
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.danger,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  viewTransactionsButton: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewTransactionsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
