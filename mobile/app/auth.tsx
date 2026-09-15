import { Text, View } from "react-native";
import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { router } from "expo-router";
import { Button, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";

export default function AuthScreen() {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verification, setVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setError(""); setBusy(true);
    try {
      if (mode === "signIn") {
        if (!signInLoaded) return;
        const result = await signIn.create({ identifier: email.trim(), password });
        if (result.status === "complete" && result.createdSessionId && setActive) { await setActive({ session: result.createdSessionId }); router.replace("/"); }
        else setError("Additional verification is required in Clerk.");
      } else {
        if (!signUpLoaded) return;
        const result = await signUp.create({ emailAddress: email.trim(), password, firstName: name.trim() || undefined });
        if (result.status === "complete" && result.createdSessionId && setActive) { await setActive({ session: result.createdSessionId }); router.replace("/onboarding"); }
        else { await signUp.prepareEmailAddressVerification({ strategy: "email_code" }); setVerification(true); setError("Check your email for a verification code."); }
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Authentication failed."); }
    finally { setBusy(false); }
  }
  return <Screen centered>
    <Text style={styles.eyebrow}>WELCOME TO NOURIVA</Text>
    <Text style={styles.heroTitle}>Feel good in your everyday.</Text>
    <Text style={styles.body}>Use your Nouriva account. Phone number is optional; email authentication is used here.</Text>
    <View style={styles.card}>
      {mode === "signUp" && <TextField label="Name" placeholder="Your name" value={name} onChangeText={setName} />}
      <TextField label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextField label="Password" placeholder="Your password" secureTextEntry value={password} onChangeText={setPassword} />
      {verification && <TextField label="Email verification code" placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label={busy ? "Please wait..." : verification ? "Verify email" : mode === "signIn" ? "Sign in" : "Create account"} onPress={async () => {
        if (!verification || !signUpLoaded) return submit();
        setBusy(true); setError("");
        try { const result = await signUp.attemptEmailAddressVerification({ code }); if (result.status === "complete" && result.createdSessionId && setActive) { await setActive({ session: result.createdSessionId }); router.replace("/onboarding"); } } catch (err) { setError(err instanceof Error ? err.message : "Verification failed."); } finally { setBusy(false); }
      }} />
      <Button label={mode === "signIn" ? "Create a new account" : "I already have an account"} variant="secondary" onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")} />
    </View>
  </Screen>;
}
