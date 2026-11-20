import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sticker } from '@/design/tokens';
import { useTheme } from '@/design/theme';

export default function TabLayout() { const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.brandText, tabBarInactiveTintColor: colors.faint, tabBarStyle: { position: 'absolute', bottom: Math.max(12, insets.bottom + 6), left: 16, right: 16, height: 70, borderRadius: 20, backgroundColor: colors.surface, borderTopWidth: 2, paddingTop: 5, paddingBottom: 8, elevation: 0, ...sticker(colors) }, tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginBottom: 0 }, tabBarIcon: ({ color, size, focused }) => { const name = route.name === 'index' ? 'home' : route.name === 'create' ? 'add'  : 'people'; return <Ionicons name={(focused ? name : `${name}-outline`) as any} size={size - 2} color={color} />; } })}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="create" options={{ title: 'Open', tabBarAccessibilityLabel: 'Open a room', tabBarActiveTintColor: colors.brandInk, tabBarInactiveTintColor: colors.brandInk, tabBarItemStyle: { backgroundColor: colors.brand, borderRadius: 14, marginHorizontal: 4, marginVertical: 4, borderWidth: 2, borderColor: colors.outline } }} />
    <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
  </Tabs>;
}

