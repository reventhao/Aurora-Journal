import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RootStackParamList, TabParamList } from './navigation';
import { ExploreScreen } from './screens/explore-screen';
import { HomeScreen } from './screens/home-screen';
import { NotificationsScreen } from './screens/notifications-screen';
import { PostDetailScreen } from './screens/post-detail-screen';
import { PostsScreen } from './screens/posts-screen';
import { ProfileScreen } from './screens/profile-screen';
import { SavedScreen } from './screens/saved-screen';
import { AuthSessionProvider } from './state/auth-session';
import { ReadingHistoryProvider } from './state/reading-history';
import { ReadingListProvider } from './state/reading-list';
import { colors } from './theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: 'sparkles-outline',
            Explore: 'compass-outline',
            Notifications: 'notifications-outline',
            Saved: 'bookmark-outline',
            Profile: 'person-circle-outline',
          };

          return <Ionicons name={iconMap[route.name as keyof TabParamList]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: '发现' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: '通知' }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ title: '收藏' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export function MobileApp() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <ReadingHistoryProvider>
          <ReadingListProvider>
            <StatusBar style="dark" />
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="Tabs" component={TabsNavigator} />
                <Stack.Screen name="Posts" component={PostsScreen} />
                <Stack.Screen name="PostDetail" component={PostDetailScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </ReadingListProvider>
        </ReadingHistoryProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
