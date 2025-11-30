import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Plus, Trash2, Check, Bitcoin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

interface PaymentMethodData {
  id: string;
  type: 'card' | 'crypto';
  name: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  walletAddress?: string;
  network?: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddCrypto, setShowAddCrypto] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState<'ethereum' | 'polygon' | 'solana'>('ethereum');

  const handleAddCard = () => {
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    const last4 = cardNumber.slice(-4);
    const [month, year] = expiryDate.split('/');

    const newCard: PaymentMethodData = {
      id: Date.now().toString(),
      type: 'card',
      name: `Card ending in ${last4}`,
      last4,
      brand: 'Visa',
      expiryMonth: parseInt(month),
      expiryYear: parseInt(`20${year}`),
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newCard]);
    setShowAddCard(false);
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCvv('');
    Alert.alert('Success', 'Payment method added successfully');
  };

  const handleAddCrypto = () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    const newWallet: PaymentMethodData = {
      id: Date.now().toString(),
      type: 'crypto',
      name: `${network.charAt(0).toUpperCase() + network.slice(1)} Wallet`,
      walletAddress,
      network,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newWallet]);
    setShowAddCrypto(false);
    setWalletAddress('');
    Alert.alert('Success', 'Crypto wallet added successfully');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleDelete = (id: string) => {
    const method = paymentMethods.find((pm) => pm.id === id);
    if (method?.isDefault && paymentMethods.length > 1) {
      Alert.alert('Error', 'Cannot delete default payment method. Set another as default first.');
      return;
    }

    Alert.alert('Delete Payment Method', 'Are you sure you want to delete this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Payment Methods',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Payment Methods</Text>

          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodIcon}>
                {method.type === 'card' ? (
                  <CreditCard size={24} color={colors.primary} />
                ) : (
                  <Bitcoin size={24} color={colors.warning} />
                )}
              </View>

              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                  <Text style={styles.methodDetails}>
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </Text>
                )}
                {method.type === 'crypto' && method.walletAddress && (
                  <Text style={styles.methodDetails} numberOfLines={1}>
                    {method.walletAddress.slice(0, 10)}...{method.walletAddress.slice(-8)}
                  </Text>
                )}
              </View>

              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Check size={14} color="#FFF" />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}

              <View style={styles.methodActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Text style={styles.setDefaultText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(method.id)}
                >
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {paymentMethods.length === 0 && (
            <View style={styles.emptyState}>
              <CreditCard size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No payment methods added</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Payment Method</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddCard(!showAddCard)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Credit/Debit Card</Text>
          </TouchableOpacity>

          {showAddCard && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor={colors.textSecondary}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={16}
              />
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                placeholderTextColor={colors.textSecondary}
                value={cardName}
                onChangeText={setCardName}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textSecondary}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  placeholderTextColor={colors.textSecondary}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddCard}>
                <Text style={styles.submitButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, { marginTop: 12 }]}
            onPress={() => setShowAddCrypto(!showAddCrypto)}
          >
            <Plus size={20} color={colors.warning} />
            <Text style={styles.addButtonText}>Add Crypto Wallet</Text>
          </TouchableOpacity>

          {showAddCrypto && (
            <View style={styles.addForm}>
              <Text style={styles.label}>Network</Text>
              <View style={styles.networkButtons}>
                {(['ethereum', 'polygon', 'solana'] as const).map((net) => (
                  <TouchableOpacity
                    key={net}
                    style={[
                      styles.networkButton,
                      network === net && styles.networkButtonActive,
                    ]}
                    onPress={() => setNetwork(net)}
                  >
                    <Text
                      style={[
                        styles.networkButtonText,
                        network === net && styles.networkButtonTextActive,
                      ]}
                    >
                      {net.charAt(0).toUpperCase() + net.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Wallet Address"
                placeholderTextColor={colors.textSecondary}
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleAddCrypto}>
                <Text style={styles.submitButtonText}>Add Wallet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  addForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  networkButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  networkButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkButtonActive: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  networkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  networkButtonTextActive: {
    color: colors.warning,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
