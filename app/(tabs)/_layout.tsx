import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackdrop } from '@/components/ui';
import { Colors } from '@/design/tokens';
import { useTheme, useThemedStyles } from '@/design/theme';

export default function TabLayout() { const { colors } = useTheme(); const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.brandText, tabBarInactiveTintColor: colors.faint, tabBarBackground: () => <GlassBackdrop intensity={72} style={styles.tabGlass} />, tabBarStyle: { position: 'absolute', bottom: Math.max(12, insets.bottom + 6), left: 16, right: 16, height: 64, borderRadius: 19, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.glassBorder, borderTopWidth: 1, paddingTop: 5, paddingBottom: 8, boxShadow: `0px 9px 18px ${colors.shadow}`, elevation: 8, overflow: 'hidden' }, tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginBottom: 0 }, tabBarIcon: ({ color, size, focused }) => { const name = route.name === 'index' ? 'sparkles' : route.name === 'create' ? 'add' : route.name === 'friends' ? 'people' : route.name === 'activity' ? 'flash' : 'person'; return <Ionicons name={(focused ? name : `${name}-outline`) as any} size={size - 2} color={color} />; } })}>
    <Tabs.Screen name="index" options={{ title: 'Rooms' }} />
    <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
    <Tabs.Screen name="create" options={{ title: 'Open', tabBarAccessibilityLabel: 'Open a room', tabBarActiveTintColor: colors.brandInk, tabBarInactiveTintColor: colors.brandInk, tabBarItemStyle: { backgroundColor: colors.brand, borderRadius: 14, marginHorizontal: 4, marginVertical: 5 } }} />
    <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarAccessibilityLabel: 'Activity' }} />
    <Tabs.Screen name="you" options={{ title: 'You' }} />
  </Tabs>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({ tabGlass: { borderRadius: 19 } });
