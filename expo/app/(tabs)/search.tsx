import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search as SearchIcon, MapPin, Users, TrendingUp, X, Filter, CheckCircle2, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { mockInfluencers, mockGigs } from '@/mocks/seed-data';
import { influencerTypesList, athleteSportsList, contentCategoriesList } from '@/constants/influencer-types';
import { locationsList } from '@/constants/locations';
import Colors from '@/constants/colors';
import type { InfluencerProfile } from '@/types';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { gigs } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiFiltersApplied, setAiFiltersApplied] = useState(false);

  const isSearchingInfluencers = user?.role === 'sponsor';

  const performAISearch = async (query: string) => {
    if (!query || query.length < 10) return;
    
    setIsAISearching(true);
    try {
      console.log('Performing AI search with query:', query);
      
      const searchFilters = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Parse this search query into structured filters. Extract influencer type, location, categories, budget range, follower range, and engagement preferences.

Available influencer types: ${influencerTypesList.join(', ')}
Available locations: ${locationsList.slice(0, 30).join(', ')}
Available categories: ${contentCategoriesList.slice(0, 30).join(', ')}

Search query: "${query}"

Return structured filters that match this query.`,
          },
        ],
        schema: z.object({
          influencerType: z.string().optional().describe('Influencer type if mentioned'),
          location: z.string().optional().describe('Location if mentioned'),
          categories: z.array(z.string()).optional().describe('Categories mentioned'),
          minFollowers: z.number().optional().describe('Minimum followers if mentioned'),
          maxFollowers: z.number().optional().describe('Maximum followers if mentioned'),
          minEngagement: z.number().optional().describe('Minimum engagement rate if mentioned'),
          minBudget: z.number().optional().describe('Minimum budget if mentioned'),
          maxBudget: z.number().optional().describe('Maximum budget if mentioned'),
        }),
      });

      console.log('AI Search Filters:', searchFilters);

      if (searchFilters.influencerType) {
        setSelectedType(searchFilters.influencerType);
      }
      if (searchFilters.location) {
        setSelectedLocation(searchFilters.location);
      }
      if (searchFilters.categories && searchFilters.categories.length > 0) {
        setSelectedCategory(searchFilters.categories[0]);
      }
      
      setAiFiltersApplied(true);
    } catch (error) {
      console.error('AI search error:', error);
    } finally {
      setIsAISearching(false);
    }
  };

  const filteredInfluencers = useMemo(() => {
    let results = mockInfluencers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(inf => 
        inf.name.toLowerCase().includes(query) ||
        inf.bio.toLowerCase().includes(query) ||
        inf.influencerType.toLowerCase().includes(query) ||
        inf.categories.some(cat => cat.toLowerCase().includes(query))
      );
    }

    if (selectedType) {
      results = results.filter(inf => inf.influencerType === selectedType);
    }

    if (selectedLocation) {
      results = results.filter(inf => inf.location === selectedLocation);
    }

    if (selectedCategory) {
      results = results.filter(inf => inf.categories.includes(selectedCategory));
    }

    if (selectedSport) {
      results = results.filter(inf => inf.categories.includes(selectedSport));
    }

    return results;
  }, [searchQuery, selectedType, selectedLocation, selectedCategory, selectedSport]);

  const filteredGigs = useMemo(() => {
    const allGigs = [...mockGigs, ...gigs.filter(g => g.status === 'open')];
    let results = allGigs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(gig => 
        gig.title.toLowerCase().includes(query) ||
        gig.description.toLowerCase().includes(query) ||
        gig.categories.some(cat => cat.toLowerCase().includes(query)) ||
        gig.influencerTypes.some(type => type.toLowerCase().includes(query))
      );
    }

    if (selectedType) {
      results = results.filter(gig => gig.influencerTypes.includes(selectedType));
    }

    if (selectedLocation) {
      results = results.filter(gig => gig.location === selectedLocation);
    }

    if (selectedCategory) {
      results = results.filter(gig => gig.categories.includes(selectedCategory));
    }

    if (selectedSport) {
      results = results.filter(gig => gig.categories.includes(selectedSport));
    }

    return results;
  }, [searchQuery, selectedType, selectedLocation, selectedCategory, selectedSport, gigs]);

  const clearFilters = () => {
    setSelectedType('');
    setSelectedLocation('');
    setSelectedCategory('');
    setSelectedSport('');
  };

  const hasActiveFilters = selectedType || selectedLocation || selectedCategory || selectedSport;

  const renderInfluencerCard = (influencer: InfluencerProfile) => {
    const hasVerifiedSocials = influencer.socialAccounts && influencer.socialAccounts.length > 0;
    
    return (
      <TouchableOpacity
        key={influencer.id}
        style={styles.card}
        onPress={() => router.push(`/view-profile?userId=${influencer.id}`)}
      >
        <LinearGradient
          colors={[Colors.darkCard, Colors.backgroundSecondary]}
          style={styles.cardGradient}
        >
          <Image source={{ uri: influencer.avatar }} style={styles.avatar} />
          
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{influencer.name}</Text>
              {hasVerifiedSocials && (
                <CheckCircle2 size={20} color={Colors.success} />
              )}
            </View>
          
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{influencer.influencerType}</Text>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{influencer.location}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Users size={16} color={Colors.primary} />
              <Text style={styles.statText}>{(influencer.followers / 1000).toFixed(0)}K</Text>
            </View>
            <View style={styles.stat}>
              <TrendingUp size={16} color={Colors.success} />
              <Text style={styles.statText}>{influencer.engagementRate}%</Text>
            </View>
          </View>

          <View style={styles.categories}>
            {influencer.categories.slice(0, 3).map((cat) => (
              <View key={cat} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>

          {influencer.ratePerPost != null && (
            <View style={styles.rateContainer}>
              <Text style={styles.rateLabel}>Rate per post</Text>
              <Text style={styles.rate}>${Number(influencer.ratePerPost).toLocaleString()}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
    );
  };

  const renderGigCard = (gig: typeof mockGigs[0]) => (
    <TouchableOpacity
      key={gig.id}
      style={styles.card}
      onPress={() => router.push(`/gig-details?id=${gig.id}`)}
    >
      <LinearGradient
        colors={[Colors.darkCard, Colors.backgroundSecondary]}
        style={styles.cardGradient}
      >
        <View style={styles.gigHeader}>
          <Image source={{ uri: gig.sponsorAvatar }} style={styles.sponsorAvatar} />
          <View style={styles.gigHeaderText}>
            <Text style={styles.gigTitle}>{gig.title}</Text>
            <Text style={styles.sponsorName}>{gig.sponsorName}</Text>
          </View>
        </View>

        <Text style={styles.gigDescription} numberOfLines={2}>{gig.description}</Text>

        {gig.location && (
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{gig.location}</Text>
          </View>
        )}

        <View style={styles.categories}>
          {gig.categories.slice(0, 3).map((cat) => (
            <View key={cat} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>

        {gig.price != null && (
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budget}>
              ${Number(gig.price).toLocaleString()}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            {isSearchingInfluencers ? 'Find Influencers' : 'Find Opportunities'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Filter size={24} color={hasActiveFilters ? Colors.primary : Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={isSearchingInfluencers ? 'Try: "Tech influencers in NYC with 50k+ followers"' : 'Try: "Fitness gigs under $5000 in California"'}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isAISearching && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
          {searchQuery.length > 0 && !isAISearching && (
            <>
              <TouchableOpacity onPress={() => performAISearch(searchQuery)} style={styles.aiSearchButton}>
                <Sparkles size={20} color={Colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setAiFiltersApplied(false);
              }}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {aiFiltersApplied && (
          <View style={styles.aiIndicator}>
            <Sparkles size={14} color={Colors.warning} />
            <Text style={styles.aiIndicatorText}>AI filters applied</Text>
            <TouchableOpacity onPress={() => {
              clearFilters();
              setAiFiltersApplied(false);
            }}>
              <Text style={styles.aiIndicatorClear}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasActiveFilters && (
          <View style={styles.activeFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedType && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedType}</Text>
                  <TouchableOpacity onPress={() => setSelectedType('')}>
                    <X size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {selectedLocation && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedLocation}</Text>
                  <TouchableOpacity onPress={() => setSelectedLocation('')}>
                    <X size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {selectedCategory && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedCategory}</Text>
                  <TouchableOpacity onPress={() => setSelectedCategory('')}>
                    <X size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {selectedSport && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedSport}</Text>
                  <TouchableOpacity onPress={() => setSelectedSport('')}>
                    <X size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionTitle}>Influencer Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {influencerTypesList.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(selectedType === type ? '' : type)}
                  style={[
                    styles.filterChip,
                    selectedType === type && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedType === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedType === 'Athlete' && (
              <>
                <Text style={styles.filterSectionTitle}>Sport</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  {athleteSportsList.map((sport) => (
                    <TouchableOpacity
                      key={sport}
                      onPress={() => setSelectedSport(selectedSport === sport ? '' : sport)}
                      style={[
                        styles.filterChip,
                        selectedSport === sport && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSport === sport && styles.filterChipTextActive,
                        ]}
                      >
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.filterSectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {contentCategoriesList.slice(0, 20).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterSectionTitle}>Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {locationsList.slice(0, 20).map((location) => (
                <TouchableOpacity
                  key={location}
                  onPress={() => setSelectedLocation(selectedLocation === location ? '' : location)}
                  style={[
                    styles.filterChip,
                    selectedLocation === location && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedLocation === location && styles.filterChipTextActive,
                    ]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {isSearchingInfluencers ? filteredInfluencers.length : filteredGigs.length} results
          </Text>
        </View>

        {isSearchingInfluencers ? (
          <View style={styles.resultsList}>
            {filteredInfluencers.map(renderInfluencerCard)}
          </View>
        ) : (
          <View style={styles.resultsList}>
            {filteredGigs.map(renderGigCard)}
          </View>
        )}

        <View style={{ height: 100 }}></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  activeFilters: {
    marginTop: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  filtersPanel: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    maxHeight: 300,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  filterChips: {
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.darkCard,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  results: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  resultsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardGradient: {
    padding: 16,
  },
  avatar: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  typeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  rateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark + '80',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  rateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  gigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sponsorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  gigHeaderText: {
    flex: 1,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  sponsorName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  gigDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark + '80',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  budgetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  budget: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  aiSearchButton: {
    padding: 4,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  aiIndicatorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.warning,
    flex: 1,
  },
  aiIndicatorClear: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
});
