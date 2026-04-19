import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { registerAlertHost } from '../lib/alert';
import { Colors, Radii, Shadows, Spacing } from '../theme/theme';

const TONE_KEYWORDS = {
  success: ['updated', 'saved', 'uploaded', 'sent', "it's a match", 'logged in', 'verify email'],
  warning: ['not ready', 'not found', 'permission', 'setup required', 'backend not configured'],
  danger: ['failed', 'unable', 'invalid', 'error', 'declined'],
};

function inferTone(title, message) {
  const copy = `${title} ${message}`.toLowerCase();

  if (TONE_KEYWORDS.danger.some((keyword) => copy.includes(keyword))) {
    return 'danger';
  }

  if (TONE_KEYWORDS.warning.some((keyword) => copy.includes(keyword))) {
    return 'warning';
  }

  if (TONE_KEYWORDS.success.some((keyword) => copy.includes(keyword))) {
    return 'success';
  }

  return 'info';
}

function getToneMeta(tone) {
  if (tone === 'danger') {
    return {
      icon: 'alert-circle',
      accent: Colors.danger,
      tint: 'rgba(255, 90, 95, 0.12)',
      border: 'rgba(255, 90, 95, 0.22)',
    };
  }

  if (tone === 'warning') {
    return {
      icon: 'warning',
      accent: Colors.warning,
      tint: 'rgba(245, 165, 36, 0.12)',
      border: 'rgba(245, 165, 36, 0.22)',
    };
  }

  if (tone === 'success') {
    return {
      icon: 'checkmark-circle',
      accent: Colors.success,
      tint: 'rgba(46, 204, 113, 0.12)',
      border: 'rgba(46, 204, 113, 0.22)',
    };
  }

  return {
    icon: 'notifications',
    accent: Colors.accent,
    tint: 'rgba(160, 45, 255, 0.12)',
    border: 'rgba(160, 45, 255, 0.18)',
  };
}

const AppAlertHost = () => {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const isClosingRef = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => registerAlertHost((request) => {
    setQueue((prev) => [...prev, request]);
  }), []);

  useEffect(() => {
    if (!activeAlert && queue.length > 0) {
      setActiveAlert(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [activeAlert, queue]);

  useEffect(() => {
    if (!activeAlert) {
      return undefined;
    }

    opacity.setValue(0);
    translateY.setValue(28);
    scale.setValue(0.98);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return undefined;
  }, [activeAlert, opacity, scale, translateY]);

  const dismissAlert = useCallback((button) => {
    if (!activeAlert || isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 22,
        duration: 170,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 170,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosingRef.current = false;
      setActiveAlert(null);
      button?.onPress?.();
    });
  }, [activeAlert, opacity, scale, translateY]);

  const toneMeta = useMemo(() => {
    if (!activeAlert) {
      return null;
    }

    return getToneMeta(inferTone(activeAlert.title, activeAlert.message));
  }, [activeAlert]);

  if (!activeAlert || !toneMeta) {
    return null;
  }

  const canDismissByBackdrop = activeAlert.options?.cancelable !== false;
  const buttons = activeAlert.buttons?.length ? activeAlert.buttons : [{ text: 'Got it' }];
  const isButtonRow = buttons.length === 2;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (canDismissByBackdrop) {
          dismissAlert();
        }
      }}
    >
      <View style={styles.overlayRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (canDismissByBackdrop) {
              dismissAlert();
            }
          }}
        >
          <Animated.View style={[styles.overlay, { opacity }]} />
        </Pressable>

        <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <View style={styles.glowRow}>
              <View style={[styles.iconBadge, { backgroundColor: toneMeta.tint, borderColor: toneMeta.border }]}>
                <Ionicons name={toneMeta.icon} size={24} color={toneMeta.accent} />
              </View>

              {canDismissByBackdrop ? (
                <Pressable style={styles.closeButton} onPress={() => dismissAlert()}>
                  <Ionicons name="close" size={18} color={Colors.muted} />
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.accentBar, { backgroundColor: toneMeta.accent }]} />

            <Text style={styles.title}>{activeAlert.title || 'Notice'}</Text>

            {activeAlert.message ? (
              <Text style={styles.message}>{activeAlert.message}</Text>
            ) : null}

            <View style={[styles.buttonStack, isButtonRow && styles.buttonRow]}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                const buttonStyle = [
                  styles.actionButton,
                  isButtonRow && styles.actionButtonRow,
                  isCancel && styles.actionButtonSecondary,
                  isDestructive && styles.actionButtonDestructive,
                  !isCancel && !isDestructive && styles.actionButtonPrimary,
                ];
                const textStyle = [
                  styles.actionButtonText,
                  isCancel && styles.actionButtonTextSecondary,
                  isDestructive && styles.actionButtonTextDestructive,
                  !isCancel && !isDestructive && styles.actionButtonTextPrimary,
                ];

                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    style={buttonStyle}
                    onPress={() => dismissAlert(button)}
                  >
                    <Text style={textStyle}>{button.text || 'OK'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheetWrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sheet: {
    borderRadius: Radii.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(147, 151, 181, 0.18)',
    overflow: 'hidden',
    ...Shadows.card,
  },
  glowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 247, 251, 0.95)',
  },
  accentBar: {
    width: 54,
    height: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  message: {
    marginTop: 10,
    color: Colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonStack: {
    marginTop: 18,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  actionButton: {
    minHeight: 52,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
  },
  actionButtonRow: {
    flex: 1,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(245, 247, 251, 0.95)',
    borderColor: Colors.border,
  },
  actionButtonDestructive: {
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    borderColor: 'rgba(255, 90, 95, 0.18)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    color: Colors.text,
  },
  actionButtonTextDestructive: {
    color: Colors.danger,
  },
});

export default AppAlertHost;
