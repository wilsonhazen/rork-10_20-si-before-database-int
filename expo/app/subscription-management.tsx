import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Check, X, Crown, Zap, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMonetization, SUBSCRIPTION_PLANS, type BillingPeriod, type SubscriptionTier } from '@/contexts/MonetizationContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionManagementScreen() {
  const { user } = useAuth();
  const { getUserSubscription, getUserTier, createSubscription, upgradeSubscription, cancelSubscription } = useMonetization();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const currentSubscription = user ? getUserSubscription(user.id) : undefined;
  const currentTier = user ? getUserTier(user.id) : 'free';

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to subscribe');
      return;
    }

    if (tier === currentTier) {
      Alert.alert('Already Subscribed', `You are already on the ${tier} plan`);
      return;
    }

    setLoading(tier);

    try {
      const result = currentSubscription
        ? await upgradeSubscription(user.id, tier, billingPeriod)
        : await createSubscription(user.id, tier, billingPeriod, 'stripe');

      if (result.success) {
        Alert.alert('Success', `Successfully ${currentSubscription ? 'upgraded to' : 'subscribed to'} ${tier} plan!`);
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('[Subscription] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = () => {
    if (!currentSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelSubscription(currentSubscription.id);
            if (result.success) {
              Alert.alert('Cancelled', 'Your subscription has been cancelled');
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return Colors.primary;
      case 'pro':
        return Colors.warning;
      case 'enterprise':
        return '#9333EA';
      default:
        return Colors.textMuted;
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return Zap;
      case 'pro':
        return TrendingUp;
      case 'enterprise':
        return Crown;
      default:
        return Check;
    }
  };

  const getSavingsPercentage = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const monthlyCost = monthlyPrice * 12;
    return Math.round(((monthlyCost - yearlyPrice) / monthlyCost) * 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Subscription Plans',
          headerStyle: { backgroundColor: Colors.darkCard },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock premium features and grow your business
          </Text>

          <View style={styles.billingToggle}>
            <Text style={[styles.billingLabel, billingPeriod === 'monthly' && styles.billingLabelActive]}>
              Monthly
            </Text>
            <Switch
              value={billingPeriod === 'yearly'}
              onValueChange={(value) => setBillingPeriod(value ? 'yearly' : 'monthly')}
              trackColor={{ false: Colors.darkBorder, true: Colors.success }}
              thumbColor={Colors.text}
            />
            <Text style={[styles.billingLabel, billingPeriod === 'yearly' && styles.billingLabelActive]}>
              Yearly
            </Text>
            {billingPeriod === 'yearly' && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>Save up to 20%</Text>
              </View>
            )}
          </View>
        </View>

        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = getTierIcon(plan.tier);
          const isCurrentPlan = plan.tier === currentTier;
          const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const displayPrice = billingPeriod === 'yearly' ? (price / 12).toFixed(2) : price.toFixed(2);
          const savings = getSavingsPercentage(plan.monthlyPrice, plan.yearlyPrice);
          const tierColor = getTierColor(plan.tier);

          return (
            <View key={plan.tier} style={styles.planCard}>
              {plan.tier === 'pro' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${tierColor}20` }]}>
                  <Icon size={24} color={tierColor} />
                </View>
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current Plan</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{displayPrice}</Text>
                <Text style={styles.pricePeriod}>/mo</Text>
              </View>

              {billingPeriod === 'yearly' && savings > 0 && (
                <Text style={styles.savingsText}>Save {savings}% with yearly billing</Text>
              )}

              {plan.tier === 'free' ? (
                <TouchableOpacity
                  style={[styles.button, styles.buttonOutline]}
                  disabled={isCurrentPlan}
                >
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>
                    {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.button,
                    loading === plan.tier && styles.buttonDisabled,
                    isCurrentPlan && styles.buttonOutline,
                  ]}
                  onPress={() => handleSubscribe(plan.tier)}
                  disabled={loading !== null || isCurrentPlan}
                >
                  <LinearGradient
                    colors={isCurrentPlan ? [Colors.darkCard, Colors.darkCard] : [tierColor, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={[styles.buttonText, isCurrentPlan && styles.buttonTextOutline]}>
                      {loading === plan.tier
                        ? 'Processing...'
                        : isCurrentPlan
                        ? 'Current Plan'
                        : currentSubscription
                        ? 'Upgrade'
                        : 'Subscribe'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Check size={16} color={Colors.success} strokeWidth={3} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.limits.monthlyApplications && (
                <View style={styles.limitsContainer}>
                  <Text style={styles.limitsTitle}>Usage Limits:</Text>
                  <Text style={styles.limitsText}>
                    • {plan.limits.monthlyApplications} applications/month
                  </Text>
                  {plan.limits.monthlyGigPosts && (
                    <Text style={styles.limitsText}>
                      • {plan.limits.monthlyGigPosts} gig posts/month
                    </Text>
                  )}
                  {plan.limits.aiCredits && (
                    <Text style={styles.limitsText}>
                      • {plan.limits.aiCredits} AI credits/month
                    </Text>
                  )}
                  {plan.limits.campaignsCount && (
                    <Text style={styles.limitsText}>
                      • {plan.limits.campaignsCount} active campaigns
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {currentSubscription && currentSubscription.status === 'active' && (
          <View style={styles.manageSection}>
            <Text style={styles.manageSectionTitle}>Manage Subscription</Text>
            <View style={styles.subscriptionInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Plan:</Text>
                <Text style={styles.infoValue}>{currentSubscription.tier}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Billing Period:</Text>
                <Text style={styles.infoValue}>{currentSubscription.billingPeriod}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price:</Text>
                <Text style={styles.infoValue}>${currentSubscription.price}/mo</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Next Billing:</Text>
                <Text style={styles.infoValue}>
                  {new Date(currentSubscription.endDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Auto Renew:</Text>
                <Text style={styles.infoValue}>
                  {currentSubscription.autoRenew ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <X size={18} color={Colors.danger} />
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include 24/7 support and regular platform updates.
          </Text>
          <Text style={styles.footerText}>
            Prices are in USD. Taxes may apply.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  billingLabel: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  billingLabelActive: {
    color: Colors.text,
  },
  savingsBadge: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.darkBg,
  },
  planCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.darkBg,
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  currentBadge: {
    backgroundColor: Colors.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.darkBg,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pricePeriod: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 18,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  buttonTextOutline: {
    color: Colors.textSecondary,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  limitsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.darkBorder,
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  limitsText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  manageSection: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  manageSectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  subscriptionInfo: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  footer: {
    padding: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
