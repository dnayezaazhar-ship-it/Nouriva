import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { ClerkProvider } from "@clerk/expo";
import { colors } from "@/src/theme";
import { tokenCache } from "@/src/auth";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return <><StatusBar style="dark" /><View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, padding: 24 }}>
      <Text style={{ color: colors.ink, textAlign: "center" }}>Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env.local and restart Expo.</Text>
    </View></>;
  }
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  </ClerkProvider>;
}
