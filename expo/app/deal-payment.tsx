import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DollarSign, CreditCard, Lock, CheckCircle, AlertCircle, Bitcoin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useCampaigns } from '@/contexts/CampaignContext';
import colors from '@/constants/colors';
import type { CurrencyType } from '@/types';

export default function DealPaymentScreen() {
  const insets = useSafeAreaInsets();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { user } = useAuth();
  const { applications, gigs, addNotification } = useData();
  const { lockFundsInEscrow, getUserBalance, addFunds } = usePayment();
  const { createCampaignFromDeal } = useCampaigns();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyType>('usd');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const application = applications.find((a) => a.id === applicationId);
  const gig = application ? gigs.find((g) => g.id === application.gigId) : undefined;
  const balance = user ? getUserBalance(user.id, currency) : undefined;

  if (!application || !gig || !user || user.role !== 'sponsor') {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Deal Payment',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>Invalid payment request</Text>
        </View>
      </View>
    );
  }

  const handleAddFunds = async () => {
    const addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await addFunds(user.id, addAmount, currency, paymentMethod === 'card' ? 'stripe' : 'coinbase');
      Alert.alert('Success', `$${addAmount.toFixed(2)} added to your balance`);
      setAmount('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLockFunds = async () => {
    const lockAmount = parseFloat(amount);
    if (isNaN(lockAmount) || lockAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (lockAmount < gig.budget.min || lockAmount > gig.budget.max) {
      Alert.alert(
        'Amount Out of Range',
        `Please enter an amount between ${gig.budget.min} and ${gig.budget.max}`
      );
      return;
    }

    const platformFee = lockAmount * 0.1;
    const totalAmount = lockAmount + platformFee;
    const currentBalance = balance?.availableBalance || 0;
    
    if (currentBalance < totalAmount) {
      Alert.alert(
        'Insufficient Funds',
        `You need ${totalAmount.toFixed(2)} total (${lockAmount.toFixed(2)} to influencer + ${platformFee.toFixed(2)} platform fee) but only have ${currentBalance.toFixed(2)} available. Please add funds first.`
      );
      return;
    }

    Alert.alert(
      'Lock Funds in Escrow',
      `Payment Breakdown:\n• To ${application.influencerName}: ${lockAmount.toFixed(2)}\n• Platform fee (10%): ${platformFee.toFixed(2)}\n• Total: ${totalAmount.toFixed(2)}\n\nFunds will be held securely in escrow until you release them upon completion. The influencer receives the full ${lockAmount.toFixed(2)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Funds',
          onPress: async () => {
            setIsProcessing(true);
            try {
              console.log('[Deal Payment] Locking funds in escrow...');
              const escrowJob = await lockFundsInEscrow(gig, application, lockAmount, currency, async (notification) => {
                await addNotification(notification);
              });

              console.log('[Deal Payment] Escrow locked successfully');
              console.log('[Deal Payment] Creating campaign...');
              
              const campaign = await createCampaignFromDeal(
                escrowJob.id,
                gig.id,
                user.id,
                application.influencerId,
                gig.title,
                gig.description,
                lockAmount
              );

              console.log('[Deal Payment] Campaign created:', campaign.id);

              await addNotification({
                id: `notif_campaign_${Date.now()}`,
                userId: application.influencerId,
                type: 'milestone',
                priority: 'high',
                title: 'Campaign Started! 🎯',
                message: `Your campaign for "${gig.title}" has been created with ${campaign.milestones.length} milestones. Let's get started!`,
                read: false,
                createdAt: new Date().toISOString(),
                relatedId: campaign.id,
                actionUrl: '/campaigns',
                actionLabel: 'View Campaign',
              });
              Alert.alert(
                'Success! 🎉',
                'Funds locked in escrow successfully. The influencer has been notified and can now start working on the project.',
                [
                  {
                    text: 'View Deal',
                    onPress: () => router.push('/deal-management'),
                  },
                  {
                    text: 'OK',
                    style: 'cancel',
                  },
                ]
              );
            } catch (error) {
              console.error('[Deal Payment] Failed to lock funds:', error);
              Alert.alert(
                'Payment Failed',
                error instanceof Error ? error.message : 'Failed to lock funds. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Deal Payment',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.dealInfo}>
          <Text style={styles.dealTitle}>{gig.title}</Text>
          <Text style={styles.dealInfluencer}>with {application.influencerName}</Text>
          <View style={styles.budgetRange}>
            <Text style={styles.budgetLabel}>Budget Range:</Text>
            <Text style={styles.budgetValue}>
              ${gig.budget.min.toLocaleString()} - ${gig.budget.max.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Balance</Text>
          <View style={styles.balanceCard}>
            <DollarSign size={32} color={colors.success} />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ${(balance?.availableBalance || 0).toFixed(2)}
              </Text>
            </View>
          </View>
          {balance && balance.escrowBalance > 0 && (
            <View style={[styles.balanceCard, { marginTop: 12 }]}>
              <Lock size={32} color={colors.warning} />
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>In Escrow</Text>
                <Text style={styles.balanceAmount}>${balance.escrowBalance.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyButtons}>
            {(['usd', 'btc', 'eth'] as const).map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[styles.currencyButton, currency === curr && styles.currencyButtonActive]}
                onPress={() => setCurrency(curr)}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    currency === curr && styles.currencyButtonTextActive,
                  ]}
                >
                  {curr.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <CreditCard size={24} color={paymentMethod === 'card' ? colors.primary : colors.textSecondary} />
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, paymentMethod === 'card' && styles.methodNameActive]}>
                Credit/Debit Card
              </Text>
              <Text style={styles.methodDescription}>Visa ending in 4242</Text>
            </View>
            {paymentMethod === 'card' && <CheckCircle size={20} color={colors.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'crypto' && styles.methodCardActive]}
            onPress={() => setPaymentMethod('crypto')}
          >
            <Bitcoin size={24} color={paymentMethod === 'crypto' ? colors.warning : colors.textSecondary} />
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, paymentMethod === 'crypto' && styles.methodNameActive]}>
                Cryptocurrency
              </Text>
              <Text style={styles.methodDescription}>Pay with BTC, ETH, or USDC</Text>
            </View>
            {paymentMethod === 'crypto' && <CheckCircle size={20} color={colors.warning} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push('/payment-methods')}
          >
            <Text style={styles.manageButtonText}>Manage Payment Methods</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment to Influencer</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Influencer receives:</Text>
              <Text style={styles.feeValue}>${(parseFloat(amount) || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Platform fee (10%):</Text>
              <Text style={[styles.feeValue, { color: colors.textSecondary }]}>
                +${((parseFloat(amount) || 0) * 0.1).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.feeRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total you pay:</Text>
              <Text style={styles.totalValue}>
                ${((parseFloat(amount) || 0) * 1.1).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Lock size={20} color={colors.accent} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Secure Escrow Protection</Text>
              <Text style={styles.infoText}>
                Funds are held securely in escrow until you approve the work and release payment.
                You can refund at any time if needed.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addFundsButton, isProcessing && styles.buttonDisabled]}
          onPress={handleAddFunds}
          disabled={isProcessing}
        >
          <Text style={styles.addFundsButtonText}>Add Funds to Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.lockButton, isProcessing && styles.buttonDisabled]}
          onPress={handleLockFunds}
          disabled={isProcessing}
        >
          <Lock size={20} color="#FFF" />
          <Text style={styles.lockButtonText}>
            {isProcessing ? 'Processing...' : 'Lock Funds in Escrow'}
          </Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
  },
  dealInfo: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  dealInfluencer: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  budgetRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  currencyButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  currencyButtonTextActive: {
    color: colors.primary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  methodNameActive: {
    color: colors.primary,
  },
  methodDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  manageButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    paddingVertical: 16,
  },
  feeBreakdown: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  addFundsButton: {
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  addFundsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
  },
  lockButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
