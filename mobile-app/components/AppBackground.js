import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Colors } from '../theme/theme';

const AppBackground = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={[styles.orb, styles.orbMintTop]} />
      <View style={[styles.orb, styles.orbLavenderRight]} />
      <View style={[styles.orb, styles.orbButterCenter]} />
      <View style={[styles.orb, styles.orbMintBottom]} />
      <View style={[styles.orb, styles.orbLavenderBottom]} />
      <View style={styles.haze} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.backdrop,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbMintTop: {
    width: 420,
    height: 420,
    top: -110,
    left: -150,
    backgroundColor: 'rgba(165, 236, 233, 0.74)',
  },
  orbLavenderRight: {
    width: 430,
    height: 430,
    top: 40,
    right: -180,
    backgroundColor: 'rgba(216, 206, 255, 0.72)',
  },
  orbButterCenter: {
    width: 320,
    height: 320,
    top: 220,
    left: 40,
    backgroundColor: 'rgba(255, 245, 210, 0.4)',
  },
  orbMintBottom: {
    width: 460,
    height: 460,
    bottom: -220,
    left: -180,
    backgroundColor: 'rgba(196, 240, 236, 0.52)',
  },
  orbLavenderBottom: {
    width: 360,
    height: 360,
    bottom: -150,
    right: -110,
    backgroundColor: 'rgba(228, 218, 255, 0.6)',
  },
  haze: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});

export default AppBackground;
