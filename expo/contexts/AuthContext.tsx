import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { InfluencerProfile, SponsorProfile, AgentProfile, AdminProfile } from '@/types';

type UserProfile = InfluencerProfile | SponsorProfile | AgentProfile | AdminProfile;

const STORAGE_KEY = '@sourceimpact_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEY);
          throw parseError;
        }
      } else {
        const sampleInfluencer: InfluencerProfile = {
          id: 'user_sample_001',
          email: 'sarah.johnson@example.com',
          name: 'Sarah Johnson',
          role: 'influencer',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          createdAt: new Date().toISOString(),
          isActive: true,
          referralCode: 'INF2K9X7',
          rating: 4.8,
          reviewCount: 24,
          bio: 'Fitness & wellness influencer passionate about helping people live healthier lives. Certified personal trainer and nutrition coach.',
          influencerType: 'Fitness & Wellness',
          sports: ['Yoga', 'CrossFit', 'Running'],
          categories: ['Fitness', 'Wellness', 'Nutrition', 'Lifestyle'],
          location: 'Los Angeles, CA',
          followers: 125000,
          engagementRate: 4.2,
          platforms: {
            instagram: '@sarahfitness',
            tiktok: '@sarahwellness',
            youtube: 'SarahJohnsonFit',
          },
          socialAccounts: [
            {
              platform: 'instagram',
              username: '@sarahfitness',
              url: 'https://instagram.com/sarahfitness',
              followers: 125000,
              isVerified: true,
              verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              lastSynced: new Date().toISOString(),
            },
            {
              platform: 'tiktok',
              username: '@sarahwellness',
              url: 'https://tiktok.com/@sarahwellness',
              followers: 89000,
              isVerified: true,
              verifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
              lastSynced: new Date().toISOString(),
            },
            {
              platform: 'youtube',
              username: 'SarahJohnsonFit',
              url: 'https://youtube.com/@SarahJohnsonFit',
              followers: 45000,
              isVerified: true,
              verifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              lastSynced: new Date().toISOString(),
            },
          ],
          portfolio: [
            {
              id: 'port_001',
              title: '30-Day Fitness Challenge',
              description: 'Sponsored campaign with FitGear Pro',
              imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
              metrics: {
                views: 450000,
                likes: 28000,
                comments: 1200,
              },
            },
            {
              id: 'port_002',
              title: 'Healthy Meal Prep Series',
              description: 'Partnership with NutriBox',
              imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
              metrics: {
                views: 320000,
                likes: 19000,
                comments: 850,
              },
            },
            {
              id: 'port_003',
              title: 'Morning Yoga Routine',
              description: 'Collaboration with YogaMat Co',
              imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
              metrics: {
                views: 280000,
                likes: 16500,
                comments: 720,
              },
            },
          ],
          ratePerPost: 2500,
          paymentPreferences: ['fiat', 'crypto'],
          acceptedCryptos: ['BTC', 'ETH', 'USDT', 'USDC'],
          stripeVerificationStatus: 'verified',
          stripeVerifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          stripeConnectedAccountId: 'acct_sample123',
          stripeOnboardingComplete: true,
        };
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleInfluencer));
          setUser(sampleInfluencer);
        } catch (storageError) {
          console.error('Failed to store sample user:', storageError);
          setUser(sampleInfluencer);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      const sampleInfluencer: InfluencerProfile = {
        id: 'user_sample_001',
        email: 'sarah.johnson@example.com',
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
        categories: ['Fitness', 'Wellness', 'Nutrition', 'Lifestyle'],
        location: 'Los Angeles, CA',
        followers: 125000,
        engagementRate: 4.2,
        platforms: {
          instagram: '@sarahfitness',
          tiktok: '@sarahwellness',
          youtube: 'SarahJohnsonFit',
        },
        socialAccounts: [
          {
            platform: 'instagram',
            username: '@sarahfitness',
            url: 'https://instagram.com/sarahfitness',
            followers: 125000,
            isVerified: true,
            verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastSynced: new Date().toISOString(),
          },
          {
            platform: 'tiktok',
            username: '@sarahwellness',
            url: 'https://tiktok.com/@sarahwellness',
            followers: 89000,
            isVerified: true,
            verifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            lastSynced: new Date().toISOString(),
          },
          {
            platform: 'youtube',
            username: 'SarahJohnsonFit',
            url: 'https://youtube.com/@SarahJohnsonFit',
            followers: 45000,
            isVerified: true,
            verifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            lastSynced: new Date().toISOString(),
          },
        ],
        portfolio: [
          {
            id: 'port_001',
            title: '30-Day Fitness Challenge',
            description: 'Sponsored campaign with FitGear Pro',
            imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
            metrics: {
              views: 450000,
              likes: 28000,
              comments: 1200,
            },
          },
          {
            id: 'port_002',
            title: 'Healthy Meal Prep Series',
            description: 'Partnership with NutriBox',
            imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
            metrics: {
              views: 320000,
              likes: 19000,
              comments: 850,
            },
          },
          {
            id: 'port_003',
            title: 'Morning Yoga Routine',
            description: 'Collaboration with YogaMat Co',
            imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
            metrics: {
              views: 280000,
              likes: 16500,
              comments: 720,
            },
          },
        ],
        ratePerPost: 2500,
        paymentPreferences: ['fiat', 'crypto'],
        acceptedCryptos: ['BTC', 'ETH', 'USDT', 'USDC'],
        stripeVerificationStatus: 'verified',
        stripeVerifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        stripeConnectedAccountId: 'acct_sample123',
        stripeOnboardingComplete: true,
      };
      setUser(sampleInfluencer);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setUser(profile as UserProfile);
      console.log('User logged in:', profile.name, profile.role);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const updated = { ...user, ...updates } as UserProfile;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [user]);

  const switchRole = useCallback(async (newRole: 'influencer' | 'sponsor' | 'agent') => {
    if (!user) return;
    
    const baseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
      isActive: user.isActive,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
    };

    let newProfile: UserProfile;

    switch (newRole) {
      case 'influencer':
        newProfile = {
          ...baseUser,
          role: 'influencer',
          bio: '',
          influencerType: '',
          categories: [],
          location: '',
          followers: 0,
          engagementRate: 0,
          platforms: {},
          portfolio: [],
          ratePerPost: 0,
        } as InfluencerProfile;
        break;
      case 'sponsor':
        newProfile = {
          ...baseUser,
          role: 'sponsor',
          company: '',
          industry: '',
          location: '',
          description: '',
        } as SponsorProfile;
        break;
      case 'agent':
        newProfile = {
          ...baseUser,
          role: 'agent',
          bio: '',
          specialties: [],
          isSubscribed: false,
          totalEarnings: 0,
          recruits: [],
          referralCode: user.referralCode || `AG${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        } as AgentProfile;
        break;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      setUser(newProfile);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  }, [user]);

  const generateReferralCode = useCallback(async () => {
    if (!user) return;
    
    const referralCode = `${user.role.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await updateProfile({ referralCode });
    return referralCode;
  }, [user, updateProfile]);

  const setReferredBy = useCallback(async (referralCode: string) => {
    if (!user) return;
    await updateProfile({ referredBy: referralCode });
  }, [user, updateProfile]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    switchRole,
    generateReferralCode,
    setReferredBy,
  }), [user, isLoading, login, logout, updateProfile, switchRole, generateReferralCode, setReferredBy]);
});
