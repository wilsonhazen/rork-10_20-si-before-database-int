import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/contexts/RewardsContext';
import Colors from '@/constants/colors';
import { ChevronDown, X } from 'lucide-react-native';
import { influencerTypesList, athleteSportsList } from '@/constants/influencer-types';
import { locationsList } from '@/constants/locations';
import type { UserRole, InfluencerProfile, SponsorProfile, AgentProfile, AdminProfile } from '@/types';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { login } = useAuth();
  const { checkAndAwardRewards } = useRewards();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [followers, setFollowers] = useState('');
  const [rate, setRate] = useState('');
  const [influencerType, setInfluencerType] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleComplete = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const baseProfile = {
      id: Date.now().toString(),
      email,
      name,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    let profile: InfluencerProfile | SponsorProfile | AgentProfile | AdminProfile;

    switch (role) {
      case 'influencer':
        profile = {
          ...baseProfile,
          role: 'influencer' as const,
          bio: bio || 'No bio yet',
          categories: [],
          followers: parseInt(followers) || 0,
          engagementRate: 0,
          platforms: {},
          portfolio: [],
          ratePerPost: parseInt(rate) || 0,
          influencerType: influencerType || '',
          sports: sports.length > 0 ? sports : undefined,
          location: location || '',
        };
        break;
      case 'sponsor':
        profile = {
          ...baseProfile,
          role: 'sponsor' as const,
          company: company || 'Company',
          industry: industry || 'General',
          description: bio || 'No description',
          location: location || '',
        };
        break;
      case 'agent':
        profile = {
          ...baseProfile,
          role: 'agent' as const,
          bio: bio || 'No bio yet',
          specialties: [],
          isSubscribed: false,
          totalEarnings: 0,
          recruits: [],
          referralCode: `AGENT${Date.now().toString().slice(-6)}`,
        };
        break;
      case 'admin':
        profile = {
          ...baseProfile,
          role: 'admin' as const,
          permissions: ['all'],
        };
        break;
      default:
        return;
    }

    await login(profile);
    
    await checkAndAwardRewards(profile.id, 'account_created');
    
    router.replace('/(tabs)/discover' as any);
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'influencer': return 'Influencer Profile';
      case 'sponsor': return 'Sponsor Profile';
      case 'agent': return 'Agent Profile';
      case 'admin': return 'Admin Profile';
      default: return 'Profile Setup';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: getRoleTitle(), headerShown: true }} />
      <LinearGradient
        colors={[Colors.dark, Colors.backgroundSecondary]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us a bit about yourself to get started
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {role === 'sponsor' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    value={company}
                    onChangeText={setCompany}
                    placeholder="Your company"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Industry</Text>
                  <TextInput
                    style={styles.input}
                    value={industry}
                    onChangeText={setIndustry}
                    placeholder="e.g., Fashion, Tech, Food"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </>
            )}

            {role === 'influencer' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Influencer Type</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowTypeModal(true)}
                  >
                    <Text style={[styles.selectButtonText, !influencerType && styles.placeholderText]}>
                      {influencerType || 'Select your type'}
                    </Text>
                    <ChevronDown size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {influencerType === 'Athlete' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sports</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowSportsModal(true)}
                    >
                      <Text style={[styles.selectButtonText, sports.length === 0 && styles.placeholderText]}>
                        {sports.length > 0 ? `${sports.length} selected` : 'Select sports'}
                      </Text>
                      <ChevronDown size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    {sports.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {sports.map((sport) => (
                          <View key={sport} style={styles.tag}>
                            <Text style={styles.tagText}>{sport}</Text>
                            <TouchableOpacity
                              onPress={() => setSports(sports.filter(s => s !== sport))}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <X size={14} color={Colors.text} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowLocationModal(true)}
                  >
                    <Text style={[styles.selectButtonText, !location && styles.placeholderText]}>
                      {location || 'Select your location'}
                    </Text>
                    <ChevronDown size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Followers</Text>
                  <TextInput
                    style={styles.input}
                    value={followers}
                    onChangeText={setFollowers}
                    placeholder="Total followers"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rate per Post ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={rate}
                    onChangeText={setRate}
                    placeholder="Your rate"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {(role === 'influencer' || role === 'agent' || role === 'sponsor') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.8}
            style={styles.completeButtonWrapper}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.completeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.completeButtonText}>Complete Setup</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Influencer Type</Text>
                <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={influencerTypesList}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      influencerType === item && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setInfluencerType(item);
                      if (item !== 'Athlete') {
                        setSports([]);
                      }
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      influencerType === item && styles.modalItemTextSelected,
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSportsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSportsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Sports</Text>
                <TouchableOpacity onPress={() => setShowSportsModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={athleteSportsList}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      sports.includes(item) && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      if (sports.includes(item)) {
                        setSports(sports.filter(s => s !== item));
                      } else {
                        setSports([...sports, item]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      sports.includes(item) && styles.modalItemTextSelected,
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showLocationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={locationsList}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      location === item && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setLocation(item);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      location === item && styles.modalItemTextSelected,
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  completeButtonWrapper: {
    marginTop: 8,
  },
  completeButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  selectButton: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  modalItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
