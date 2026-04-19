import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { FormScreenSkeleton } from '../components/Skeleton';
import SelectField from '../components/SelectField';
import Alert from '../lib/alert';
import { getMyProfile, updateMyPreferences } from '../lib/api';
import {
  COUNTRY_OPTIONS,
  EDUCATION_OPTIONS,
  PROFESSION_OPTIONS,
  RELIGION_OPTIONS,
  getCasteOptions,
  getCityOptions,
  getDistrictOptions,
  getStateOptions,
  withSelectedOption,
} from '../lib/profileOptions';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const PreferencesScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [location, setLocation] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [religion, setReligion] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [caste, setCaste] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getMyProfile();
      setAgeMin(profile?.preferred_age_min ? String(profile.preferred_age_min) : '');
      setAgeMax(profile?.preferred_age_max ? String(profile.preferred_age_max) : '');
      setLocation(profile?.preferred_location || '');
      setStateName(profile?.preferred_state || '');
      setCity(profile?.preferred_city || '');
      setDistrict(profile?.preferred_district || '');
      setReligion(profile?.preferred_religion || '');
      setEducation(profile?.preferred_education || '');
      setProfession(profile?.preferred_profession || '');
      setCaste(profile?.preferred_caste || '');
    } catch (error) {
      if (error?.status !== 404) {
        Alert.alert('Load failed', error?.message || 'Unable to load your preferences.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
  );

  const locationOptions = useMemo(
    () => withSelectedOption(COUNTRY_OPTIONS, location),
    [location]
  );
  const stateOptions = useMemo(
    () => withSelectedOption(getStateOptions(location), stateName),
    [location, stateName]
  );
  const cityOptions = useMemo(
    () => withSelectedOption(getCityOptions(location, stateName), city),
    [location, stateName, city]
  );
  const districtOptions = useMemo(
    () => withSelectedOption(getDistrictOptions(location, stateName), district),
    [location, stateName, district]
  );
  const religionOptions = useMemo(
    () => withSelectedOption(RELIGION_OPTIONS, religion),
    [religion]
  );
  const educationOptions = useMemo(
    () => withSelectedOption(EDUCATION_OPTIONS, education),
    [education]
  );
  const professionOptions = useMemo(
    () => withSelectedOption(PROFESSION_OPTIONS, profession),
    [profession]
  );
  const casteOptions = useMemo(
    () => withSelectedOption(getCasteOptions(religion), caste),
    [religion, caste]
  );

  const handleAgeMinChange = useCallback((value) => {
    setAgeMin(value.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  const handleAgeMaxChange = useCallback((value) => {
    setAgeMax(value.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  const handleLocationSelect = useCallback((value) => {
    setLocation(value);

    const nextStates = getStateOptions(value);
    if (!nextStates.includes(stateName)) {
      setStateName('');
      setCity('');
      setDistrict('');
      return;
    }

    if (!getCityOptions(value, stateName).includes(city)) {
      setCity('');
    }

    if (!getDistrictOptions(value, stateName).includes(district)) {
      setDistrict('');
    }
  }, [city, district, stateName]);

  const handleStateSelect = useCallback((value) => {
    setStateName(value);

    if (!getCityOptions(location, value).includes(city)) {
      setCity('');
    }

    if (!getDistrictOptions(location, value).includes(district)) {
      setDistrict('');
    }
  }, [city, district, location]);

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

  const canSave = useMemo(() => (
    ageMin.trim().length > 0 ||
    ageMax.trim().length > 0 ||
    location.trim().length > 0 ||
    stateName.trim().length > 0 ||
    city.trim().length > 0 ||
    district.trim().length > 0 ||
    religion.trim().length > 0 ||
    education.trim().length > 0 ||
    profession.trim().length > 0 ||
    caste.trim().length > 0
  ), [ageMin, ageMax, location, stateName, city, district, religion, education, profession, caste]);

  const handleSave = async () => {
    if (isSaving || !canSave) return;

    const trimmedAgeMin = ageMin.trim();
    const trimmedAgeMax = ageMax.trim();
    const parsedAgeMin = trimmedAgeMin ? Number(trimmedAgeMin) : null;
    const parsedAgeMax = trimmedAgeMax ? Number(trimmedAgeMax) : null;

    if (
      (trimmedAgeMin && (!Number.isInteger(parsedAgeMin) || parsedAgeMin < 18 || parsedAgeMin > 99)) ||
      (trimmedAgeMax && (!Number.isInteger(parsedAgeMax) || parsedAgeMax < 18 || parsedAgeMax > 99))
    ) {
      Alert.alert('Invalid age range', 'Please enter ages between 18 and 99.');
      return;
    }

    if (parsedAgeMin !== null && parsedAgeMax !== null && parsedAgeMin > parsedAgeMax) {
      Alert.alert('Invalid age range', 'Minimum age must be less than or equal to maximum age.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMyPreferences({
        preferred_age_min: parsedAgeMin,
        preferred_age_max: parsedAgeMax,
        preferred_location: location.trim() || null,
        preferred_state: stateName.trim() || null,
        preferred_city: city.trim() || null,
        preferred_district: district.trim() || null,
        preferred_religion: religion.trim() || null,
        preferred_education: education.trim() || null,
        preferred_profession: profession.trim() || null,
        preferred_caste: caste.trim() || null,
      });
      Alert.alert('Preferences updated', 'Your partner preferences have been saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Unable to save your preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}> 
            {isLoading ? (
              <FormScreenSkeleton fields={10} />
            ) : (
              <>
            <View style={styles.inputWrap}>
              <Ionicons name="hourglass-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
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
              <Ionicons name="hourglass-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
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
              title="Select Location"
              placeholder="Location"
              value={location}
              options={locationOptions}
              onSelect={handleLocationSelect}
            />

            <SelectField
              iconName="map-outline"
              title="Select State"
              placeholder={location ? 'State' : 'Select location first'}
              value={stateName}
              options={stateOptions}
              onSelect={handleStateSelect}
              disabled={!location}
            />

            <SelectField
              iconName="business-outline"
              title="Select City"
              placeholder={stateName ? 'City' : 'Select state first'}
              value={city}
              options={cityOptions}
              onSelect={setCity}
              disabled={!location || !stateName}
            />

            <SelectField
              iconName="location-outline"
              title="Select District"
              placeholder={stateName ? 'District' : 'Select state first'}
              value={district}
              options={districtOptions}
              onSelect={setDistrict}
              disabled={!location || !stateName}
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
              style={[styles.primaryBtn, canSave && !isSaving && styles.primaryBtnActive]}
              onPress={handleSave}
              disabled={!canSave || isSaving}
            >
              <Text style={[styles.primaryBtnText, canSave && !isSaving && styles.primaryBtnTextActive]}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </Pressable>
              </>
            )}
          </View>
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
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 180,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
  },
});

export default PreferencesScreen;
