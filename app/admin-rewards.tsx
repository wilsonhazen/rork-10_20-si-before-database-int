import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useRewards } from '@/contexts/RewardsContext';
import { Plus, Trash2, ToggleLeft, ToggleRight, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { RewardTriggerType, RewardType } from '@/types';

export default function AdminRewardsScreen() {
  const { triggers, definitions, addTrigger, updateTrigger, deleteTrigger, addDefinition, updateDefinition, deleteDefinition } = useRewards();
  const [showAddTrigger, setShowAddTrigger] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  const [triggerForm, setTriggerForm] = useState({
    type: 'account_created' as RewardTriggerType,
    name: '',
    description: '',
    dealsCount: '',
    earningsAmount: '',
    referralsCount: '',
  });

  const [rewardForm, setRewardForm] = useState({
    triggerId: '',
    name: '',
    description: '',
    rewardType: 'crypto' as RewardType,
    amount: '',
    currency: 'IMPACT',
    cryptoWalletAddress: '',
    badgeColor: '#6366F1',
  });

  const handleAddTrigger = async () => {
    if (!triggerForm.name.trim() || !triggerForm.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newTrigger = {
      id: `trigger_${Date.now()}`,
      type: triggerForm.type,
      name: triggerForm.name.trim(),
      description: triggerForm.description.trim(),
      conditions: {
        dealsCount: triggerForm.dealsCount ? parseInt(triggerForm.dealsCount) : undefined,
        earningsAmount: triggerForm.earningsAmount ? parseFloat(triggerForm.earningsAmount) : undefined,
        referralsCount: triggerForm.referralsCount ? parseInt(triggerForm.referralsCount) : undefined,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await addTrigger(newTrigger);
    setShowAddTrigger(false);
    setTriggerForm({
      type: 'account_created',
      name: '',
      description: '',
      dealsCount: '',
      earningsAmount: '',
      referralsCount: '',
    });
    Alert.alert('Success', 'Trigger created successfully');
  };

  const handleAddReward = async () => {
    if (!rewardForm.triggerId || !rewardForm.name.trim() || !rewardForm.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newReward = {
      id: `reward_${Date.now()}`,
      triggerId: rewardForm.triggerId,
      name: rewardForm.name.trim(),
      description: rewardForm.description.trim(),
      rewardType: rewardForm.rewardType,
      amount: parseFloat(rewardForm.amount),
      currency: rewardForm.rewardType === 'crypto' ? 'IMPACT' : undefined,
      cryptoWalletAddress: rewardForm.rewardType === 'crypto' ? rewardForm.cryptoWalletAddress : undefined,
      badgeColor: rewardForm.rewardType === 'badge' ? rewardForm.badgeColor : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await addDefinition(newReward);
    setShowAddReward(false);
    setRewardForm({
      triggerId: '',
      name: '',
      description: '',
      rewardType: 'crypto',
      amount: '',
      currency: 'IMPACT',
      cryptoWalletAddress: '',
      badgeColor: '#6366F1',
    });
    Alert.alert('Success', 'Reward created successfully');
  };

  const handleToggleTrigger = async (id: string, currentStatus: boolean) => {
    await updateTrigger(id, { isActive: !currentStatus });
  };

  const handleToggleReward = async (id: string, currentStatus: boolean) => {
    await updateDefinition(id, { isActive: !currentStatus });
  };

  const handleDeleteTrigger = (id: string) => {
    Alert.alert(
      'Delete Trigger',
      'Are you sure you want to delete this trigger? All associated rewards will also be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTrigger(id)
        }
      ]
    );
  };

  const handleDeleteReward = (id: string) => {
    Alert.alert(
      'Delete Reward',
      'Are you sure you want to delete this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteDefinition(id)
        }
      ]
    );
  };

  const triggerTypes: { value: RewardTriggerType; label: string }[] = [
    { value: 'account_created', label: 'Account Created' },
    { value: 'first_deal_completed', label: 'First Deal Completed' },
    { value: 'referral_signup', label: 'Referral Signup' },
    { value: 'deals_milestone', label: 'Deals Milestone' },
    { value: 'earnings_milestone', label: 'Earnings Milestone' },
    { value: 'profile_completed', label: 'Profile Completed' },
    { value: 'social_verified', label: 'Social Verified' },
    { value: 'custom', label: 'Custom' },
  ];

  const rewardTypes: { value: RewardType; label: string }[] = [
    { value: 'crypto', label: 'IMPACT Token' },
    { value: 'badge', label: 'Badge' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Manage Rewards',
          headerStyle: { backgroundColor: Colors.darkCard },
          headerTintColor: Colors.white,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward Triggers</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddTrigger(!showAddTrigger)}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Trigger</Text>
            </TouchableOpacity>
          </View>

          {showAddTrigger && (
            <View style={styles.form}>
              <Text style={styles.formLabel}>Trigger Type</Text>
              <View style={styles.typeButtons}>
                {triggerTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      triggerForm.type === type.value && styles.typeButtonActive
                    ]}
                    onPress={() => setTriggerForm({ ...triggerForm, type: type.value })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      triggerForm.type === type.value && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={triggerForm.name}
                onChangeText={(text) => setTriggerForm({ ...triggerForm, name: text })}
                placeholder="e.g., Welcome Bonus"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={triggerForm.description}
                onChangeText={(text) => setTriggerForm({ ...triggerForm, description: text })}
                placeholder="Describe when this trigger activates"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />

              {(triggerForm.type === 'deals_milestone') && (
                <>
                  <Text style={styles.formLabel}>Deals Count</Text>
                  <TextInput
                    style={styles.input}
                    value={triggerForm.dealsCount}
                    onChangeText={(text) => setTriggerForm({ ...triggerForm, dealsCount: text })}
                    placeholder="e.g., 10"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </>
              )}

              {(triggerForm.type === 'earnings_milestone') && (
                <>
                  <Text style={styles.formLabel}>Earnings Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={triggerForm.earningsAmount}
                    onChangeText={(text) => setTriggerForm({ ...triggerForm, earningsAmount: text })}
                    placeholder="e.g., 1000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </>
              )}

              {(triggerForm.type === 'referral_signup') && (
                <>
                  <Text style={styles.formLabel}>Referrals Count</Text>
                  <TextInput
                    style={styles.input}
                    value={triggerForm.referralsCount}
                    onChangeText={(text) => setTriggerForm({ ...triggerForm, referralsCount: text })}
                    placeholder="e.g., 5"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </>
              )}

              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddTrigger(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddTrigger}
                >
                  <Text style={styles.saveButtonText}>Create Trigger</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {triggers.map((trigger) => (
            <View key={trigger.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{trigger.name}</Text>
                  <Text style={styles.cardSubtitle}>{trigger.type.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleToggleTrigger(trigger.id, trigger.isActive)}>
                    {trigger.isActive ? (
                      <ToggleRight size={24} color={Colors.success} />
                    ) : (
                      <ToggleLeft size={24} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTrigger(trigger.id)}>
                    <Trash2 size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardDescription}>{trigger.description}</Text>
              {Object.keys(trigger.conditions).length > 0 && (
                <View style={styles.conditions}>
                  {trigger.conditions.dealsCount && (
                    <Text style={styles.conditionText}>Deals: {trigger.conditions.dealsCount}</Text>
                  )}
                  {trigger.conditions.earningsAmount && (
                    <Text style={styles.conditionText}>Earnings: ${trigger.conditions.earningsAmount}</Text>
                  )}
                  {trigger.conditions.referralsCount && (
                    <Text style={styles.conditionText}>Referrals: {trigger.conditions.referralsCount}</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward Definitions</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddReward(!showAddReward)}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Reward</Text>
            </TouchableOpacity>
          </View>

          {showAddReward && (
            <View style={styles.form}>
              <Text style={styles.formLabel}>Select Trigger *</Text>
              <View style={styles.triggerSelect}>
                {triggers.map((trigger) => (
                  <TouchableOpacity
                    key={trigger.id}
                    style={[
                      styles.triggerOption,
                      rewardForm.triggerId === trigger.id && styles.triggerOptionActive
                    ]}
                    onPress={() => setRewardForm({ ...rewardForm, triggerId: trigger.id })}
                  >
                    <Text style={[
                      styles.triggerOptionText,
                      rewardForm.triggerId === trigger.id && styles.triggerOptionTextActive
                    ]}>
                      {trigger.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Reward Type</Text>
              <View style={styles.typeButtons}>
                {rewardTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      rewardForm.rewardType === type.value && styles.typeButtonActive
                    ]}
                    onPress={() => setRewardForm({ ...rewardForm, rewardType: type.value })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      rewardForm.rewardType === type.value && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={rewardForm.name}
                onChangeText={(text) => setRewardForm({ ...rewardForm, name: text })}
                placeholder="e.g., 100 Welcome Points"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={rewardForm.description}
                onChangeText={(text) => setRewardForm({ ...rewardForm, description: text })}
                placeholder="Describe the reward"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.formLabel}>Amount (IMPACT) *</Text>
              <TextInput
                style={styles.input}
                value={rewardForm.amount}
                onChangeText={(text) => setRewardForm({ ...rewardForm, amount: text })}
                placeholder="e.g., 1.5 (equals $1.50)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              {rewardForm.rewardType === 'crypto' && rewardForm.amount && (
                <Text style={styles.conversionText}>
                  ≈ ${parseFloat(rewardForm.amount || '0').toFixed(2)} USD (1 IMPACT = $1.00)
                </Text>
              )}

              {rewardForm.rewardType === 'crypto' && (
                <>
                  <Text style={styles.formLabel}>Source Wallet Address</Text>
                  <TextInput
                    style={styles.input}
                    value={rewardForm.cryptoWalletAddress}
                    onChangeText={(text) => setRewardForm({ ...rewardForm, cryptoWalletAddress: text })}
                    placeholder="0x..."
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                  />
                </>
              )}

              {rewardForm.rewardType === 'badge' && (
                <>
                  <Text style={styles.formLabel}>Badge Color</Text>
                  <TextInput
                    style={styles.input}
                    value={rewardForm.badgeColor}
                    onChangeText={(text) => setRewardForm({ ...rewardForm, badgeColor: text })}
                    placeholder="#6366F1"
                    placeholderTextColor={Colors.textMuted}
                  />
                </>
              )}

              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddReward(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddReward}
                >
                  <Text style={styles.saveButtonText}>Create Reward</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {definitions.map((reward) => {
            const trigger = triggers.find(t => t.id === reward.triggerId);
            return (
              <View key={reward.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{reward.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {trigger?.name || 'Unknown Trigger'} • {reward.rewardType}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleToggleReward(reward.id, reward.isActive)}>
                      {reward.isActive ? (
                        <ToggleRight size={24} color={Colors.success} />
                      ) : (
                        <ToggleLeft size={24} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteReward(reward.id)}>
                      <Trash2 size={20} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {reward.description && (
                  <Text style={styles.cardDescription}>{reward.description}</Text>
                )}
                <View style={styles.rewardDetails}>
                  <View style={styles.rewardAmount}>
                    <Award size={16} color={Colors.primary} />
                    {reward.rewardType === 'crypto' ? (
                      <Text style={styles.rewardAmountText}>
                        {reward.amount} IMPACT (${reward.amount.toFixed(2)} USD)
                      </Text>
                    ) : (
                      <Text style={styles.rewardAmountText}>
                        {reward.amount} {reward.currency || ''}
                      </Text>
                    )}
                  </View>
                  {reward.cryptoWalletAddress && (
                    <Text style={styles.walletText} numberOfLines={1}>
                      Wallet: {reward.cryptoWalletAddress}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  form: {
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
    marginTop: 8,
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  typeButtonTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  triggerSelect: {
    gap: 8,
    marginBottom: 8,
  },
  triggerOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  triggerOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  triggerOptionText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  triggerOptionTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
    lineHeight: 20,
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  conditionText: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardDetails: {
    gap: 8,
    marginTop: 8,
  },
  rewardAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardAmountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  walletText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  conversionText: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 8,
  },
});
