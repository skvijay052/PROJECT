import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { Colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused) => {
  if (routeName === 'Home') return focused ? 'home' : 'home-outline';
  if (routeName === 'Search') return focused ? 'flame' : 'flame-outline';
  if (routeName === 'Matches') return focused ? 'heart' : 'heart-outline';
  if (routeName === 'Chat') return focused ? 'chatbubble' : 'chatbubble-outline';
  return focused ? 'person' : 'person-outline';
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 62,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size ?? 26} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
