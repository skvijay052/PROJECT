import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { PhotoGallerySkeleton } from '../components/Skeleton';
import Alert from '../lib/alert';
import { deleteMyPhoto, getMyPhotos, setMyPrimaryPhoto, uploadMyPhoto } from '../lib/api';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const UploadPhotosScreen = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getMyPhotos();
      setPhotos(response?.items || []);
    } catch (error) {
      Alert.alert('Load failed', error?.message || 'Unable to load your profile photos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  const canUpload = useMemo(() => photos.length < 6 && !isSaving, [isSaving, photos.length]);

  const pickPhoto = async () => {
    if (isSaving) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    try {
      setIsSaving(true);
      const uploadedPhoto = await uploadMyPhoto(asset);
      setPhotos(prev => {
        const next = [...prev, uploadedPhoto];
        next.sort((left, right) => Number(right.is_primary) - Number(left.is_primary));
        return next;
      });
      Alert.alert('Photo uploaded', 'Your photo has been added to your gallery.');
    } catch (error) {
      Alert.alert('Upload failed', error?.message || 'Unable to upload your photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const setPrimary = async (id) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const primaryPhoto = await setMyPrimaryPhoto(id);
      setPhotos(prev =>
        prev
          .map(photo => ({ ...photo, is_primary: photo.id === primaryPhoto.id }))
          .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
      );
    } catch (error) {
      Alert.alert('Update failed', error?.message || 'Unable to set the primary photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePhoto = async (id) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await deleteMyPhoto(id);
      await loadPhotos();
    } catch (error) {
      Alert.alert('Delete failed', error?.message || 'Unable to remove your photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPhoto = ({ item }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.image_url }} style={styles.photo} />
      {item.is_primary && (
        <View style={styles.primaryPill}>
          <Text style={styles.primaryText}>Primary</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={() => setPrimary(item.id)}>
          <Ionicons name="star-outline" size={16} color={Colors.text} />
          <Text style={styles.actionText}>
            {item.is_primary ? 'Primary Photo' : 'Set Primary'}
          </Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => deletePhoto(item.id)}>
          <Ionicons name="trash-outline" size={16} color={Colors.text} />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.container}> 

        <View style={styles.content}>
          {isLoading ? (
            <PhotoGallerySkeleton />
          ) : (
            <>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Manage your photo gallery</Text>
            <Text style={styles.infoText}>
              Upload up to 6 photos. Use Set Primary to choose the photo shown across your profile.
            </Text>
            <Pressable
              style={[styles.primaryBtn, !canUpload && styles.primaryBtnDisabled]}
              onPress={pickPhoto}
              disabled={!canUpload}
            >
              <Text style={styles.primaryBtnText}>
                {isSaving ? 'Saving...' : 'Upload Photo'}
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="image-outline" size={32} color={Colors.muted} />
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptySubtitle}>Add one profile photo to show on your account.</Text>
              </View>
            }
          />
            </>
          )}
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  primaryBtn: {
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: Colors.surface,
    fontWeight: '900',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.muted,
  },
  photoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 12,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
  },
  primaryPill: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.text,
  },
  primaryText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.muted,
    fontWeight: '600',
  },
});

export default UploadPhotosScreen;
