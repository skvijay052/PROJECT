import { View, StyleSheet } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
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
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import AppBackground from './components/AppBackground';
import { Colors } from './theme/theme';

const Stack = createStackNavigator();
const withSharedBackground = (Component) => {
  const WrappedScreen = (props) => (
    <View style={styles.screenShell}>
      <AppBackground />
      <Component {...props} />
    </View>
  );

  WrappedScreen.displayName = `WithSharedBackground(${Component.displayName || Component.name || 'Screen'})`;
  return WrappedScreen;
};

const SplashWithBackground = withSharedBackground(SplashScreen);
const WelcomeWithBackground = withSharedBackground(WelcomeScreen);
const LoginWithBackground = withSharedBackground(LoginScreen);
const RegisterWithBackground = withSharedBackground(RegisterScreen);
const MainWithBackground = withSharedBackground(MainTabNavigator);
const EditProfileWithBackground = withSharedBackground(EditProfileScreen);
const UploadPhotosWithBackground = withSharedBackground(UploadPhotosScreen);
const PreferencesWithBackground = withSharedBackground(PreferencesScreen);
const NotificationsWithBackground = withSharedBackground(NotificationsScreen);
const ShortlistWithBackground = withSharedBackground(ShortlistScreen);
const SubscriptionWithBackground = withSharedBackground(SubscriptionScreen);
const BlockedUsersWithBackground = withSharedBackground(BlockedUsersScreen);
const ProfileDetailWithBackground = withSharedBackground(ProfileDetailScreen);
const ChatDetailWithBackground = withSharedBackground(ChatDetailScreen);
const ForgotPasswordWithBackground = withSharedBackground(ForgotPasswordScreen);

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.backdrop,
    border: Colors.border,
    card: Colors.surface,
    text: Colors.text,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.appShell}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              cardStyle: { backgroundColor: 'transparent' },
              headerStyle: styles.header,
              headerTintColor: Colors.text,
              headerTitleStyle: styles.headerTitle,
            }}
          >
            <Stack.Screen name="Splash" component={SplashWithBackground} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="Welcome" component={WelcomeWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginWithBackground} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="Main" component={MainWithBackground} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen
              name="CompleteProfile"
              component={EditProfileWithBackground}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="EditProfile" component={EditProfileWithBackground} />
            <Stack.Screen name="UploadPhotos" component={UploadPhotosWithBackground} />
            <Stack.Screen name="Preferences" component={PreferencesWithBackground} />
            <Stack.Screen name="Notifications" component={NotificationsWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="Shortlist" component={ShortlistWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="Subscription" component={SubscriptionWithBackground} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersWithBackground} />
            <Stack.Screen name="ProfileDetail" component={ProfileDetailWithBackground} options={{ headerShown: false }} />
            <Stack.Screen name="ChatDetail" component={ChatDetailWithBackground} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
  screenShell: {
    flex: 1,
    backgroundColor: Colors.backdrop,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerTitle: {
    color: Colors.text,
    fontWeight: '700',
  },
});
