import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ChevronDown, X, Save, Check } from 'lucide-react-native';
import { influencerTypesList, athleteSportsList } from '@/constants/influencer-types';
import { locationsList } from '@/constants/locations';
import type { InfluencerProfile, SponsorProfile, AgentProfile, PaymentPreference, CryptoType } from '@/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [followers, setFollowers] = useState('');
  const [rate, setRate] = useState('');
  const [influencerType, setInfluencerType] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [engagementRate, setEngagementRate] = useState('');
  const [paymentPreferences, setPaymentPreferences] = useState<PaymentPreference[]>([]);
  const [acceptedCryptos, setAcceptedCryptos] = useState<CryptoType[]>([]);
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const cryptoOptions: CryptoType[] = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL'];

  useEffect(() => {
    if (!user) return;

    if (user.role === 'influencer') {
      const influencer = user as InfluencerProfile;
      setBio(influencer.bio || '');
      setFollowers(influencer.followers?.toString() || '');
      setRate(influencer.ratePerPost?.toString() || '');
      setInfluencerType(influencer.influencerType || '');
      setSports(influencer.sports || []);
      setLocation(influencer.location || '');
      setEngagementRate(influencer.engagementRate?.toString() || '');
      setPaymentPreferences(influencer.paymentPreferences || []);
      setAcceptedCryptos(influencer.acceptedCryptos || []);
    } else if (user.role === 'sponsor') {
      const sponsor = user as SponsorProfile;
      setCompany(sponsor.company || '');
      setIndustry(sponsor.industry || '');
      setBio(sponsor.description || '');
      setLocation(sponsor.location || '');
      setWebsite(sponsor.website || '');
    } else if (user.role === 'agent') {
      const agent = user as AgentProfile;
      setBio(agent.bio || '');
      setSpecialties(agent.specialties || []);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setIsSaving(true);

    try {
      const baseUpdates = {
        name,
        email,
      };

      let updates: any = { ...baseUpdates };

      if (user?.role === 'influencer') {
        updates = {
          ...updates,
          bio,
          followers: parseInt(followers) || 0,
          ratePerPost: parseInt(rate) || 0,
          influencerType,
          sports: sports.length > 0 ? sports : undefined,
          location,
          engagementRate: parseFloat(engagementRate) || 0,
          paymentPreferences: paymentPreferences.length > 0 ? paymentPreferences : undefined,
          acceptedCryptos: acceptedCryptos.length > 0 ? acceptedCryptos : undefined,
        };
      } else if (user?.role === 'sponsor') {
        updates = {
          ...updates,
          company,
          industry,
          description: bio,
          location,
          website,
        };
      } else if (user?.role === 'agent') {
        updates = {
          ...updates,
          bio,
          specialties,
        };
      }

      await updateProfile(updates);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'influencer': return 'Edit Influencer Profile';
      case 'sponsor': return 'Edit Sponsor Profile';
      case 'agent': return 'Edit Agent Profile';
      default: return 'Edit Profile';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: getRoleTitle(), 
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.dark,
          },
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

            {user?.role === 'sponsor' && (
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Website</Text>
                  <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://yourcompany.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>

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
              </>
            )}

            {user?.role === 'influencer' && (
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
                  <Text style={styles.label}>Total Followers</Text>
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
                  <Text style={styles.label}>Engagement Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={engagementRate}
                    onChangeText={setEngagementRate}
                    placeholder="e.g., 3.5"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Payment Preferences</Text>
                  <View style={styles.paymentOptionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentOption,
                        paymentPreferences.includes('fiat') && styles.paymentOptionSelected,
                      ]}
                      onPress={() => {
                        if (paymentPreferences.includes('fiat')) {
                          setPaymentPreferences(paymentPreferences.filter(p => p !== 'fiat'));
                        } else {
                          setPaymentPreferences([...paymentPreferences, 'fiat']);
                        }
                      }}
                    >
                      <Text style={[
                        styles.paymentOptionText,
                        paymentPreferences.includes('fiat') && styles.paymentOptionTextSelected,
                      ]}>
                        Fiat Currency
                      </Text>
                      {paymentPreferences.includes('fiat') && (
                        <Check size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentOption,
                        paymentPreferences.includes('crypto') && styles.paymentOptionSelected,
                      ]}
                      onPress={() => {
                        if (paymentPreferences.includes('crypto')) {
                          setPaymentPreferences(paymentPreferences.filter(p => p !== 'crypto'));
                          setAcceptedCryptos([]);
                        } else {
                          setPaymentPreferences([...paymentPreferences, 'crypto']);
                        }
                      }}
                    >
                      <Text style={[
                        styles.paymentOptionText,
                        paymentPreferences.includes('crypto') && styles.paymentOptionTextSelected,
                      ]}>
                        Cryptocurrency
                      </Text>
                      {paymentPreferences.includes('crypto') && (
                        <Check size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {paymentPreferences.includes('crypto') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Accepted Cryptocurrencies</Text>
                    <View style={styles.cryptoOptionsContainer}>
                      {cryptoOptions.map((crypto) => (
                        <TouchableOpacity
                          key={crypto}
                          style={[
                            styles.cryptoOption,
                            acceptedCryptos.includes(crypto) && styles.cryptoOptionSelected,
                          ]}
                          onPress={() => {
                            if (acceptedCryptos.includes(crypto)) {
                              setAcceptedCryptos(acceptedCryptos.filter(c => c !== crypto));
                            } else {
                              setAcceptedCryptos([...acceptedCryptos, crypto]);
                            }
                          }}
                        >
                          <Text style={[
                            styles.cryptoOptionText,
                            acceptedCryptos.includes(crypto) && styles.cryptoOptionTextSelected,
                          ]}>
                            {crypto}
                          </Text>
                          {acceptedCryptos.includes(crypto) && (
                            <Check size={14} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            {(user?.role === 'influencer' || user?.role === 'agent' || user?.role === 'sponsor') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {user?.role === 'sponsor' ? 'Company Description' : 'Bio'}
                </Text>
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
            onPress={handleSave}
            activeOpacity={0.8}
            style={styles.saveButtonWrapper}
            disabled={isSaving}
          >
            <LinearGradient
              colors={isSaving ? [Colors.darkCard, Colors.darkCard] : [Colors.primary, Colors.secondary]}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
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
  saveButtonWrapper: {
    marginTop: 8,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
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
  paymentOptionsContainer: {
    gap: 12,
  },
  paymentOption: {
    backgroundColor: Colors.darkCard,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  paymentOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  cryptoOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cryptoOption: {
    backgroundColor: Colors.darkCard,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cryptoOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  cryptoOptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  cryptoOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
