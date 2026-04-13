import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import EditProfileScreen from './screens/EditProfileScreen';
import UploadPhotosScreen from './screens/UploadPhotosScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ShortlistScreen from './screens/ShortlistScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import BlockedUsersScreen from './screens/BlockedUsersScreen';
import ProfileDetailScreen from './screens/ProfileDetailScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen
            name="CompleteProfile"
            component={EditProfileScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="UploadPhotos" component={UploadPhotosScreen} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Shortlist" component={ShortlistScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
