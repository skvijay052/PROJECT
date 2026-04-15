import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const SelectField = ({
  iconName,
  placeholder,
  title,
  value,
  options = [],
  onSelect,
  disabled = false,
  searchable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(
    () => [...new Set((options || []).filter(Boolean))],
    [options]
  );
  const shouldShowSearch = searchable && normalizedOptions.length > 8;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((item) => item.toLowerCase().includes(normalizedQuery));
  }, [normalizedOptions, query]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const openSheet = () => {
    if (disabled) {
      return;
    }

    Keyboard.dismiss();
    setVisible(true);
  };

  const closeSheet = () => {
    setVisible(false);
  };

  const handleSelect = (nextValue) => {
    onSelect?.(nextValue);
    closeSheet();
  };

  return (
    <>
      <Pressable
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={openSheet}
        disabled={disabled}
      >
        <Ionicons name={iconName} size={18} color={Colors.muted} style={styles.fieldIcon} />
        <Text
          style={[styles.fieldText, !value && styles.placeholderText]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color={Colors.muted} />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />

          <KeyboardAvoidingView
            style={styles.sheetWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{title || placeholder}</Text>
                <Pressable style={styles.closeButton} onPress={closeSheet}>
                  <Ionicons name="close" size={22} color={Colors.text} />
                </Pressable>
              </View>

              {shouldShowSearch ? (
                <View style={styles.searchWrap}>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={Colors.muted}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    placeholderTextColor={Colors.muted}
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                  />
                </View>
              ) : null}

              {filteredOptions.length ? (
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item === value;
                    return (
                      <Pressable
                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                        onPress={() => handleSelect(item)}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {item}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.text} />
                        ) : null}
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle-outline" size={22} color={Colors.muted} />
                  <Text style={styles.emptyStateText}>No options available yet.</Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    height: 58,
    borderRadius: Radii.xl,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: 14,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholderText: {
    color: Colors.muted,
    fontWeight: '500',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.28)',
  },
  sheet: {
    maxHeight: '80%',
    minHeight: 350,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.card,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chip,
    marginLeft: Spacing.md,
  },
  searchWrap: {
    height: 52,
    borderRadius: Radii.lg,
    backgroundColor: Colors.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  optionRow: {
    minHeight: 54,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionRowSelected: {
    backgroundColor: Colors.chip,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginRight: 12,
  },
  optionTextSelected: {
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
  },
});

export default SelectField;
