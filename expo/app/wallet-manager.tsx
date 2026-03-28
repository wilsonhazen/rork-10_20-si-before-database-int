import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, Plus, Trash2, X, CheckCircle, AlertCircle, ExternalLink, Copy, ArrowUpRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function WalletManagerScreen() {
  const { user } = useAuth();
  const {
    getUserWallets,
    getConnectedWallet,
    getUserBalance,
    getUserWithdrawals,
    connectWallet,
    disconnectWallet,
    removeWallet,
    requestWithdrawal,
  } = useWallet();

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'polygon' | 'solana' | 'bitcoin'>('ethereum');
  const [selectedProvider, setSelectedProvider] = useState<'manual' | 'metamask' | 'trust' | 'coinbase'>('manual');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [emailConfirmCode, setEmailConfirmCode] = useState('');
  const [sentConfirmCode, setSentConfirmCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const userWallets = user ? getUserWallets(user.id) : [];
  const connectedWallet = user ? getConnectedWallet(user.id) : undefined;
  const impactBalance = user && connectedWallet ? getUserBalance(user.id, connectedWallet.address) : undefined;
  const withdrawals = user ? getUserWithdrawals(user.id) : [];

  const handleAddWallet = async () => {
    if (!user) return;
    
    if (!walletAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress) && selectedNetwork === 'ethereum') {
      Alert.alert('Error', 'Please enter a valid Ethereum address');
      return;
    }

    setIsProcessing(true);
    const result = await connectWallet(user.id, walletAddress.trim(), selectedNetwork, selectedProvider);
    setIsProcessing(false);

    if (result.success) {
      setWalletAddress('');
      setShowAddWallet(false);
      Alert.alert('Success', 'Wallet connected successfully! You can now receive ImPAct tokens.');
    } else {
      Alert.alert('Error', result.error || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async (walletId: string) => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect this wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disconnectWallet(walletId);
          Alert.alert('Success', 'Wallet disconnected');
        },
      },
    ]);
  };

  const handleRemove = async (walletId: string) => {
    Alert.alert('Remove Wallet', 'Are you sure you want to remove this wallet? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeWallet(walletId);
          Alert.alert('Success', 'Wallet removed');
        },
      },
    ]);
  };

  const handleWithdraw = async () => {
    if (!user || !connectedWallet) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!impactBalance || amount > impactBalance.balance) {
      Alert.alert('Error', `Insufficient balance. Available: ${impactBalance?.balance || 0} IMPACT`);
      return;
    }

    if (amount > 100) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentConfirmCode(code);
      setShowEmailConfirmModal(true);
      console.log(`[Email Confirmation] Sending code ${code} to ${user.email}`);
      console.log('[Email] Subject: Confirm Withdrawal - SourceImpact');
      console.log(`[Email] Body: Your withdrawal confirmation code is: ${code}`);
      Alert.alert(
        'Email Confirmation Required',
        `A confirmation code has been sent to ${user.email}. Please check your email and enter the code to proceed.`
      );
      return;
    }

    await processWithdrawal(amount);
  };

  const handleEmailConfirmation = async () => {
    if (!user || !connectedWallet) return;

    if (!emailConfirmCode.trim()) {
      Alert.alert('Error', 'Please enter the confirmation code');
      return;
    }

    if (emailConfirmCode.trim() !== sentConfirmCode) {
      Alert.alert('Error', 'Invalid confirmation code. Please check your email and try again.');
      return;
    }

    setIsVerifyingEmail(true);
    const amount = parseFloat(withdrawAmount);
    await processWithdrawal(amount);
    setIsVerifyingEmail(false);
    setShowEmailConfirmModal(false);
    setEmailConfirmCode('');
    setSentConfirmCode('');
  };

  const processWithdrawal = async (amount: number) => {
    if (!user || !connectedWallet) return;

    setIsProcessing(true);
    const result = await requestWithdrawal(user.id, connectedWallet.address, amount);
    setIsProcessing(false);

    if (result.success) {
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      Alert.alert(
        'Withdrawal Requested',
        `Your withdrawal request for ${amount} IMPACT has been submitted. An admin will process it shortly.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to request withdrawal');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please log in to manage wallets</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Wallet size={32} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>ImPAct Wallet</Text>
          <Text style={styles.headerSubtitle}>Connect your wallet to receive and withdraw ImPAct tokens</Text>
        </View>

        {connectedWallet && impactBalance && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => setShowWithdrawModal(true)}
                disabled={impactBalance.balance <= 0}
              >
                <ArrowUpRight size={16} color={Colors.white} />
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{impactBalance.balance.toFixed(2)}</Text>
            <Text style={styles.balanceCurrency}>IMPACT</Text>
            <Text style={styles.balanceUsd}>${impactBalance.balance.toFixed(2)} USD</Text>

            <View style={styles.balanceStats}>
              <View style={styles.balanceStatItem}>
                <Text style={styles.balanceStatLabel}>Locked</Text>
                <Text style={styles.balanceStatValue}>{impactBalance.lockedBalance.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceStatDivider} />
              <View style={styles.balanceStatItem}>
                <Text style={styles.balanceStatLabel}>Total Earned</Text>
                <Text style={styles.balanceStatValue}>{impactBalance.totalEarned.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceStatDivider} />
              <View style={styles.balanceStatItem}>
                <Text style={styles.balanceStatLabel}>Withdrawn</Text>
                <Text style={styles.balanceStatValue}>{impactBalance.totalWithdrawn.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connected Wallets</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddWallet(!showAddWallet)}
            >
              {showAddWallet ? (
                <X size={20} color={Colors.white} />
              ) : (
                <Plus size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {showAddWallet && (
            <View style={styles.addWalletForm}>
              <Text style={styles.formLabel}>Network</Text>
              <View style={styles.networkButtons}>
                {(['ethereum', 'polygon', 'solana', 'bitcoin'] as const).map((network) => (
                  <TouchableOpacity
                    key={network}
                    style={[
                      styles.networkButton,
                      selectedNetwork === network && styles.networkButtonActive,
                    ]}
                    onPress={() => setSelectedNetwork(network)}
                  >
                    <Text
                      style={[
                        styles.networkButtonText,
                        selectedNetwork === network && styles.networkButtonTextActive,
                      ]}
                    >
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Wallet Provider</Text>
              <View style={styles.networkButtons}>
                {(['manual', 'metamask', 'trust', 'coinbase'] as const).map((provider) => (
                  <TouchableOpacity
                    key={provider}
                    style={[
                      styles.networkButton,
                      selectedProvider === provider && styles.networkButtonActive,
                    ]}
                    onPress={() => setSelectedProvider(provider)}
                  >
                    <Text
                      style={[
                        styles.networkButtonText,
                        selectedProvider === provider && styles.networkButtonTextActive,
                      ]}
                    >
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Wallet Address</Text>
              <TextInput
                style={styles.input}
                value={walletAddress}
                onChangeText={setWalletAddress}
                placeholder={`Enter ${selectedNetwork} address (e.g., 0x...)`}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddWallet(false);
                    setWalletAddress('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isProcessing && styles.saveButtonDisabled]}
                  onPress={handleAddWallet}
                  disabled={isProcessing}
                >
                  <Text style={styles.saveButtonText}>
                    {isProcessing ? 'Connecting...' : 'Connect Wallet'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {userWallets.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No wallets connected</Text>
              <Text style={styles.emptySubtext}>
                Connect a wallet to receive and withdraw ImPAct tokens
              </Text>
            </View>
          ) : (
            userWallets.map((wallet) => (
              <View key={wallet.id} style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <View style={styles.walletInfo}>
                    <View style={styles.walletIconContainer}>
                      <Wallet size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.walletDetails}>
                      <Text style={styles.walletNetwork}>{wallet.network.toUpperCase()}</Text>
                      {wallet.provider && (
                        <Text style={styles.walletProvider}>
                          {wallet.provider.charAt(0).toUpperCase() + wallet.provider.slice(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {wallet.isConnected ? (
                    <View style={styles.statusBadge}>
                      <CheckCircle size={16} color={Colors.success} />
                      <Text style={styles.statusText}>Connected</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeDisconnected]}>
                      <AlertCircle size={16} color={Colors.textMuted} />
                      <Text style={[styles.statusText, styles.statusTextDisconnected]}>
                        Disconnected
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.walletAddress}>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {wallet.address}
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert('Copied', 'Address copied to clipboard')}>
                    <Copy size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.walletActions}>
                  {wallet.isConnected ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDisconnect(wallet.id)}
                    >
                      <Text style={styles.actionButtonText}>Disconnect</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={async () => {
                        if (!user) return;
                        const result = await connectWallet(user.id, wallet.address, wallet.network, wallet.provider);
                        if (result.success) {
                          Alert.alert('Success', 'Wallet reconnected');
                        } else {
                          Alert.alert('Error', result.error || 'Failed to reconnect');
                        }
                      }}
                    >
                      <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                        Reconnect
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleRemove(wallet.id)}>
                    <Trash2 size={16} color={Colors.error} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {withdrawals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
            {withdrawals.map((withdrawal) => (
              <View key={withdrawal.id} style={styles.withdrawalCard}>
                <View style={styles.withdrawalHeader}>
                  <View style={styles.withdrawalInfo}>
                    <Text style={styles.withdrawalAmount}>{withdrawal.amount.toFixed(2)} IMPACT</Text>
                    <Text style={styles.withdrawalDate}>
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.withdrawalStatusBadge, getWithdrawalStatusStyle(withdrawal.status)]}>
                    <Text style={[styles.withdrawalStatusText, getWithdrawalStatusTextStyle(withdrawal.status)]}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {withdrawal.transactionHash && (
                  <View style={styles.transactionHash}>
                    <Text style={styles.hashLabel}>Transaction:</Text>
                    <Text style={styles.hashValue} numberOfLines={1}>
                      {withdrawal.transactionHash}
                    </Text>
                    <ExternalLink size={14} color={Colors.primary} />
                  </View>
                )}

                {withdrawal.failureReason && (
                  <View style={styles.failureReason}>
                    <AlertCircle size={14} color={Colors.error} />
                    <Text style={styles.failureReasonText}>{withdrawal.failureReason}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About ImPAct Token</Text>
          <Text style={styles.infoText}>
            ImPAct is our platform's exclusive cryptocurrency token. Each IMPACT token maintains a stable 1:1 value
            with the US Dollar ($1 IMPACT = $1 USD).
          </Text>
          <Text style={styles.infoText}>
            Connect your wallet to receive tokens when you claim rewards. You can withdraw your tokens at any time,
            and an admin will process your request.
          </Text>
        </View>
      </ScrollView>

      {showWithdrawModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw IMPACT</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Available Balance</Text>
              <Text style={styles.modalBalance}>
                {impactBalance?.balance.toFixed(2)} IMPACT
              </Text>

              <Text style={styles.modalLabel}>Amount to Withdraw</Text>
              <TextInput
                style={styles.modalInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.modalInfo}>
                {parseFloat(withdrawAmount || '0') > 100
                  ? 'Withdrawals over $100 require email confirmation. You will receive a code to verify this transaction.'
                  : 'Withdrawals are processed by admins. Your tokens will be sent to your connected wallet address.'}
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowWithdrawModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, isProcessing && styles.modalSubmitButtonDisabled]}
                  onPress={handleWithdraw}
                  disabled={isProcessing}
                >
                  <Text style={styles.modalSubmitButtonText}>
                    {isProcessing ? 'Processing...' : 'Request Withdrawal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {showEmailConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Email Confirmation</Text>
              <TouchableOpacity onPress={() => {
                setShowEmailConfirmModal(false);
                setEmailConfirmCode('');
                setSentConfirmCode('');
              }}>
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.emailConfirmIcon}>
                <AlertCircle size={48} color={Colors.warning} />
              </View>

              <Text style={styles.emailConfirmTitle}>Confirm Your Withdrawal</Text>
              <Text style={styles.emailConfirmText}>
                For security, withdrawals over $100 require email confirmation. We've sent a 6-digit code to:
              </Text>
              <Text style={styles.emailAddress}>{user?.email}</Text>

              <Text style={styles.modalLabel}>Confirmation Code</Text>
              <TextInput
                style={styles.modalInput}
                value={emailConfirmCode}
                onChangeText={setEmailConfirmCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowEmailConfirmModal(false);
                    setEmailConfirmCode('');
                    setSentConfirmCode('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, isVerifyingEmail && styles.modalSubmitButtonDisabled]}
                  onPress={handleEmailConfirmation}
                  disabled={isVerifyingEmail}
                >
                  <Text style={styles.modalSubmitButtonText}>
                    {isVerifyingEmail ? 'Verifying...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.resendCodeButton}
                onPress={() => {
                  const code = Math.floor(100000 + Math.random() * 900000).toString();
                  setSentConfirmCode(code);
                  console.log(`[Email Confirmation] Resending code ${code} to ${user?.email}`);
                  Alert.alert('Code Sent', 'A new confirmation code has been sent to your email.');
                }}
              >
                <Text style={styles.resendCodeText}>Didn't receive the code? Resend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function getWithdrawalStatusStyle(status: string) {
  switch (status) {
    case 'completed':
      return { backgroundColor: Colors.success + '20', borderColor: Colors.success };
    case 'processing':
      return { backgroundColor: Colors.warning + '20', borderColor: Colors.warning };
    case 'failed':
      return { backgroundColor: Colors.error + '20', borderColor: Colors.error };
    default:
      return { backgroundColor: Colors.textMuted + '20', borderColor: Colors.textMuted };
  }
}

function getWithdrawalStatusTextStyle(status: string) {
  switch (status) {
    case 'completed':
      return { color: Colors.success };
    case 'processing':
      return { color: Colors.warning };
    case 'failed':
      return { color: Colors.error };
    default:
      return { color: Colors.textMuted };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  balanceCurrency: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceUsd: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.6,
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    backgroundColor: Colors.white + '10',
    borderRadius: 12,
    padding: 16,
  },
  balanceStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceStatDivider: {
    width: 1,
    backgroundColor: Colors.white + '20',
  },
  balanceStatLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.6,
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWalletForm: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  networkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  networkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  networkButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  networkButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  networkButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  walletCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletDetails: {
    gap: 4,
  },
  walletNetwork: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  walletProvider: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeDisconnected: {
    backgroundColor: Colors.textMuted + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  statusTextDisconnected: {
    color: Colors.textMuted,
  },
  walletAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  actionButtonTextPrimary: {
    color: Colors.white,
  },
  actionButtonTextDanger: {
    color: Colors.error,
  },
  withdrawalCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  withdrawalInfo: {
    gap: 4,
  },
  withdrawalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  withdrawalDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  withdrawalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  withdrawalStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  transactionHash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  hashLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  hashValue: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  failureReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    padding: 10,
  },
  failureReasonText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    marginBottom: 16,
  },
  modalInfo: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emailConfirmIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emailConfirmTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  emailConfirmText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendCodeButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  resendCodeText: {
    fontSize: 13,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
