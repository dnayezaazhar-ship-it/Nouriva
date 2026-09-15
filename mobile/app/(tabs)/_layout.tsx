import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme";
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home-outline", foods: "restaurant-outline", planner: "calendar-outline",
  coach: "sparkles-outline", progress: "trending-up-outline",
};

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth" />;
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 76, paddingBottom: 8, paddingTop: 6 },
    tabBarLabelStyle: { fontSize: 11 },
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? "ellipse-outline"} color={color} size={size} />,
  })}>
    <Tabs.Screen name="index" options={{ title: "Home" }} />
    <Tabs.Screen name="foods" options={{ title: "Foods" }} />
    <Tabs.Screen name="planner" options={{ title: "Planner" }} />
    <Tabs.Screen name="coach" options={{ title: "Coach" }} />
    <Tabs.Screen name="progress" options={{ title: "Progress" }} />
    <Tabs.Screen name="more" options={{ href: null }} />
  </Tabs>;
}
