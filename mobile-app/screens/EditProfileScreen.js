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
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { FormScreenSkeleton } from '../components/Skeleton';
import SelectField from '../components/SelectField';
import { getMyProfile, upsertMyProfile } from '../lib/api';
import {
  COUNTRY_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  PROFESSION_OPTIONS,
  RELIGION_OPTIONS,
  getCasteOptions,
  getDistrictOptions,
  getStateOptions,
  withSelectedOption,
} from '../lib/profileOptions';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const EditProfileScreen = ({ navigation, route }) => {
  const isOnboarding = route?.params?.onboarding === true;
  const syncMessage = route?.params?.syncMessage || '';
  const scrollViewRef = useRef(null);
  const [age, setAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('Public');
  const [height, setHeight] = useState('');
  const [religion, setReligion] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [caste, setCaste] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getMyProfile();
      setAge(profile?.age ? String(profile.age) : '');
      setMaritalStatus(profile?.marital_status || '');
      setProfileVisibility(profile?.profile_visibility || 'Public');
      setHeight(profile?.height || '');
      setReligion(profile?.religion || '');
      setEducation(profile?.education || '');
      setProfession(profile?.title || '');
      setCaste(profile?.caste || '');
      setCity(profile?.city || '');
      setStateName(profile?.state || '');
      setCountry(profile?.country || '');
      setProfileImage(profile?.image || '');
      setBio(profile?.bio || '');
    } catch (error) {
      if (error?.status !== 404) {
        Alert.alert('Load failed', error?.message || 'Unable to load your profile.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const religionOptions = useMemo(
    () => withSelectedOption(RELIGION_OPTIONS, religion),
    [religion]
  );
  const educationOptions = useMemo(
    () => withSelectedOption(EDUCATION_OPTIONS, education),
    [education]
  );
  const maritalStatusOptions = useMemo(
    () => withSelectedOption(MARITAL_STATUS_OPTIONS, maritalStatus),
    [maritalStatus]
  );
  const profileVisibilityOptions = useMemo(
    () => withSelectedOption(PROFILE_VISIBILITY_OPTIONS, profileVisibility),
    [profileVisibility]
  );
  const professionOptions = useMemo(
    () => withSelectedOption(PROFESSION_OPTIONS, profession),
    [profession]
  );
  const countryOptions = useMemo(
    () => withSelectedOption(COUNTRY_OPTIONS, country),
    [country]
  );
  const casteOptions = useMemo(
    () => withSelectedOption(getCasteOptions(religion), caste),
    [religion, caste]
  );
  const stateOptions = useMemo(
    () => withSelectedOption(getStateOptions(country), stateName),
    [country, stateName]
  );
  const districtOptions = useMemo(
    () => withSelectedOption(getDistrictOptions(country, stateName), city),
    [country, stateName, city]
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleAgeChange = useCallback((value) => {
    setAge(value.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  const handleHeightChange = useCallback((value) => {
    setHeight(value.replace(/[^0-9]/g, '').slice(0, 3));
  }, []);

  const handleReligionSelect = useCallback((value) => {
    setReligion(value);
    if (!getCasteOptions(value).includes(caste)) {
      setCaste('');
    }
  }, [caste]);

  const handleCountrySelect = useCallback((value) => {
    setCountry(value);

    const nextStateOptions = getStateOptions(value);
    if (!nextStateOptions.includes(stateName)) {
      setStateName('');
      setCity('');
      return;
    }

    if (!getDistrictOptions(value, stateName).includes(city)) {
      setCity('');
    }
  }, [city, stateName]);

  const handleStateSelect = useCallback((value) => {
    setStateName(value);
    if (!getDistrictOptions(country, value).includes(city)) {
      setCity('');
    }
  }, [city, country]);

  const scrollToFocusedInput = useCallback((target) => {
    if (!target || !scrollViewRef.current) {
      return;
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 110, true);
    }, 120);
  }, []);

  const canSave = useMemo(() => (
    age.trim().length > 0 ||
    maritalStatus.trim().length > 0 ||
    profileVisibility.trim().length > 0 ||
    height.trim().length > 0 ||
    religion.trim().length > 0 ||
    education.trim().length > 0 ||
    profession.trim().length > 0 ||
    caste.trim().length > 0 ||
    city.trim().length > 0 ||
    stateName.trim().length > 0 ||
    country.trim().length > 0 ||
    bio.trim().length > 0
  ), [age, maritalStatus, profileVisibility, height, religion, education, profession, caste, city, stateName, country, bio]);

  const handleSave = async () => {
    if (isSaving || !canSave) return;

    const trimmedAge = age.trim();
    const parsedAge = trimmedAge ? Number(trimmedAge) : null;
    if (trimmedAge && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99)) {
      Alert.alert('Invalid age', 'Please enter an age between 18 and 99.');
      return;
    }

    try {
      setIsSaving(true);
      await upsertMyProfile({
        age: parsedAge,
        marital_status: maritalStatus.trim() || null,
        profile_visibility: profileVisibility.trim() || 'Public',
        height: height.trim() || null,
        religion: religion.trim() || null,
        education: education.trim() || null,
        title: profession.trim() || null,
        caste: caste.trim() || null,
        city: city.trim() || null,
        state: stateName.trim() || null,
        country: country.trim() || null,
        bio: bio.trim() || null,
      });
      if (isOnboarding) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      Alert.alert('Profile updated', 'Your profile details have been saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Unable to save your profile.');
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
            {isOnboarding ? (
              <View style={styles.onboardingHero}>
                <Text style={styles.onboardingTitle}>Complete Your Profile</Text>
                <Text style={styles.onboardingSubtitle}>
                  Your account is ready. Add a few more details so we can show better matches.
                </Text> 
                {syncMessage ? (
                  <Text style={styles.onboardingNote}>{syncMessage}</Text>
                ) : null}
              </View>
            ) : null}

            {isLoading ? (
              <FormScreenSkeleton fields={11} showPhoto />
            ) : (
              <>

            <View style={styles.inputWrap}>
              <Ionicons name="hourglass-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor={Colors.muted}
                value={age}
                onChangeText={handleAgeChange}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <SelectField
              iconName="heart-outline"
              title="Select Marital Status"
              placeholder="Marital Status"
              value={maritalStatus}
              options={maritalStatusOptions}
              onSelect={setMaritalStatus}
            />

            <SelectField
              iconName="eye-outline"
              title="Who Can See Profile Photo?"
              placeholder="Profile Photo Visibility"
              value={profileVisibility}
              options={profileVisibilityOptions}
              onSelect={setProfileVisibility}
            />

            <View style={styles.inputWrap}>
              <Ionicons name="resize-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                placeholderTextColor={Colors.muted}
                value={height}
                onChangeText={handleHeightChange}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

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
              value={city}
              options={districtOptions}
              onSelect={setCity}
              disabled={!country || !stateName}
            />

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Profile Photo</Text>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.emptyPhotoState}>
                  <Ionicons name="image-outline" size={28} color={Colors.muted} />
                  <Text style={styles.emptyPhotoText}>No profile photo selected yet.</Text>
                </View>
              )}
              <Pressable
                style={styles.photoManageBtn}
                onPress={() => navigation.navigate('UploadPhotos')}
              >
                <Text style={styles.photoManageBtnText}>
                  {profileImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.inputWrap, styles.inputWrapMultiline]}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.muted} style={styles.inputLeftIcon} />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Bio"
                placeholderTextColor={Colors.muted}
                value={bio}
                onChangeText={setBio}
                onFocus={(event) => scrollToFocusedInput(event.target)}
                multiline
              />
            </View>

            <Pressable
              style={[styles.primaryBtn, canSave && !isSaving && styles.primaryBtnActive]}
              onPress={handleSave}
              disabled={!canSave || isSaving}
            >
              <Text style={[styles.primaryBtnText, canSave && !isSaving && styles.primaryBtnTextActive]}>
                {isSaving ? 'Saving...' : isOnboarding ? 'Continue' : 'Save Changes'}
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
  onboardingHero: {
    marginBottom: Spacing.lg,
  },
  onboardingTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.text,
  },
  onboardingSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
    fontWeight: '600',
  },
  onboardingSummaryPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    ...Shadows.chip,
  },
  onboardingSummaryText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  onboardingNote: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
    fontWeight: '600',
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
  inputWrapMultiline: {
    alignItems: 'flex-start',
    height: 120,
    paddingTop: 16,
  },
  inputLeftIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
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
  previewCard: {
    borderRadius: Radii.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: 14,
    ...Shadows.chip,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
  },
  emptyPhotoState: {
    height: 180,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoText: {
    marginTop: 10,
    color: Colors.muted,
    fontWeight: '600',
  },
  photoManageBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoManageBtnText: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default EditProfileScreen;
