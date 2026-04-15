import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ImageBackground,
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
import { useFocusEffect } from '@react-navigation/native';

import {
  addToShortlist,
  getMyProfile,
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
import { getProfileImageSource, hasProfileImage } from '../lib/profileImage';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function formatRangeLabel(minValue, maxValue) {
  if (minValue && maxValue) return `${minValue}-${maxValue} yrs`;
  if (minValue) return `${minValue}+ yrs`;
  if (maxValue) return `Up to ${maxValue} yrs`;
  return 'Not set';
}

function getCriterionStatus(matchRatio) {
  if (matchRatio >= 0.85) return 'match';
  if (matchRatio >= 0.55) return 'close';
  return 'miss';
}

function buildAgeCriterion({ label, minValue, maxValue, actualAge, weight, source }) {
  const expectedLabel = formatRangeLabel(minValue, maxValue);
  const actualLabel = actualAge ? `${actualAge} yrs` : 'Not added';
  let matchRatio = 0;

  if (actualAge) {
    if (minValue && maxValue) {
      const minAge = Number(minValue);
      const maxAge = Number(maxValue);

      if (actualAge >= minAge && actualAge <= maxAge) {
        const midpoint = (minAge + maxAge) / 2;
        const span = Math.max(1, maxAge - minAge);
        const distance = Math.abs(actualAge - midpoint);
        const closeness = 1 - Math.min(1, distance / (span / 2 + 2));
        matchRatio = 0.82 + closeness * 0.18;
      } else {
        const outsideDiff = actualAge < minAge ? minAge - actualAge : actualAge - maxAge;
        matchRatio = Math.max(0, 0.74 - outsideDiff * 0.12);
      }
    } else if (minValue) {
      const minAge = Number(minValue);
      matchRatio = actualAge >= minAge ? 0.92 : Math.max(0, 0.7 - (minAge - actualAge) * 0.12);
    } else if (maxValue) {
      const maxAge = Number(maxValue);
      matchRatio = actualAge <= maxAge ? 0.92 : Math.max(0, 0.7 - (actualAge - maxAge) * 0.12);
    }
  }

  const status = getCriterionStatus(matchRatio);

  return {
    key: `${source}-age`,
    label,
    source,
    weight,
    expectedLabel,
    actualLabel,
    matchRatio,
    status,
    statusLabel: status === 'match' ? 'Match' : status === 'close' ? 'Close' : 'Miss',
  };
}

function buildTextCriterion({ key, label, expectedValue, actualValue, weight, source }) {
  const expectedLabel = expectedValue || 'Not set';
  const actualLabel = actualValue || 'Not added';
  const normalizedExpected = normalizeText(expectedValue);
  const normalizedActual = normalizeText(actualValue);
  let matchRatio = 0;

  if (normalizedExpected && normalizedActual) {
    if (normalizedExpected === normalizedActual) {
      matchRatio = 1;
    } else if (
      normalizedActual.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedActual)
    ) {
      matchRatio = 0.72;
    }
  }

  const status = getCriterionStatus(matchRatio);

  return {
    key: `${source}-${key}`,
    label,
    source,
    weight,
    expectedLabel,
    actualLabel,
    matchRatio,
    status,
    statusLabel: status === 'match' ? 'Match' : status === 'close' ? 'Close' : 'Miss',
  };
}

function buildPresenceCriterion({ key, label, present, weight }) {
  return {
    key,
    label,
    source: 'profile',
    weight,
    expectedLabel: 'Added',
    actualLabel: present ? 'Added' : 'Missing',
    matchRatio: present ? 1 : 0,
    status: present ? 'match' : 'miss',
    statusLabel: present ? 'Ready' : 'Missing',
  };
}

function getScoreTone(score) {
  if (score >= 85) return { key: 'high', label: 'High match', icon: 'sparkles' };
  if (score >= 70) return { key: 'strong', label: 'Strong match', icon: 'flash-outline' };
  if (score >= 55) return { key: 'good', label: 'Good fit', icon: 'compass-outline' };
  return { key: 'open', label: 'Worth a look', icon: 'search-outline' };
}

