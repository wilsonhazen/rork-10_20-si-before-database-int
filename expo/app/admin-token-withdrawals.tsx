import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function AdminTokenWithdrawalsScreen() {
  const { user } = useAuth();
  const { getPendingWithdrawals, processWithdrawal, failWithdrawal, getUserBalance } = useWallet();

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingWithdrawals = getPendingWithdrawals();

  const handleApprove = async (withdrawalId: string) => {
    if (!transactionHash.trim()) {
      Alert.alert('Error', 'Please enter the transaction hash from the blockchain');
      return;
    }

    Alert.alert(
      'Confirm Approval',
      'Have you successfully sent the tokens to the user wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);
            const result = await processWithdrawal(withdrawalId, transactionHash);
            setIsProcessing(false);

            if (result.success) {
              setSelectedWithdrawal(null);
              setTransactionHash('');
              Alert.alert('Success', 'Withdrawal approved and processed');
            } else {
              Alert.alert('Error', result.error || 'Failed to process withdrawal');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (withdrawalId: string) => {
    if (!failureReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Confirm Rejection',
      'This will return the tokens to the user. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            await failWithdrawal(withdrawalId, failureReason);
            setIsProcessing(false);

            setSelectedWithdrawal(null);
            setFailureReason('');
            Alert.alert('Success', 'Withdrawal rejected. Tokens returned to user.');
          },
        },
      ]
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorText}>Admin access required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Wallet size={32} color={Colors.warning} />
          </View>
          <Text style={styles.headerTitle}>Token Withdrawals</Text>
          <Text style={styles.headerSubtitle}>Process ImPAct token withdrawal requests</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingWithdrawals.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>

        {pendingWithdrawals.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No pending withdrawals</Text>
            <Text style={styles.emptySubtext}>All withdrawal requests have been processed</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Withdrawals</Text>

            {pendingWithdrawals.map((withdrawal) => {
              const userBalance = getUserBalance(withdrawal.userId, withdrawal.walletAddress);
              const isExpanded = selectedWithdrawal === withdrawal.id;

              return (
                <View key={withdrawal.id} style={styles.withdrawalCard}>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedWithdrawal(isExpanded ? null : withdrawal.id)
                    }
                  >
                    <View style={styles.withdrawalHeader}>
                      <View style={styles.withdrawalInfo}>
                        <Text style={styles.withdrawalAmount}>
                          {withdrawal.amount.toFixed(2)} IMPACT
                        </Text>
                        <Text style={styles.withdrawalDate}>
                          Requested {new Date(withdrawal.requestedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.withdrawalStatusBadge}>
                        <Clock size={14} color={Colors.warning} />
                        <Text style={styles.withdrawalStatusText}>
                          {withdrawal.status === 'pending' ? 'Pending' : 'Processing'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.withdrawalDetails}>
                      <Text style={styles.detailLabel}>Wallet Address:</Text>
                      <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1}>
                          {withdrawal.walletAddress}
                        </Text>
                        <ExternalLink size={14} color={Colors.primary} />
                      </View>

                      <Text style={styles.detailLabel}>User Balance:</Text>
                      <Text style={styles.detailValue}>
                        Available: {userBalance?.balance.toFixed(2) || '0.00'} IMPACT
                      </Text>
                      <Text style={styles.detailValue}>
                        Locked: {userBalance?.lockedBalance.toFixed(2) || '0.00'} IMPACT
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.actionSection}>
                      <View style={styles.actionTabs}>
                        <TouchableOpacity
                          style={[styles.actionTab, styles.actionTabApprove]}
                          onPress={() => {
                            setFailureReason('');
                          }}
                        >
                          <CheckCircle size={20} color={Colors.success} />
                          <Text style={styles.actionTabText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionTab, styles.actionTabReject]}
                          onPress={() => {
                            setTransactionHash('');
                          }}
                        >
                          <XCircle size={20} color={Colors.error} />
                          <Text style={styles.actionTabText}>Reject</Text>
                        </TouchableOpacity>
                      </View>

                      {!failureReason && (
                        <View style={styles.approveForm}>
                          <Text style={styles.formTitle}>Approve Withdrawal</Text>
                          <Text style={styles.formLabel}>Transaction Hash *</Text>
                          <TextInput
                            style={styles.input}
                            value={transactionHash}
                            onChangeText={setTransactionHash}
                            placeholder="0x..."
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <Text style={styles.formInfo}>
                            Enter the blockchain transaction hash after sending {withdrawal.amount.toFixed(2)}{' '}
                            IMPACT to the wallet address above.
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.submitButton,
                              styles.approveButton,
                              isProcessing && styles.submitButtonDisabled,
                            ]}
                            onPress={() => handleApprove(withdrawal.id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle size={18} color={Colors.white} />
                            <Text style={styles.submitButtonText}>
                              {isProcessing ? 'Processing...' : 'Approve & Complete'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {failureReason !== '' && (
                        <View style={styles.rejectForm}>
                          <Text style={styles.formTitle}>Reject Withdrawal</Text>
                          <Text style={styles.formLabel}>Reason for Rejection *</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={failureReason}
                            onChangeText={setFailureReason}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={3}
                          />
                          <Text style={styles.formInfo}>
                            The tokens will be returned to the user wallet and they will be notified
                            with this reason.
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.submitButton,
                              styles.rejectButton,
                              isProcessing && styles.submitButtonDisabled,
                            ]}
                            onPress={() => handleReject(withdrawal.id)}
                            disabled={isProcessing}
                          >
                            <XCircle size={18} color={Colors.white} />
                            <Text style={styles.submitButtonText}>
                              {isProcessing ? 'Processing...' : 'Reject & Return Tokens'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Admin Instructions</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1.</Text>
            <Text style={styles.infoText}>
              Review the withdrawal request and verify the wallet address
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2.</Text>
            <Text style={styles.infoText}>
              Send the exact amount of IMPACT tokens to the user wallet address using your admin
              wallet
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3.</Text>
            <Text style={styles.infoText}>
              Copy the blockchain transaction hash and paste it in the approval form
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>4.</Text>
            <Text style={styles.infoText}>
              Click Approve to complete the withdrawal and notify the user
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warning + '20',
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
  },
  statsCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.darkBorder,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 16,
  },
  withdrawalCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    overflow: 'hidden',
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  withdrawalInfo: {
    flex: 1,
    gap: 4,
  },
  withdrawalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  withdrawalDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  withdrawalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  withdrawalStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  withdrawalDetails: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.white,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
    padding: 16,
  },
  actionTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  actionTabApprove: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  actionTabReject: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  actionTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  approveForm: {
    gap: 12,
  },
  rejectForm: {
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formInfo: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
