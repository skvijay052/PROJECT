import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme/theme';

const Tab = createBottomTabNavigator();
const CENTER_ROUTE_NAME = 'Chat';

const TAB_META = {
  Home: {
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  Search: {
    label: 'MatchScore',
    icon: 'search-outline',
    activeIcon: 'search',
  },
  Matches: {
    label: 'Interest',
    icon: 'heart-outline',
    activeIcon: 'heart',
  },
  Chat: {
    label: 'My Fans',
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
  },
  Profile: {
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
};

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const centerRoute = state.routes.find((route) => route.name === CENTER_ROUTE_NAME) || state.routes[2];
  const sideRoutes = state.routes.filter((route) => route.key !== centerRoute.key);
  const leftRoutes = sideRoutes.slice(0, 2);
  const rightRoutes = sideRoutes.slice(2);

  const renderSideTab = (route) => {
    const routeIndex = state.routes.findIndex((item) => item.key === route.key);
    const isFocused = state.index === routeIndex;
    const options = descriptors[route.key].options;
    const meta = TAB_META[route.name] || TAB_META.Home;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.sideTab}
      >
        <Ionicons
          name={isFocused ? meta.activeIcon : meta.icon}
          size={22}
          color={isFocused ? Colors.surface : '#5F6473'}
        />
        <Text style={[styles.sideLabel, isFocused && styles.sideLabelFocused]}>
          {meta.label}
        </Text>
        <View style={[styles.sideIndicator, isFocused && styles.sideIndicatorFocused]} />
      </Pressable>
    );
  };

  const centerIndex = state.routes.findIndex((route) => route.key === centerRoute.key);
  const isCenterFocused = state.index === centerIndex;
  const centerOptions = descriptors[centerRoute.key].options;
  const centerMeta = TAB_META[centerRoute.name] || TAB_META.Matches;

  const onCenterPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: centerRoute.key,
      canPreventDefault: true,
    });

    if (!isCenterFocused && !event.defaultPrevented) {
      navigation.navigate(centerRoute.name);
    }
  };

  const onCenterLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: centerRoute.key,
    });
  };

  return (
    <View style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.barWrap}>
        <View pointerEvents="none" style={styles.centerCutout} />

        <View style={styles.bar}>
          <View style={styles.sideGroup}>
            {leftRoutes.map(renderSideTab)}
          </View>

          <View style={styles.centerGap} />

          <View style={styles.sideGroup}>
            {rightRoutes.map(renderSideTab)}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={isCenterFocused ? { selected: true } : {}}
          accessibilityLabel={centerOptions.tabBarAccessibilityLabel}
          testID={centerOptions.tabBarButtonTestID}
          onLongPress={onCenterLongPress}
          onPress={onCenterPress}
          style={[styles.centerButton, isCenterFocused && styles.centerButtonFocused]}
        >
          <Ionicons
            name={isCenterFocused ? centerMeta.activeIcon : centerMeta.icon}
            size={28}
            color={Colors.surface}
          />
        </Pressable>
      </View>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        sceneStyle: styles.scene,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  scene: {
    backgroundColor: 'transparent',
  },
  outerWrap: {
    paddingTop: 14,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  barWrap: {
    position: 'relative',
  },
  bar: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 26,
    paddingBottom: 10,
    borderRadius: 34,
    backgroundColor: '#050507',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  centerCutout: {
    position: 'absolute',
    top: -1,
    left: '50%',
    width: 100,
    height: 48,
    marginLeft: -50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: Colors.backdrop,
    zIndex: 2,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  centerGap: {
    width: 88,
  },
  sideTab: {
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sideLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#5F6473',
  },
  sideLabelFocused: {
    color: Colors.surface,
  },
  sideIndicator: {
    marginTop: 8,
    width: 24,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  sideIndicatorFocused: {
    backgroundColor: '#D89CFF',
  },
  centerButton: {
    position: 'absolute',
    top: -30,
    left: '50%',
    width: 76,
    height: 76,
    marginLeft: -38,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: Colors.accent,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    zIndex: 3,
  },
  centerButtonFocused: {
    transform: [{ scale: 1.03 }],
  },
});

export default MainTabNavigator;
