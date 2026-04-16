import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

import { getSupabaseSession, isSupabaseConfigured } from '../lib/supabase';
import { Colors } from '../theme/theme';

const SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const heartScale = useRef(new Animated.Value(0.9)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const floatUp = useRef(new Animated.Value(8)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!isMounted) return;

      if (!isSupabaseConfigured) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
        return;
      }

      try {
        navigation.reset({
          index: 0,
          routes: [{ name: (await getSupabaseSession()) ? 'Main' : 'Welcome' }],
        });
      } catch (error) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    };

    bootstrap();

    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(floatUp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 0.95,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      isMounted = false;
    };
  }, [fadeIn, floatUp, heartScale, logoScale, navigation, pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />

      <Animated.View
        style={[
          styles.ring,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.7],
                }),
              },
            ],
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 0],
            }),
          },
        ]}
      />

      <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
        <Animated.Text style={[styles.heart, { transform: [{ scale: heartScale }] }]}>
          {'\u2665'}
        </Animated.Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.brand,
          {
            opacity: fadeIn,
            transform: [{ translateY: floatUp }],
          },
        ]}
      >
        Bandhanaa
      </Animated.Text>
      <Text style={styles.tagline}>Find Your Life Partner</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(170, 236, 234, 0.6)',
    top: -60,
    left: -80,
  },
  blobTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(220, 208, 255, 0.64)',
    bottom: -40,
    right: -60,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.94)',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A28CCF',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heart: {
    fontSize: 56,
    color: Colors.accent,
  },
  brand: {
    marginTop: 18,
    fontSize: 32,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.muted,
    opacity: 0.8,
  },
});

export default SplashScreen;
