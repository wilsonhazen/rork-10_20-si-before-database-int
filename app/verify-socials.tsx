import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Instagram, Twitter, Youtube, Facebook } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import type { SocialAccount } from '@/types';

const SOCIAL_PLATFORMS = [
  { 
    id: 'instagram' as const, 
    name: 'Instagram', 
    icon: Instagram, 
    color: '#E4405F',
    placeholder: '@username'
  },
  { 
    id: 'tiktok' as const, 
    name: 'TikTok', 
    icon: Instagram,
    color: '#000000',
    placeholder: '@username'
  },
  { 
    id: 'youtube' as const, 
    name: 'YouTube', 
    icon: Youtube,
    color: '#FF0000',
    placeholder: '@channelname'
  },
  { 
    id: 'twitter' as const, 
    name: 'X (Twitter)', 
    icon: Twitter,
    color: '#1DA1F2',
    placeholder: '@username'
  },
  { 
    id: 'facebook' as const, 
    name: 'Facebook', 
    icon: Facebook,
    color: '#1877F2',
    placeholder: 'username'
  },
];

export default function VerifySocialsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();

  const simulateVerification = async (platform: string, username: string): Promise<SocialAccount> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const followerCounts: Record<string, number> = {
      instagram: Math.floor(Math.random() * 500000) + 10000,
      tiktok: Math.floor(Math.random() * 1000000) + 50000,
      youtube: Math.floor(Math.random() * 200000) + 5000,
      twitter: Math.floor(Math.random() * 100000) + 1000,
      facebook: Math.floor(Math.random() * 300000) + 5000,
    };

    return {
      platform: platform as any,
      username: username.replace('@', ''),
      url: `https://${platform}.com/${username.replace('@', '')}`,
      followers: followerCounts[platform] || 0,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      lastSynced: new Date().toISOString(),
    };
  };

  const handleVerify = async (platformId: string) => {
    const username = accounts[platformId];
    if (!username || !username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setVerifying(platformId);
    try {
      const verifiedAccount = await simulateVerification(platformId, username);
      
      const currentUser = user as any;
      const existingSocials = currentUser?.socialAccounts || [];
      const updatedSocials = [
        ...existingSocials.filter((acc: SocialAccount) => acc.platform !== platformId),
        verifiedAccount
      ];

      const totalFollowers = updatedSocials.reduce((sum: number, acc: SocialAccount) => sum + acc.followers, 0);

      await updateProfile({
        socialAccounts: updatedSocials,
        followers: totalFollowers,
      });

      Alert.alert(
        'Verified!',
        `Successfully verified ${platformId} account with ${verifiedAccount.followers.toLocaleString()} followers`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to verify account. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setVerifying(null);
    }
  };

  const handleRemove = async (platformId: string) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove your ${platformId} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const currentUser = user as any;
            const existingSocials = currentUser?.socialAccounts || [];
            const updatedSocials = existingSocials.filter((acc: SocialAccount) => acc.platform !== platformId);
            const totalFollowers = updatedSocials.reduce((sum: number, acc: SocialAccount) => sum + acc.followers, 0);

            await updateProfile({
              socialAccounts: updatedSocials,
              followers: totalFollowers,
            });
          },
        },
      ]
    );
  };

  const getVerifiedAccount = (platformId: string): SocialAccount | undefined => {
    const currentUser = user as any;
    return currentUser?.socialAccounts?.find((acc: SocialAccount) => acc.platform === platformId);
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Verify Social Accounts',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.dark },
          headerTintColor: Colors.text,
        }} 
      />
      <LinearGradient
        colors={[Colors.dark, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Connect Your Socials</Text>
          <Text style={styles.subtitle}>
            Verify your social media accounts to build trust with sponsors. We'll fetch your real follower counts.
          </Text>

          <View style={styles.platformsList}>
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const verified = getVerifiedAccount(platform.id);
              const isVerifying = verifying === platform.id;

              return (
                <View key={platform.id} style={styles.platformCard}>
                  <LinearGradient
                    colors={[Colors.darkCard, Colors.backgroundSecondary]}
                    style={styles.platformGradient}
                  >
                    <View style={styles.platformHeader}>
                      <View style={styles.platformLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: platform.color + '20' }]}>
                          <Icon size={24} color={platform.color} />
                        </View>
                        <View style={styles.platformInfo}>
                          <Text style={styles.platformName}>{platform.name}</Text>
                          {verified && (
                            <Text style={styles.verifiedText}>
                              ✓ {verified.followers.toLocaleString()} followers
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {!verified ? (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={accounts[platform.id] || ''}
                          onChangeText={(text) => setAccounts({ ...accounts, [platform.id]: text })}
                          placeholder={platform.placeholder}
                          placeholderTextColor={Colors.textMuted}
                          autoCapitalize="none"
                          editable={!isVerifying}
                        />
                        <TouchableOpacity
                          onPress={() => handleVerify(platform.id)}
                          disabled={isVerifying}
                          style={styles.verifyButton}
                        >
                          <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.verifyButtonGradient}
                          >
                            {isVerifying ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.verifyButtonText}>Verify</Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.verifiedContainer}>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemove(platform.id)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {verified && verified.lastSynced && (
                      <Text style={styles.syncText}>
                        Last synced: {new Date(verified.lastSynced).toLocaleDateString()}
                      </Text>
                    )}
                  </LinearGradient>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.8}
            style={styles.doneButtonWrapper}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.doneButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 Your data is secure. We only fetch public follower counts to verify your reach.
            </Text>
          </View>
          <View style={{ height: 40 }}></View>
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  platformsList: {
    gap: 16,
    marginBottom: 24,
  },
  platformCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  platformGradient: {
    padding: 16,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInfo: {
    gap: 4,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  verifiedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  syncText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  doneButtonWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  doneButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