function buildFilterChips(filters = {}) {
  const chips = [];
  const ageLabel = formatRangeLabel(filters.ageMin, filters.ageMax);

  if (filters.ageMin || filters.ageMax) chips.push({ key: 'age', label: `Age ${ageLabel}` });
  if (filters.country) chips.push({ key: 'country', label: filters.country });
  if (filters.state) chips.push({ key: 'state', label: filters.state });
  if (filters.district) chips.push({ key: 'district', label: filters.district });
  if (filters.religion) chips.push({ key: 'religion', label: filters.religion });
  if (filters.caste) chips.push({ key: 'caste', label: filters.caste });
  if (filters.education) chips.push({ key: 'education', label: filters.education });
  if (filters.profession) chips.push({ key: 'profession', label: filters.profession });

  return chips;
}

function buildSearchInsight(profile, filters = {}, preferenceProfile = {}) {
  const criteria = [];
  const lockedDimensions = new Set();

  const addCriterion = (criterion, dimensionKey) => {
    criteria.push(criterion);
    if (dimensionKey) lockedDimensions.add(dimensionKey);
  };

  if (filters.ageMin || filters.ageMax) {
    addCriterion(
      buildAgeCriterion({
        label: 'Search age range',
        minValue: filters.ageMin,
        maxValue: filters.ageMax,
        actualAge: profile?.age,
        weight: 2.2,
        source: 'filter',
      }),
      'age'
    );
  }

  [
    ['country', 'Country filter', filters.country, profile?.country, 1.9],
    ['state', 'State filter', filters.state, profile?.state, 1.7],
    ['district', 'District filter', filters.district, profile?.district || profile?.city, 1.55],
    ['religion', 'Religion filter', filters.religion, profile?.religion, 1.8],
    ['caste', 'Caste filter', filters.caste, profile?.caste, 1.6],
    ['education', 'Education filter', filters.education, profile?.education, 1.45],
    ['profession', 'Profession filter', filters.profession, profile?.title || profile?.profession, 1.45],
  ].forEach(([dimensionKey, label, expectedValue, actualValue, weight]) => {
    if (!expectedValue) return;
    addCriterion(
      buildTextCriterion({
        key: dimensionKey,
        label,
        expectedValue,
        actualValue,
        weight,
        source: 'filter',
      }),
      dimensionKey
    );
  });

  if (!lockedDimensions.has('age') && (preferenceProfile?.preferred_age_min || preferenceProfile?.preferred_age_max)) {
    addCriterion(
      buildAgeCriterion({
        label: 'Saved age preference',
        minValue: preferenceProfile?.preferred_age_min,
        maxValue: preferenceProfile?.preferred_age_max,
        actualAge: profile?.age,
        weight: 1.35,
        source: 'preference',
      }),
      'age'
    );
  }

  [
    ['country', 'Saved location preference', preferenceProfile?.preferred_location, profile?.country, 1.15],
    ['state', 'Saved state preference', preferenceProfile?.preferred_state, profile?.state, 1.05],
    ['district', 'Saved district preference', preferenceProfile?.preferred_district, profile?.district || profile?.city, 1],
    ['religion', 'Saved religion preference', preferenceProfile?.preferred_religion, profile?.religion, 1.1],
    ['caste', 'Saved caste preference', preferenceProfile?.preferred_caste, profile?.caste, 1],
    ['education', 'Saved education preference', preferenceProfile?.preferred_education, profile?.education, 0.95],
    ['profession', 'Saved profession preference', preferenceProfile?.preferred_profession, profile?.title || profile?.profession, 0.95],
  ].forEach(([dimensionKey, label, expectedValue, actualValue, weight]) => {
    if (lockedDimensions.has(dimensionKey) || !expectedValue) return;
    addCriterion(
      buildTextCriterion({
        key: `preferred-${dimensionKey}`,
        label,
        expectedValue,
        actualValue,
        weight,
        source: 'preference',
      }),
      dimensionKey
    );
  });

  criteria.push(
    buildPresenceCriterion({
      key: 'profile-photo',
      label: 'Profile photo',
      present: hasProfileImage(profile?.image),
      weight: 0.45,
    })
  );
  criteria.push(
    buildPresenceCriterion({
      key: 'profile-bio',
      label: 'About section',
      present: Boolean(normalizeText(profile?.bio)),
      weight: 0.35,
    })
  );
  criteria.push(
    buildPresenceCriterion({
      key: 'profile-career',
      label: 'Career details',
      present: Boolean(normalizeText(profile?.title) || normalizeText(profile?.education)),
      weight: 0.3,
    })
  );

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  const weightedScore = criteria.reduce(
    (sum, criterion) => sum + criterion.weight * criterion.matchRatio,
    0
  );
  const score = Math.max(0, Math.min(100, Math.round((weightedScore / totalWeight) * 100)));
  const tone = getScoreTone(score);
  const strongMatches = criteria.filter((criterion) => criterion.matchRatio >= 0.85).length;
  const filterCount = criteria.filter((criterion) => criterion.source === 'filter').length;
  const preferenceCount = criteria.filter((criterion) => criterion.source === 'preference').length;
  const sourceParts = [];

  if (filterCount > 0) sourceParts.push(`${filterCount} active filter${filterCount === 1 ? '' : 's'}`);
  if (preferenceCount > 0) sourceParts.push(`${preferenceCount} saved preference${preferenceCount === 1 ? '' : 's'}`);

  return {
    score,
    tone,
    strongMatches,
    totalCount: criteria.length,
    filterCount,
    preferenceCount,
    summary:
      strongMatches === criteria.length
        ? 'This profile lines up closely with your search and preference signals.'
        : `${strongMatches}/${criteria.length} cues line up strongly with this search.`,
    sourceLine: sourceParts.length
      ? `Built from ${sourceParts.join(' + ')}`
      : 'Built from profile readiness signals',
    criteria,
  };
}

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
  const [preferenceProfile, setPreferenceProfile] = useState({});
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [expandedScoreId, setExpandedScoreId] = useState(null);
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadPreferenceProfile = async () => {
        try {
          const profile = await getMyProfile();
          if (isMounted) setPreferenceProfile(profile || {});
        } catch (error) {
          if (isMounted) setPreferenceProfile({});
        }
      };

      loadPreferenceProfile();

      return () => {
        isMounted = false;
      };
    }, [])
  );

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
  const canClear = canApply || hasSearched || results.length > 0;

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

  const draftFilters = useMemo(
    () => ({
      ageMin: ageMin.trim() || undefined,
      ageMax: ageMax.trim() || undefined,
      country: country.trim() || undefined,
      state: stateName.trim() || undefined,
      district: district.trim() || undefined,
      religion: religion.trim() || undefined,
      caste: caste.trim() || undefined,
      education: education.trim() || undefined,
      profession: profession.trim() || undefined,
      limit: 30,
    }),
    [ageMin, ageMax, country, stateName, district, religion, caste, education, profession]
  );

  const draftFilterChips = useMemo(() => buildFilterChips(draftFilters), [draftFilters]);
  const appliedFilterChips = useMemo(
    () => buildFilterChips(appliedFilters || {}),
    [appliedFilters]
  );
  const savedPreferenceCount = useMemo(
    () =>
      [
        preferenceProfile?.preferred_age_min || preferenceProfile?.preferred_age_max,
        preferenceProfile?.preferred_location,
        preferenceProfile?.preferred_state,
        preferenceProfile?.preferred_district,
        preferenceProfile?.preferred_religion,
        preferenceProfile?.preferred_caste,
        preferenceProfile?.preferred_education,
        preferenceProfile?.preferred_profession,
      ].filter(Boolean).length,
    [preferenceProfile]
  );

  const sortedResults = useMemo(
    () =>
      [...results]
        .map((profile) => ({
          ...profile,
          searchInsight: buildSearchInsight(profile, appliedFilters || {}, preferenceProfile || {}),
        }))
        .sort((left, right) => right.searchInsight.score - left.searchInsight.score),
    [appliedFilters, preferenceProfile, results]
  );

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

    const nextFilters = {
      ...draftFilters,
      limit: 30,
    };

    setHasSearched(true);
    setAppliedFilters(nextFilters);
    setExpandedScoreId(null);
    await loadResults(nextFilters);
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
    setAppliedFilters(null);
    setExpandedScoreId(null);
    hasLoadedOnceRef.current = false;
  };

  const refreshResults = useCallback(() => {
    if (!appliedFilters || showSkeleton) {
      return;
    }

    loadResults(appliedFilters);
  }, [appliedFilters, loadResults, showSkeleton]);

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

  const openProfileDetail = useCallback((item) => {
    navigation.navigate('ProfileDetail', {
      profile: item,
      searchInsight: item.searchInsight,
    });
  }, [navigation]);

  const renderScoreChip = (criterion) => {
    const toneStyle =
      criterion.status === 'match'
        ? [styles.criteriaChip, styles.criteriaChipMatch]
        : criterion.status === 'close'
          ? [styles.criteriaChip, styles.criteriaChipClose]
          : [styles.criteriaChip, styles.criteriaChipMiss];
    const textStyle =
      criterion.status === 'match'
        ? [styles.criteriaChipText, styles.criteriaChipTextMatch]
        : criterion.status === 'close'
          ? [styles.criteriaChipText, styles.criteriaChipTextClose]
          : [styles.criteriaChipText, styles.criteriaChipTextMiss];
    const chipColor = textStyle[1].color;
    const iconName =
      criterion.status === 'match'
        ? 'checkmark-circle'
        : criterion.status === 'close'
          ? 'ellipse'
          : 'close-circle';

    return (
      <View key={criterion.key} style={toneStyle}>
        <Ionicons name={iconName} size={14} color={chipColor} style={styles.criteriaChipIcon} />
        <Text style={textStyle} numberOfLines={1}>
          {criterion.label}
        </Text>
      </View>
    );
  };

  const renderResult = ({ item }) => {
    const isShortlisted = Boolean(likedById[item.id]);
    const isUpdatingShortlist = shortlistActionId === item.id;
    const insight = item.searchInsight;
    const expanded = expandedScoreId === item.id;
    const toneStyle =
      insight.tone.key === 'high'
        ? [styles.scoreTonePill, styles.scoreTonePillHigh]
        : insight.tone.key === 'strong'
          ? [styles.scoreTonePill, styles.scoreTonePillStrong]
          : insight.tone.key === 'good'
            ? [styles.scoreTonePill, styles.scoreTonePillGood]
            : [styles.scoreTonePill, styles.scoreTonePillOpen];
    const toneTextStyle =
      insight.tone.key === 'high'
        ? [styles.scoreToneText, styles.scoreToneTextHigh]
        : insight.tone.key === 'strong'
          ? [styles.scoreToneText, styles.scoreToneTextStrong]
          : insight.tone.key === 'good'
            ? [styles.scoreToneText, styles.scoreToneTextGood]
            : [styles.scoreToneText, styles.scoreToneTextOpen];
    const toneColor = toneTextStyle[1].color;

    return (
      <View style={styles.resultCard}>
        <ImageBackground
          source={getProfileImageSource(item.image)}
          style={styles.resultHero}
          imageStyle={styles.resultHeroImage}
          blurRadius={item.photo_blurred ? 18 : 0}
        >
          <View style={styles.resultHeroOverlay} />

          <View style={styles.resultHeroTop}>
            {item.isOnline ? (
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            ) : (
              <View />
            )}

            <View style={toneStyle}>
              <Ionicons
                name={insight.tone.icon}
                size={16}
                color={toneColor}
                style={styles.scoreToneIcon}
              />
              <Text style={toneTextStyle}>{insight.score}%</Text>
            </View>
          </View>

          <View style={styles.resultHeroBottom}>
            <Text style={styles.resultHeroName} numberOfLines={1}>
              {item.name || 'Profile'}
              {item.age ? <Text style={styles.resultHeroAge}>, {item.age}</Text> : null}
            </Text>

            {item.title ? (
              <View style={styles.resultHeroInfoRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={Colors.surface}
                  style={styles.resultHeroInfoIcon}
                />
                <Text style={styles.resultHeroInfoText}>{item.title}</Text>
              </View>
            ) : null}

            {(item.city || item.state || item.country) ? (
              <View style={styles.resultHeroInfoRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.surface}
                  style={styles.resultHeroInfoIcon}
                />
                <Text style={styles.resultHeroInfoText}>
                  {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>

        <View style={styles.resultBody}>
          <View style={styles.resultScoreHeader}>
            <View>
              <Text style={styles.resultScorePercent}>{insight.score}%</Text>
              <Text style={styles.resultScoreHeadline}>{insight.tone.label}</Text>
            </View>
            <View style={styles.resultMiniStat}>
              <Text style={styles.resultMiniStatValue}>
                {insight.strongMatches}/{insight.totalCount}
              </Text>
              <Text style={styles.resultMiniStatLabel}>strong cues</Text>
            </View>
          </View>

          <Text style={styles.resultSourceLine}>{insight.sourceLine}</Text>
          <Text style={styles.resultSummary}>{insight.summary}</Text>

          <View style={styles.criteriaWrap}>
            {insight.criteria.slice(0, expanded ? insight.criteria.length : 3).map(renderScoreChip)}
          </View>

          {expanded ? (
            <View style={styles.scoreBreakdown}>
              {insight.criteria.map((criterion, index) => {
                const badgeStyle =
                  criterion.status === 'match'
                    ? [styles.scoreBadge, styles.scoreBadgeMatch]
                    : criterion.status === 'close'
                      ? [styles.scoreBadge, styles.scoreBadgeClose]
                      : [styles.scoreBadge, styles.scoreBadgeMiss];
                const badgeTextStyle =
                  criterion.status === 'match'
                    ? [styles.scoreBadgeText, styles.scoreBadgeTextMatch]
                    : criterion.status === 'close'
                      ? [styles.scoreBadgeText, styles.scoreBadgeTextClose]
                      : [styles.scoreBadgeText, styles.scoreBadgeTextMiss];

                return (
                  <View
                    key={criterion.key}
                    style={[styles.scoreBreakdownRow, index !== 0 && styles.scoreBreakdownRowBorder]}
                  >
                    <View style={styles.scoreBreakdownBody}>
                      <Text style={styles.scoreBreakdownLabel}>{criterion.label}</Text>
                      <Text style={styles.scoreBreakdownMeta}>
                        Target: {criterion.expectedLabel}
                      </Text>
                      <Text style={styles.scoreBreakdownMeta}>
                        Profile: {criterion.actualLabel}
                      </Text>
                    </View>
                    <View style={badgeStyle}>
                      <Text style={badgeTextStyle}>{criterion.statusLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.resultActionsRow}>
            <Pressable
              style={styles.resultSecondaryBtn}
              onPress={() => setExpandedScoreId((prev) => (prev === item.id ? null : item.id))}
            >
              <Text style={styles.resultSecondaryBtnText}>
                {expanded ? 'Hide score details' : 'See score details'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.resultPrimaryBtn}
              onPress={() => openProfileDetail(item)}
            >
              <Text style={styles.resultPrimaryBtnText}>View Full Profile</Text>
            </Pressable>

            <Pressable
              hitSlop={10}
              style={styles.resultIconBtn}
              disabled={isUpdatingShortlist}
              onPress={() => toggleLike(item.id)}
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
          </View>
        </View>
      </View>
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
            style={[styles.headerBtn, (!appliedFilters || showSkeleton) && styles.headerBtnDisabled]}
            disabled={!appliedFilters || showSkeleton}
            onPress={refreshResults}
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
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.text} style={styles.heroBadgeIcon} />
              <Text style={styles.heroBadgeText}>Smart Match Search</Text>
            </View>
            <Text style={styles.heroTitle}>Filter profiles and rank them by match score</Text>
            <Text style={styles.heroSubtitle}>
              Apply your filters, compare compatibility, and open the full profile with score details.
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{draftFilterChips.length}</Text>
                <Text style={styles.heroStatLabel}>Active filters</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{savedPreferenceCount}</Text>
                <Text style={styles.heroStatLabel}>Saved prefs</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{hasSearched ? sortedResults.length : '--'}</Text>
                <Text style={styles.heroStatLabel}>Results</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.sectionTitle}>Search Filters</Text>
              <View style={styles.formModePill}>
                <Ionicons name="flash-outline" size={14} color={Colors.text} style={styles.formModeIcon} />
                <Text style={styles.formModeText}>Score enabled</Text>
              </View>
            </View>

            <View style={styles.ageRow}>
              <View style={styles.ageField}>
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
              </View>

              <View style={styles.ageField}>
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
              </View>
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

            <View style={styles.filterChipSection}>
              <Text style={styles.filterChipTitle}>Current filter summary</Text>
              {draftFilterChips.length ? (
                <View style={styles.filterChipWrap}>
                  {draftFilterChips.map((chip) => (
                    <View key={chip.key} style={styles.filterChip}>
                      <Text style={styles.filterChipText}>{chip.label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.filterHint}>
                  Add one or more filters to unlock scored results.
                </Text>
              )}
            </View>

            <View style={styles.formActionsRow}>
              <Pressable
                style={[styles.primaryBtn, canApply && styles.primaryBtnActive]}
                onPress={applyFilters}
                disabled={!canApply}
              >
                <Text style={[styles.primaryBtnText, canApply && styles.primaryBtnTextActive]}>
                  Apply Filters
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryActionBtn, !canClear && styles.secondaryActionBtnDisabled]}
                onPress={clearFilters}
                disabled={!canClear}
              >
                <Text style={styles.secondaryActionBtnText}>Reset</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeaderTextWrap}>
              <Text style={styles.sectionTitle}>Match Results</Text>
              <Text style={styles.resultCount}>
                {hasSearched
                  ? `${sortedResults.length} found, ranked by score`
                  : 'Run a search to see ranked profiles'}
              </Text>
            </View>
            {appliedFilterChips.length ? (
              <View style={styles.resultsPill}>
                <Text style={styles.resultsPillText}>{appliedFilterChips.length} filters live</Text>
              </View>
            ) : null}
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
              data={sortedResults}
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
                      ? 'Try adjusting your filters to widen the match score results.'
                      : 'Scored profile cards will appear here after you apply one or more filters.'}
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
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 180,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: '#EAD9CC',
    marginTop: Spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  heroBadgeIcon: {
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#5E4B40',
    fontWeight: '600',
  },
  heroStatsRow: {
    marginTop: 20,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.52)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6E5A4E',
    fontWeight: '700',
    textAlign: 'center',
  },
  heroStatDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(17, 17, 17, 0.08)',
    marginHorizontal: 8,
  },
  formCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  formModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#F3E7DA',
  },
  formModeIcon: {
    marginRight: 8,
  },
  formModeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageField: {
    flex: 1,
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
  filterChipSection: {
    marginTop: 6,
    paddingTop: 2,
  },
  filterChipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  filterChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#F3EDE8',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6A564B',
  },
  filterHint: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
    fontWeight: '600',
  },
  formActionsRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    height: 60,
    borderRadius: Radii.xl,
    backgroundColor: '#EAE4DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnActive: {
    backgroundColor: Colors.text,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.muted,
  },
  primaryBtnTextActive: {
    color: Colors.surface,
  },
  secondaryActionBtn: {
    height: 60,
    paddingHorizontal: 20,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
    marginLeft: 12,
  },
  secondaryActionBtnDisabled: {
    opacity: 0.45,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  resultsHeader: {
    marginTop: Spacing.xl,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsHeaderTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  resultCount: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '700',
  },
  resultsPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#F3E7DA',
  },
  resultsPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  resultCard: {
    marginBottom: Spacing.xl,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  resultHero: {
    height: 238,
    justifyContent: 'space-between',
  },
  resultHeroImage: {
    resizeMode: 'cover',
  },
  resultHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  resultHeroTop: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.online,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.surface,
  },
  scoreTonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  scoreTonePillHigh: {
    backgroundColor: '#E7F6EE',
  },
  scoreTonePillStrong: {
    backgroundColor: '#FFF3DA',
  },
  scoreTonePillGood: {
    backgroundColor: '#F8EEDA',
  },
  scoreTonePillOpen: {
    backgroundColor: '#F3E7DA',
  },
  scoreToneIcon: {
    marginRight: 8,
  },
  scoreToneText: {
    fontSize: 13,
    fontWeight: '900',
  },
  scoreToneTextHigh: {
    color: Colors.online,
  },
  scoreToneTextStrong: {
    color: '#B67800',
  },
  scoreToneTextGood: {
    color: '#9A6B12',
  },
  scoreToneTextOpen: {
    color: '#80563D',
  },
  resultHeroBottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  resultHeroName: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.surface,
  },
  resultHeroAge: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.surface,
  },
  resultHeroInfoRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultHeroInfoIcon: {
    marginRight: 10,
  },
  resultHeroInfoText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
  resultBody: {
    padding: Spacing.lg,
  },
  resultScoreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resultScorePercent: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    lineHeight: 36,
  },
  resultScoreHeadline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.muted,
  },
  resultMiniStat: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F4F0EC',
  },
  resultMiniStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  resultMiniStatLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.muted,
  },
  resultSourceLine: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    color: '#87634C',
  },
  resultSummary: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.muted,
    fontWeight: '600',
  },
  criteriaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  criteriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    marginRight: 8,
    marginBottom: 8,
  },
  criteriaChipMatch: {
    backgroundColor: '#E7F6EE',
  },
  criteriaChipClose: {
    backgroundColor: '#FFF3DA',
  },
  criteriaChipMiss: {
    backgroundColor: '#FDEBEC',
  },
  criteriaChipIcon: {
    marginRight: 6,
  },
  criteriaChipText: {
    maxWidth: 180,
    fontSize: 12,
    fontWeight: '800',
  },
  criteriaChipTextMatch: {
    color: Colors.online,
  },
  criteriaChipTextClose: {
    color: '#B67800',
  },
  criteriaChipTextMiss: {
    color: Colors.danger,
  },
  scoreBreakdown: {
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreBreakdownRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
  },
  scoreBreakdownRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scoreBreakdownBody: {
    flex: 1,
    marginRight: 12,
  },
  scoreBreakdownLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  scoreBreakdownMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '600',
  },
  scoreBadge: {
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  scoreBadgeMatch: {
    backgroundColor: '#E7F6EE',
  },
  scoreBadgeClose: {
    backgroundColor: '#FFF3DA',
  },
  scoreBadgeMiss: {
    backgroundColor: '#FDEBEC',
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scoreBadgeTextMatch: {
    color: Colors.online,
  },
  scoreBadgeTextClose: {
    color: '#B67800',
  },
  scoreBadgeTextMiss: {
    color: Colors.danger,
  },
  resultActionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultSecondaryBtn: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
  },
  resultSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  resultPrimaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
  },
  resultPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.surface,
  },
  resultIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 21,
    fontWeight: '600',
  },
});

export default SearchScreen;
