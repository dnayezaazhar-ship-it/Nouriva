import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/src/theme";
import { styles } from "@/src/theme";
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home-outline", foods: "restaurant-outline", planner: "calendar-outline",
  coach: "sparkles-outline", workout: "barbell-outline", more: "menu-outline",
};

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={colors.green} /><Text style={styles.loadingText}>Loading Nouriva...</Text></View>;
  if (!isSignedIn) return <Redirect href="/auth" />;
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 76, paddingBottom: 8, paddingTop: 6 },
    tabBarLabelStyle: { fontSize: 11 },
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? "ellipse-outline"} color={color} size={size} />,
  })}>
    <Tabs.Screen name="index" options={{ title: "Overview" }} />
    <Tabs.Screen name="foods" options={{ title: "Food library" }} />
    <Tabs.Screen name="planner" options={{ title: "Meal planner" }} />
    <Tabs.Screen name="coach" options={{ title: "AI coach" }} />
    <Tabs.Screen name="workout" options={{ title: "Workout" }} />
    <Tabs.Screen name="more" options={{ title: "Menu" }} />
  </Tabs>;
}
