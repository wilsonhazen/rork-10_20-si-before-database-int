import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users, Briefcase, TrendingUp, Shield, LogIn } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { UserRole } from '@/types';



const roles = [
  {
    id: 'influencer' as UserRole,
    title: 'Influencer',
    description: 'Showcase your portfolio and connect with brands',
    icon: Users,
    gradient: [Colors.primary, Colors.secondary],
  },
  {
    id: 'sponsor' as UserRole,
    title: 'Sponsor',
    description: 'Post gigs and find the perfect influencers',
    icon: Briefcase,
    gradient: [Colors.secondary, '#8B5CF6'],
  },
  {
    id: 'agent' as UserRole,
    title: 'Agent',
    description: 'Recruit talent and earn 15% commission',
    icon: TrendingUp,
    gradient: [Colors.warning, '#F97316'],
  },
  {
    id: 'admin' as UserRole,
    title: 'Admin',
    description: 'Full platform control and analytics',
    icon: Shield,
    gradient: [Colors.danger, '#DC2626'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (ref) {
      console.log('Referral code detected:', ref);
      Alert.alert(
        'Referral Code Applied',
        `You've been referred with code: ${ref}. This will be applied when you create your account.`,
        [{ text: 'OK' }]
      );
    }
  }, [ref]);

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/profile-setup?role=${selectedRole}`);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.dark, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Source Impact</Text>
            <Text style={styles.subtitle}>
              The marketplace where influencers, sponsors, and agents connect
            </Text>
          </View>

          <View style={styles.rolesContainer}>
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.8}
                  style={styles.roleCardWrapper}
                >
                  <LinearGradient
                    colors={isSelected ? [role.gradient[0], role.gradient[1]] : [Colors.darkCard, Colors.darkCard]}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                    ]}
                  >
                    <View style={styles.roleIconContainer}>
                      <Icon 
                        size={32} 
                        color={isSelected ? '#FFFFFF' : Colors.primary} 
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[
                      styles.roleTitle,
                      isSelected && styles.roleTextSelected,
                    ]}>
                      {role.title}
                    </Text>
                    <Text style={[
                      styles.roleDescription,
                      isSelected && styles.roleDescriptionSelected,
                    ]}>
                      {role.description}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedRole}
            activeOpacity={0.8}
            style={styles.continueButtonWrapper}
          >
            <LinearGradient
              colors={selectedRole ? [Colors.primary, Colors.secondary] : [Colors.darkBorder, Colors.darkBorder]}
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[
                styles.continueButtonText,
                !selectedRole && styles.continueButtonTextDisabled,
              ]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.8}
            style={styles.loginButton}
          >
            <LogIn size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.loginButtonText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  rolesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCardWrapper: {
    width: '100%',
  },
  roleCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleIconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  roleDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  continueButtonWrapper: {
    marginTop: 8,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: Colors.textMuted,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
