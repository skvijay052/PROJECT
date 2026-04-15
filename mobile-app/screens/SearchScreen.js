import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import {
  addToShortlist,
  getMyShortlists,
  removeFromShortlist,
  searchProfiles,
} from '../lib/api';
import { HomeFeedSkeleton } from '../components/Skeleton';
import SelectField from '../components/SelectField';
import {
  COUNTRY_OPTIONS,
  EDUCATION_OPTIONS,
  PROFESSION_OPTIONS,
  RELIGION_OPTIONS,
  getCasteOptions,
  getDistrictOptions,
  getStateOptions,
  withSelectedOption,
} from '../lib/profileOptions';
import { getProfileImageSource } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const SearchScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [religion, setReligion] = useState('');
  const [caste, setCaste] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [likedById, setLikedById] = useState({});
  const [shortlistActionId, setShortlistActionId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const canApply = useMemo(
    () =>
      ageMin.trim().length > 0 ||
      ageMax.trim().length > 0 ||
      country.trim().length > 0 ||
      stateName.trim().length > 0 ||
      district.trim().length > 0 ||
      religion.trim().length > 0 ||
      caste.trim().length > 0 ||
      education.trim().length > 0 ||
      profession.trim().length > 0,
    [ageMin, ageMax, country, stateName, district, religion, caste, education, profession]
  );
  const showSkeleton = isLoading || isRefreshing;
  const showError = !showSkeleton && hasSearched && Boolean(loadError) && results.length === 0;

  const countryOptions = useMemo(
    () => withSelectedOption(COUNTRY_OPTIONS, country),
    [country]
  );
  const stateOptions = useMemo(
    () => withSelectedOption(getStateOptions(country), stateName),
    [country, stateName]
  );
  const districtOptions = useMemo(
    () => withSelectedOption(getDistrictOptions(country, stateName), district),
    [country, stateName, district]
  );
  const religionOptions = useMemo(
    () => withSelectedOption(RELIGION_OPTIONS, religion),
    [religion]
  );
  const casteOptions = useMemo(
    () => withSelectedOption(getCasteOptions(religion), caste),
    [religion, caste]
  );
  const educationOptions = useMemo(
    () => withSelectedOption(EDUCATION_OPTIONS, education),
    [education]
  );
  const professionOptions = useMemo(
    () => withSelectedOption(PROFESSION_OPTIONS, profession),
    [profession]
  );

  const buildFilters = useCallback(
    () => ({
      ageMin: ageMin.trim() || undefined,
      ageMax: ageMax.trim() || undefined,
      country,
      state: stateName,
      district,
      religion,
      caste,
      education,
      profession,
      limit: 30,
    }),
    [ageMin, ageMax, country, stateName, district, religion, caste, education, profession]
  );

  const handleAgeMinChange = useCallback((value) => {
    setAgeMin(value.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  const handleAgeMaxChange = useCallback((value) => {
    setAgeMax(value.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  const handleCountrySelect = useCallback((value) => {
    setCountry(value);

    const nextStates = getStateOptions(value);
    if (!nextStates.includes(stateName)) {
      setStateName('');
      setDistrict('');
      return;
    }

    if (!getDistrictOptions(value, stateName).includes(district)) {
      setDistrict('');
    }
  }, [district, stateName]);

  const handleStateSelect = useCallback((value) => {
    setStateName(value);
    if (!getDistrictOptions(country, value).includes(district)) {
      setDistrict('');
    }
  }, [country, district]);

  const handleReligionSelect = useCallback((value) => {
    setReligion(value);
    if (!getCasteOptions(value).includes(caste)) {
      setCaste('');
    }
  }, [caste]);

  const scrollToFocusedInput = useCallback((target) => {
    if (!target || !scrollViewRef.current) {
      return;
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 110, true);
    }, 120);
  }, []);

  const loadResults = useCallback(
    async (filters = {}) => {
      const shouldBlockScreen = !hasLoadedOnceRef.current;

      try {
        if (shouldBlockScreen) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        const [response, shortlistResponse] = await Promise.all([
          searchProfiles(filters),
          getMyShortlists({ limit: 50 }),
        ]);

        const items = (response?.items || []).map((profile) => ({
          ...profile,
          isOnline: profile.isOnline ?? profile.is_online ?? false,
        }));

        const shortlistState = {};
        for (const item of shortlistResponse?.items || []) {
          if (item?.target_profile_id) {
            shortlistState[item.target_profile_id] = true;
          }
        }

        setResults(items);
        setLikedById(shortlistState);
        hasLoadedOnceRef.current = true;
        setLoadError('');
      } catch (error) {
        setLoadError(error?.message || 'Unable to load search results right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const applyFilters = async () => {
    const trimmedAgeMin = ageMin.trim();
    const trimmedAgeMax = ageMax.trim();

    if (
      trimmedAgeMin &&
      (!Number.isInteger(Number(trimmedAgeMin)) ||
        Number(trimmedAgeMin) < 18 ||
        Number(trimmedAgeMin) > 99)
    ) {
      Alert.alert('Invalid age', 'Minimum age should be between 18 and 99.');
      return;
    }

    if (
      trimmedAgeMax &&
      (!Number.isInteger(Number(trimmedAgeMax)) ||
        Number(trimmedAgeMax) < 18 ||
        Number(trimmedAgeMax) > 99)
    ) {
      Alert.alert('Invalid age', 'Maximum age should be between 18 and 99.');
      return;
    }

    if (trimmedAgeMin && trimmedAgeMax && Number(trimmedAgeMin) > Number(trimmedAgeMax)) {
      Alert.alert('Invalid range', 'Minimum age must be less than or equal to maximum age.');
      return;
    }

    setHasSearched(true);
    await loadResults(buildFilters());
  };

  const clearFilters = () => {
    setAgeMin('');
    setAgeMax('');
    setCountry('');
    setStateName('');
    setDistrict('');
    setReligion('');
    setCaste('');
    setEducation('');
    setProfession('');
    setResults([]);
    setLikedById({});
    setLoadError('');
    setHasSearched(false);
    setIsLoading(false);
    setIsRefreshing(false);
    hasLoadedOnceRef.current = false;
  };

  const toggleLike = async (id) => {
    const isShortlisted = Boolean(likedById[id]);

    try {
      setShortlistActionId(id);

      if (isShortlisted) {
        await removeFromShortlist(id);
        setLikedById((prev) => ({ ...prev, [id]: false }));
        return;
      }

      await addToShortlist(id);
      setLikedById((prev) => ({ ...prev, [id]: true }));
    } catch (error) {
      Alert.alert('Shortlist update failed', error?.message || 'Please try again.');
    } finally {
      setShortlistActionId(null);
    }
  };

  const renderResult = ({ item }) => {
    const isShortlisted = Boolean(likedById[item.id]);
    const isUpdatingShortlist = shortlistActionId === item.id;

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={getProfileImageSource(item.image)}
            style={styles.avatar}
            blurRadius={item.photo_blurred ? 18 : 0}
          />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {[item.age ? `${item.age} Yrs` : null, item.height].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[item.title, item.city].filter(Boolean).join(', ') || '-'}
          </Text>
          <Text style={styles.cardMeta}>
            {[item.state, item.country].filter(Boolean).join(', ') || '-'}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          style={styles.likeBtn}
          disabled={isUpdatingShortlist}
          onPress={(event) => {
            event.stopPropagation?.();
            toggleLike(item.id);
          }}
        >
          {isUpdatingShortlist ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Ionicons
              name={isShortlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={isShortlisted ? Colors.danger : Colors.text}
            />
          )}
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Pressable
            hitSlop={10}
            style={[styles.headerBtn, (!hasSearched || showSkeleton) && styles.headerBtnDisabled]}
            disabled={!hasSearched || showSkeleton}
            onPress={() => loadResults(buildFilters())}
          >
            <Ionicons name="refresh-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Filters</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={Colors.muted}
                style={styles.inputLeftIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Min Age"
                placeholderTextColor={Colors.muted}
                value={ageMin}
                onChangeText={handleAgeMinChange}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={Colors.muted}
                style={styles.inputLeftIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Max Age"
                placeholderTextColor={Colors.muted}
                value={ageMax}
                onChangeText={handleAgeMaxChange}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <SelectField
              iconName="earth-outline"
              title="Select Country"
              placeholder="Country"
              value={country}
              options={countryOptions}
              onSelect={handleCountrySelect}
            />

            <SelectField
              iconName="map-outline"
              title="Select State"
              placeholder={country ? 'State' : 'Select country first'}
              value={stateName}
              options={stateOptions}
              onSelect={handleStateSelect}
              disabled={!country}
            />

            <SelectField
              iconName="location-outline"
              title="Select District"
              placeholder={stateName ? 'District' : 'Select state first'}
              value={district}
              options={districtOptions}
              onSelect={setDistrict}
              disabled={!country || !stateName}
            />

            <SelectField
              iconName="leaf-outline"
              title="Select Religion"
              placeholder="Religion"
              value={religion}
              options={religionOptions}
              onSelect={handleReligionSelect}
            />

            <SelectField
              iconName="people-outline"
              title="Select Caste"
              placeholder={religion ? 'Caste / Community' : 'Select religion first'}
              value={caste}
              options={casteOptions}
              onSelect={setCaste}
              disabled={!religion}
            />

            <SelectField
              iconName="school-outline"
              title="Select Education"
              placeholder="Education"
              value={education}
              options={educationOptions}
              onSelect={setEducation}
            />

            <SelectField
              iconName="briefcase-outline"
              title="Select Profession"
              placeholder="Profession"
              value={profession}
              options={professionOptions}
              onSelect={setProfession}
            />

            <Pressable
              style={[styles.primaryBtn, canApply && styles.primaryBtnActive]}
              onPress={applyFilters}
              disabled={!canApply}
            >
              <Text style={[styles.primaryBtnText, canApply && styles.primaryBtnTextActive]}>
                Apply Filters
              </Text>
            </Pressable>
          </View>

          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Results</Text>
              <Text style={styles.resultCount}>{results.length} found</Text>
            </View>
            <Pressable onPress={clearFilters} hitSlop={10}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          {showSkeleton ? (
            <HomeFeedSkeleton />
          ) : showError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Search unavailable</Text>
              <Text style={styles.emptySubtitle}>{loadError}</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    {hasSearched ? 'No matches found' : 'Apply filters to search'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {hasSearched
                      ? 'Try adjusting your filters to see more profiles.'
                      : 'Search results will appear here after you apply one or more filters.'}
                  </Text>
                </View>
              }
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 180,
  },
  form: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  inputWrap: {
    height: 58,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: 14,
  },
  inputLeftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  primaryBtn: {
    height: 60,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.chip,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.muted,
  },
  primaryBtnTextActive: {
    color: Colors.text,
  },
  resultsHeader: {
    marginTop: Spacing.xl,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  avatarWrap: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  cardBody: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  likeBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: 6,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 18,
    ...Shadows.chip,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
});

export default SearchScreen;
