import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogIn, User, Lock, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import type { InfluencerProfile, SponsorProfile, AgentProfile, AdminProfile } from '@/types';

type TestUser = {
  username: string;
  password: string;
  profile: InfluencerProfile | SponsorProfile | AgentProfile | AdminProfile;
};

const TEST_USERS: TestUser[] = [
  {
    username: 'influencer',
    password: 'test',
    profile: {
      id: 'inf_test_001',
      email: 'influencer@test.com',
      name: 'Sarah Johnson',
      role: 'influencer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      createdAt: new Date().toISOString(),
      isActive: true,
      referralCode: 'INF2K9X7',
      rating: 4.8,
      reviewCount: 24,
      bio: 'Fitness & wellness influencer passionate about helping people live healthier lives.',
      influencerType: 'Fitness & Wellness',
      sports: ['Yoga', 'CrossFit', 'Running'],
      categories: ['Fitness', 'Wellness', 'Nutrition'],
      location: 'Los Angeles, CA',
      followers: 125000,
      engagementRate: 4.2,
      platforms: {
        instagram: '@sarahfitness',
        tiktok: '@sarahwellness',
        youtube: 'SarahJohnsonFit',
      },
      portfolio: [],
      ratePerPost: 2500,
      paymentPreferences: ['fiat', 'crypto'],
      acceptedCryptos: ['BTC', 'ETH', 'USDT', 'USDC'],
    } as InfluencerProfile,
  },
  {
    username: 'sponsor',
    password: 'test',
    profile: {
      id: 'sp_test_001',
      email: 'sponsor@test.com',
      name: 'Nike Marketing',
      role: 'sponsor',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400',
      createdAt: new Date().toISOString(),
      isActive: true,
      referralCode: 'SP9K3L2',
      rating: 4.9,
      reviewCount: 156,
      company: 'Nike Inc.',
      industry: 'Sports & Fitness',
      location: 'Portland, OR',
      website: 'https://nike.com',
      description: 'Global sports brand looking for authentic athlete partnerships.',
    } as SponsorProfile,
  },
  {
    username: 'agent',
    password: 'test',
    profile: {
      id: 'ag_test_001',
      email: 'agent@test.com',
      name: 'Mike Rodriguez',
      role: 'agent',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      createdAt: new Date().toISOString(),
      isActive: true,
      referralCode: 'AG7X2M9',
      rating: 4.7,
      reviewCount: 89,
      bio: 'Experienced talent agent specializing in sports and fitness partnerships.',
      specialties: ['Sports', 'Fitness', 'Lifestyle'],
      isSubscribed: true,
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalEarnings: 45000,
      recruits: ['inf_001', 'sp_002', 'inf_003'],
    } as AgentProfile,
  },
  {
    username: 'admin',
    password: 'test',
    profile: {
      id: 'admin_test_001',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      createdAt: new Date().toISOString(),
      isActive: true,
      referralCode: 'ADMIN001',
      permissions: ['manage_users', 'manage_rewards', 'manage_transactions', 'view_analytics'],
    } as AdminProfile,
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      const user = TEST_USERS.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (user) {
        await login(user.profile);
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(
          'Login Failed',
          'Invalid username or password.\n\nTest Accounts:\n• influencer / test\n• sponsor / test\n• agent / test\n• admin / test'
        );
      }
      setIsLoading(false);
    }, 500);
  };

  const handleQuickLogin = async (userIndex: number) => {
    setIsLoading(true);
    setTimeout(async () => {
      await login(TEST_USERS[userIndex].profile);
      router.replace('/(tabs)/home');
    }, 300);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.dark, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LogIn size={48} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Log in to your Source Impact account
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <User size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
              </View>

              <View style={styles.quickLoginSection}>
                <Text style={styles.quickLoginTitle}>Quick Test Logins</Text>
                <View style={styles.quickLoginButtons}>
                  <TouchableOpacity
                    style={styles.quickLoginButton}
                    onPress={() => handleQuickLogin(0)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Zap size={18} color={Colors.primary} />
                    <View style={styles.quickLoginTextContainer}>
                      <Text style={styles.quickLoginRole}>Influencer</Text>
                      <Text style={styles.quickLoginName}>Sarah Johnson</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickLoginButton}
                    onPress={() => handleQuickLogin(1)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Zap size={18} color={Colors.secondary} />
                    <View style={styles.quickLoginTextContainer}>
                      <Text style={styles.quickLoginRole}>Sponsor</Text>
                      <Text style={styles.quickLoginName}>Nike Marketing</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.quickLoginButtons}>
                  <TouchableOpacity
                    style={styles.quickLoginButton}
                    onPress={() => handleQuickLogin(2)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Zap size={18} color='#10B981' />
                    <View style={styles.quickLoginTextContainer}>
                      <Text style={styles.quickLoginRole}>Agent</Text>
                      <Text style={styles.quickLoginName}>Mike Rodriguez</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickLoginButton}
                    onPress={() => handleQuickLogin(3)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Zap size={18} color='#EF4444' />
                    <View style={styles.quickLoginTextContainer}>
                      <Text style={styles.quickLoginRole}>Admin</Text>
                      <Text style={styles.quickLoginName}>Admin User</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.testCredentials}>
                <Text style={styles.testCredentialsTitle}>Manual Login:</Text>
                <Text style={styles.testCredentialsText}>Username: influencer / sponsor / agent / admin</Text>
                <Text style={styles.testCredentialsText}>Password: test</Text>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
                style={styles.loginButtonWrapper}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.loginButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.8}
                style={styles.backButton}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>Back to Onboarding</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    paddingHorizontal: 16,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: Colors.text,
  },
  quickLoginSection: {
    marginTop: 8,
    gap: 12,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLoginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    gap: 10,
  },
  quickLoginTextContainer: {
    flex: 1,
  },
  quickLoginRole: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quickLoginName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.darkBorder,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  testCredentials: {
    backgroundColor: Colors.darkCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  testCredentialsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginButtonWrapper: {
    marginTop: 16,
  },
  loginButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
