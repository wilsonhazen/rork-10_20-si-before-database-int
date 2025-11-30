import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentVerification } from '@/contexts/AgentVerificationContext';
import { CheckCircle2, Mail, Phone, Shield, AlertCircle, CreditCard } from 'lucide-react-native';
import colors from '@/constants/colors';

type VerificationStep = 'overview' | 'email' | 'phone' | 'id';

export default function AgentVerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getVerification, initiateEmailVerification, verifyEmail, initiatePhoneVerification, verifyPhone } = useAgentVerification();

  const [currentStep, setCurrentStep] = useState<VerificationStep>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  const [emailCode, setEmailCode] = useState('');
  const [sentEmailCode, setSentEmailCode] = useState<string | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState(user?.email?.split('@')[0] || '');
  const [phoneCode, setPhoneCode] = useState('');
  const [sentPhoneCode, setSentPhoneCode] = useState<string | null>(null);
  


  if (!user || user.role !== 'agent') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Agent role required.</Text>
      </View>
    );
  }

  const verification = getVerification(user.id);

  const handleSendEmailCode = async () => {
    setIsLoading(true);
    try {
      const result = await initiateEmailVerification(user.id, user.email);
      if (result.success && result.code) {
        setSentEmailCode(result.code);
        Alert.alert('Code Sent', `Verification code sent to ${user.email}\n\nFor demo purposes, use code: ${result.code}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode || emailCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmail(user.id, emailCode);
      if (result.success) {
        Alert.alert('Success', 'Email verified successfully!', [
          { text: 'OK', onPress: () => setCurrentStep('overview') }
        ]);
        setEmailCode('');
        setSentEmailCode(null);
      } else {
        Alert.alert('Error', result.error || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await initiatePhoneVerification(user.id, phoneNumber);
      if (result.success && result.code) {
        setSentPhoneCode(result.code);
        Alert.alert('Code Sent', `Verification code sent to ${phoneNumber}\n\nFor demo purposes, use code: ${result.code}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneCode || phoneCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPhone(user.id, phoneCode);
      if (result.success) {
        Alert.alert('Success', 'Phone verified successfully!', [
          { text: 'OK', onPress: () => setCurrentStep('overview') }
        ]);
        setPhoneCode('');
        setSentPhoneCode(null);
      } else {
        Alert.alert('Error', result.error || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };



  const renderOverview = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Shield size={64} color={colors.primary} />
        <Text style={styles.headerTitle}>Agent Verification</Text>
        <Text style={styles.headerSubtitle}>
          Complete verification to earn trust badges and unlock premium features
        </Text>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Verification Level</Text>
          <View style={[styles.levelBadge, { backgroundColor: verification.level === 'fully_verified' ? colors.success : colors.warning }]}>
            <Text style={styles.levelBadgeText}>
              {verification.level.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.stepsContainer}>
        <TouchableOpacity 
          style={styles.stepCard}
          onPress={() => setCurrentStep('email')}
          disabled={verification.emailVerified}
        >
          <View style={styles.stepIcon}>
            {verification.emailVerified ? (
              <CheckCircle2 size={32} color={colors.success} />
            ) : (
              <Mail size={32} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Email Verification</Text>
            <Text style={styles.stepDescription}>
              {verification.emailVerified ? 'Verified' : 'Verify your email address'}
            </Text>
          </View>
          {!verification.emailVerified && (
            <View style={styles.stepAction}>
              <Text style={styles.stepActionText}>Verify</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.stepCard}
          onPress={() => setCurrentStep('phone')}
          disabled={verification.phoneVerified}
        >
          <View style={styles.stepIcon}>
            {verification.phoneVerified ? (
              <CheckCircle2 size={32} color={colors.success} />
            ) : (
              <Phone size={32} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Phone Verification</Text>
            <Text style={styles.stepDescription}>
              {verification.phoneVerified ? 'Verified' : 'Verify your phone number'}
            </Text>
          </View>
          {!verification.phoneVerified && (
            <View style={styles.stepAction}>
              <Text style={styles.stepActionText}>Verify</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.stepCard}
          onPress={() => {
            if (user.stripeVerificationStatus === 'verified') {
              Alert.alert('Already Verified', 'Your Stripe account is already verified.');
            } else {
              router.push('/agent-stripe-verification');
            }
          }}
          disabled={user.stripeVerificationStatus === 'verified'}
        >
          <View style={styles.stepIcon}>
            {user.stripeVerificationStatus === 'verified' ? (
              <CheckCircle2 size={32} color={colors.success} />
            ) : (
              <CreditCard size={32} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Stripe ID Verification</Text>
            <Text style={styles.stepDescription}>
              {user.stripeVerificationStatus === 'verified' ? 'Verified via Stripe' : 'Required for receiving payouts'}
            </Text>
          </View>
          {user.stripeVerificationStatus !== 'verified' && (
            <View style={[styles.stepAction, user.stripeVerificationStatus === 'pending' && styles.stepActionPending]}>
              <Text style={styles.stepActionText}>
                {user.stripeVerificationStatus === 'pending' ? 'Pending' : 'Verify'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {user.stripeVerificationStatus === 'verified' && verification.emailVerified && verification.phoneVerified && (
        <View style={styles.infoBox}>
          <AlertCircle size={20} color={colors.primary} />
          <Text style={styles.infoBoxText}>
            Stripe verification is required to receive commission payouts from your referred deals.
          </Text>
        </View>
      )}

      {user.stripeVerificationStatus === 'verified' && verification.emailVerified && verification.phoneVerified && (
        <View style={styles.successBanner}>
          <CheckCircle2 size={24} color={colors.success} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Fully Verified!</Text>
            <Text style={styles.successText}>
              You now have the verified agent badge and access to all features
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderEmailVerification = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.verificationHeader}>
        <Mail size={48} color={colors.primary} />
        <Text style={styles.verificationTitle}>Email Verification</Text>
        <Text style={styles.verificationSubtitle}>
          We&apos;ll send a 6-digit code to {user.email}
        </Text>
      </View>

      {!sentEmailCode ? (
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleSendEmailCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.codeInputContainer}>
          <Text style={styles.codeInputLabel}>Enter 6-digit code</Text>
          <TextInput
            style={styles.codeInput}
            value={emailCode}
            onChangeText={setEmailCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleVerifyEmail}
            disabled={isLoading || emailCode.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleSendEmailCode}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setCurrentStep('overview')}
      >
        <Text style={styles.backButtonText}>Back to Overview</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPhoneVerification = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.verificationHeader}>
        <Phone size={48} color={colors.primary} />
        <Text style={styles.verificationTitle}>Phone Verification</Text>
        <Text style={styles.verificationSubtitle}>
          Enter your phone number to receive a verification code
        </Text>
      </View>

      {!sentPhoneCode ? (
        <View style={styles.phoneInputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleSendPhoneCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.codeInputContainer}>
          <Text style={styles.codeInputLabel}>Enter 6-digit code sent to {phoneNumber}</Text>
          <TextInput
            style={styles.codeInput}
            value={phoneCode}
            onChangeText={setPhoneCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleVerifyPhone}
            disabled={isLoading || phoneCode.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Phone</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleSendPhoneCode}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setCurrentStep('overview')}
      >
        <Text style={styles.backButtonText}>Back to Overview</Text>
      </TouchableOpacity>
    </ScrollView>
  );



  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: currentStep === 'overview' ? 'Agent Verification' : 
                 currentStep === 'email' ? 'Email Verification' :
                 currentStep === 'phone' ? 'Phone Verification' : 'ID Verification',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      {currentStep === 'overview' && renderOverview()}
      {currentStep === 'email' && renderEmailVerification()}
      {currentStep === 'phone' && renderPhoneVerification()}
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
  scrollContent: {
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  stepActionPending: {
    backgroundColor: colors.warning,
  },
  stepActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.success,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  verificationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  phoneInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  idTypeContainer: {
    marginBottom: 24,
  },
  idTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  idTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  idTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  idTypeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  idTypeButtonTextActive: {
    color: colors.primary,
  },
  imageUploadContainer: {
    marginBottom: 24,
  },
  imageUploadButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 8,
  },
  imageUploaded: {
    alignItems: 'center',
  },
  imageUploadedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.success,
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    marginBottom: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
