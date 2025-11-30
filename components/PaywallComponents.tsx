import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Crown, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMonetization, type SubscriptionTier, PREMIUM_FEATURES } from '@/contexts/MonetizationContext';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  featureId?: string;
  requiredTier?: SubscriptionTier;
  title?: string;
  description?: string;
}

export function Paywall({
  visible,
  onClose,
  featureId,
  requiredTier,
  title,
  description,
}: PaywallProps) {
  const { plans } = useMonetization();


  const feature = featureId ? PREMIUM_FEATURES.find(f => f.id === featureId) : null;
  const tier = requiredTier || feature?.requiredTier || 'basic';
  const plan = plans.find(p => p.tier === tier);

  const paywallTitle = title || feature?.name || 'Premium Feature';
  const paywallDescription =
    description ||
    feature?.description ||
    'This feature requires a premium subscription';

  const handleUpgrade = () => {
    onClose();
    router.push('/subscription-management');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>

          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Lock size={32} color={Colors.text} />
          </LinearGradient>

          <Text style={styles.title}>{paywallTitle}</Text>
          <Text style={styles.description}>{paywallDescription}</Text>

          {plan && (
            <View style={styles.planInfo}>
              <View style={styles.planHeader}>
                <Crown size={20} color={Colors.warning} />
                <Text style={styles.planName}>{plan.name} Plan Required</Text>
              </View>
              <Text style={styles.planPrice}>
                Starting at ${plan.monthlyPrice}/month
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeText}>Upgrade Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface FeatureLockProps {
  featureId: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureLock({ featureId, children, fallback }: FeatureLockProps) {
  const { user } = useAuth();
  const { hasFeatureAccess } = useMonetization();
  const [showPaywall, setShowPaywall] = React.useState(false);

  const hasAccess = user ? hasFeatureAccess(user.id, featureId) : false;

  if (hasAccess) {
    return <>{children}</>;
  }

  const feature = PREMIUM_FEATURES.find(f => f.id === featureId);

  return (
    <>
      {fallback || (
        <TouchableOpacity
          style={styles.lockedContainer}
          onPress={() => setShowPaywall(true)}
        >
          <Lock size={24} color={Colors.textMuted} />
          <Text style={styles.lockedText}>
            {feature?.name || 'This feature'} is locked
          </Text>
          <Text style={styles.lockedSubtext}>Tap to upgrade</Text>
        </TouchableOpacity>
      )}

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureId={featureId}
      />
    </>
  );
}

interface UsageLimitProps {
  limitType: 'monthlyApplications' | 'monthlyGigPosts' | 'aiCredits' | 'campaignsCount';
  currentUsage: number;
  children?: React.ReactNode;
}

export function UsageLimit({ limitType, currentUsage, children }: UsageLimitProps) {
  const { user } = useAuth();
  const { checkLimit } = useMonetization();
  const [showPaywall, setShowPaywall] = React.useState(false);

  if (!user) return null;

  const limitCheck = checkLimit(user.id, limitType, currentUsage);

  if (limitCheck.allowed) {
    return <>{children}</>;
  }

  const limitNames: Record<typeof limitType, string> = {
    monthlyApplications: 'Monthly Applications',
    monthlyGigPosts: 'Monthly Gig Posts',
    aiCredits: 'AI Credits',
    campaignsCount: 'Active Campaigns',
  };

  return (
    <>
      <View style={styles.limitContainer}>
        <View style={styles.limitHeader}>
          <Lock size={20} color={Colors.warning} />
          <Text style={styles.limitTitle}>Limit Reached</Text>
        </View>
        <Text style={styles.limitDescription}>
          You&apos;ve reached your {limitNames[limitType]} limit ({limitCheck.limit})
        </Text>
        <TouchableOpacity
          style={styles.limitUpgradeButton}
          onPress={() => setShowPaywall(true)}
        >
          <Text style={styles.limitUpgradeText}>Upgrade for More</Text>
        </TouchableOpacity>
      </View>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Increase Your Limits"
        description={`Upgrade to get more ${limitNames[limitType]} and unlock other premium features`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  planInfo: {
    backgroundColor: Colors.darkBg,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  planPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  lockedContainer: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderStyle: 'dashed',
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 12,
  },
  lockedSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  limitContainer: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  limitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  limitUpgradeButton: {
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  limitUpgradeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.darkBg,
  },
});
