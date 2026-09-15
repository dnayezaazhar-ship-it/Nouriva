import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { apiRequest } from "@/src/services/api";

export default function Index() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [destination, setDestination] = useState<"/onboarding" | "/(tabs)" | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setDestination(null); return; }
    void getToken().then((token) => apiRequest<{ completedOnboarding?: boolean }>("/api/profile", { token })).then((profile) => setDestination(profile.completedOnboarding ? "/(tabs)" : "/onboarding")).catch(() => setDestination("/onboarding"));
  }, [getToken, isLoaded, isSignedIn]);
  if (!isLoaded || isSignedIn && !destination) return null;
  return <Redirect href={isSignedIn ? destination ?? "/onboarding" : "/auth"} />;
}
