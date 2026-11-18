import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/theme';

/**
 * Tab navigator with the default tab bar hidden – our own <FloatingTabBar/> is rendered on top of it,
 * so the bar stays visible on every screen (Home menu, details, forms…).
 * Android Back from any tab returns to the Home menu first.
 */
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        backBehavior="initialRoute"
        tabBar={() => null}
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, sceneStyle: { backgroundColor: colors.bg } }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="learn" />
        <Tabs.Screen name="atlas" />
        <Tabs.Screen name="recognize" />
        <Tabs.Screen name="map" />
        <Tabs.Screen name="harvest" />
        <Tabs.Screen name="forum" />
      </Tabs>
      <FloatingTabBar />
    </View>
  );
}
