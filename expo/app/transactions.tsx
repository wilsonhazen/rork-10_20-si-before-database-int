import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getUserTransactions, getUserBalance } = usePayment();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view transactions</Text>
      </View>
    );
  }

  const balance = getUserBalance(user.id);
  const allTransactions = getUserTransactions(user.id);

  const filteredTransactions = allTransactions.filter(t => {
    if (filter === 'income') {
      return t.toUser === user.id && (t.type === 'release' || t.type === 'agent_commission' || t.type === 'refund');
    } else if (filter === 'expense') {
      return t.fromUser === user.id && (t.type === 'escrow_lock' || t.type === 'withdrawal');
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'release':
      case 'agent_commission':
      case 'refund':
      case 'payment_in':
        return <ArrowDownLeft size={20} color={colors.success} />;
      case 'escrow_lock':
      case 'withdrawal':
      case 'commission_deduct':
        return <ArrowUpRight size={20} color={colors.error} />;
      default:
        return <RefreshCw size={20} color={colors.textSecondary} />;
    }
  };

  const getTransactionColor = (type: string, userId: string, fromUser: string, toUser: string) => {
    if (toUser === userId && (type === 'release' || type === 'agent_commission' || type === 'refund' || type === 'payment_in')) {
      return colors.success;
    } else if (fromUser === userId && (type === 'escrow_lock' || type === 'withdrawal')) {
      return colors.error;
    }
    return colors.textSecondary;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Transactions',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />

      <View style={styles.balanceCard}>
        <View style={styles.balanceIconContainer}>
          <DollarSign size={32} color={colors.primary} />
        </View>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>${balance?.availableBalance.toFixed(2) || '0.00'}</Text>
        {balance && balance.escrowBalance > 0 && (
          <Text style={styles.escrowText}>
            ${balance.escrowBalance.toFixed(2)} in escrow
          </Text>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterButtonText, filter === 'income' && styles.filterButtonTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterButtonText, filter === 'expense' && styles.filterButtonTextActive]}>
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  {getTransactionIcon(transaction.type)}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || transaction.type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.timestamp).toLocaleDateString()} at{' '}
                    {new Date(transaction.timestamp).toLocaleTimeString()}
                  </Text>
                  {transaction.attribution && (
                    <Text style={styles.transactionAttribution}>
                      Agent Commission: {transaction.attribution.recruitedType}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction.type, user.id, transaction.fromUser, transaction.toUser) }
                  ]}
                >
                  {transaction.toUser === user.id ? '+' : '-'}${transaction.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  balanceCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: colors.text,
  },
  escrowText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
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
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAttribution: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
    textTransform: 'capitalize' as const,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
