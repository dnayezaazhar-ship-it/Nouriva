import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { Redirect } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Button, Screen, TextField } from "@/src/components";
import { colors, styles } from "@/src/theme";

export default function AuthScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const [mode, setMode] = useState<"signIn" | "signUp" | "reset">("signIn");
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [verification, setVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailConflict, setEmailConflict] = useState(false);

  useEffect(() => {
    setError("");
    setEmailConflict(false);
    setVerification(false);
    setCode("");
    setResetStep("email");
    setConfirmPassword("");
  }, []);

  if (!authLoaded) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={colors.green} /><Text style={styles.loadingText}>Connecting to Clerk...</Text></View>;
  if (isSignedIn) return <Redirect href="/" />;

  function getClerkError(error: unknown) {
    if (typeof error !== "object" || error === null) return null;
    const errors = "errors" in error && Array.isArray(error.errors) ? error.errors : [];
    const first = errors[0];
    if (typeof first !== "object" || first === null) return null;
    const code = "code" in first && typeof first.code === "string" ? first.code : "";
    const message = "message" in first && typeof first.message === "string" ? first.message : "";
    return { code, message };
  }

  function isEmailConflict(error: unknown) {
    const clerkError = getClerkError(error);
    return clerkError?.code === "form_identifier_exists" ||
      /email address is taken|email.*already exists|identifier.*already exists/i.test(clerkError?.message ?? "");
  }

  async function continueWithGoogle() {
    setError(""); setBusy(true);
    try {
      const redirectUrl = Linking.createURL("/sso-callback");
      const redirectUrlComplete = Linking.createURL("/");
      if (mode === "signIn") {
        if (!signInLoaded) return;
        await signIn.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl, redirectUrlComplete, continueSignIn: true });
      } else {
        if (!signUpLoaded) return;
        await signUp.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl, redirectUrlComplete, continueSignUp: true });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Google authentication failed."); }
    finally { setBusy(false); }
  }
  async function submit() {
    setError(""); setBusy(true);
    try {
      if (mode === "reset") {
        if (!signInLoaded) return;
        if (resetStep === "email") {
          await signIn.create({ identifier: email.trim() });
          const resetFactor = signIn.supportedFirstFactors?.find((factor) => factor.strategy === "reset_password_email_code");
          if (!resetFactor || !("emailAddressId" in resetFactor)) {
            setError("Password reset is not available for this account.");
            return;
          }
          await signIn.prepareFirstFactor({ strategy: "reset_password_email_code", emailAddressId: resetFactor.emailAddressId });
          setResetStep("code");
          setError("Check your email for a verification code.");
        } else if (resetStep === "code") {
          const result = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code });
          if (result.status === "needs_new_password") setResetStep("password");
          else setError("That code could not be verified. Please try again.");
        } else {
          if (password.length < 8) { setError("Your new password must be at least 8 characters."); return; }
          if (password !== confirmPassword) { setError("Passwords do not match."); return; }
          const result = await signIn.resetPassword({ password });
          if (result.status === "complete" && result.createdSessionId && setActive) {
            await setActive({ session: result.createdSessionId });
            router.replace("/");
          } else setError("Your password could not be updated. Please try again.");
        }
        return;
      }
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
    } catch (err) {
      if (mode === "signUp" && isEmailConflict(err)) {
        setEmailConflict(true);
        setError("That email address is already registered. Sign in to continue.");
      } else {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      }
    }
    finally { setBusy(false); }
  }
  return <Screen contentStyle={{ paddingTop: 22 }}>
    <View style={styles.authHeader}>
      <View style={styles.authBrand}><View style={styles.authMark}><Text style={styles.authMarkText}>N</Text></View><Text style={styles.authBrandText}>nouriva</Text></View>
      <Text style={styles.authNav}>Nutrition that fits your life</Text>
    </View>
    <View style={styles.authHero}>
      <View style={styles.authOrb} />
      <Text style={styles.eyebrow}>✦ NUTRITION THAT FITS YOUR LIFE</Text>
      <Text style={styles.heroTitle}>Feel good in your <Text style={{ color: colors.coral, fontStyle: "italic" }}>everyday.</Text></Text>
      <Text style={styles.body}>Small, sustainable choices for meals, movement, and a nourishing rhythm—without the noise.</Text>
      <View style={styles.authPreview}>
        <Text style={styles.authPreviewHeader}>Tuesday · On track</Text>
        <Text style={styles.authPreviewTitle}>Your nourishment today</Text>
        <View style={styles.authRing}><Svg width="110" height="110" viewBox="0 0 110 110" style={styles.authRingSvg}><Circle cx="55" cy="55" r="43" fill="none" stroke={colors.line} strokeWidth="12" /><Circle cx="55" cy="55" r="43" fill="none" stroke={colors.green} strokeWidth="12" strokeLinecap="round" strokeDasharray="270.18" strokeDashoffset="75.65" transform="rotate(-90 55 55)" /></Svg><Text style={styles.authRingNumber}>72</Text><Text style={styles.authRingLabel}>% balanced</Text></View>
        <Text style={styles.caption}>Protein 86g / 110g   ·   Fiber 19g / 28g   ·   Water 5 / 8 cups</Text>
      </View>
    </View>
    <View style={[styles.card, styles.authSignInCard]}>
      <Text style={styles.sectionTitle}>{mode === "reset" ? "Reset your password." : mode === "signIn" ? "Welcome back." : "Start your Nouriva journey."}</Text>
      <Text style={styles.authMode}>{mode === "reset" ? resetStep === "email" ? "Enter your email to receive a verification code." : resetStep === "code" ? "Enter the code we sent you." : "Choose a new password for your account." : mode === "signIn" ? "Sign in to continue your rhythm." : "Create an account to make the plan yours."}</Text>
      <View style={styles.authFormInset}>
      {mode === "signUp" && <TextField label="Name" placeholder="Your name" value={name} onChangeText={setName} style={styles.authInput} />}
      {(mode !== "reset" || resetStep === "email") && <TextField label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={(value) => { setEmail(value); setError(""); setEmailConflict(false); }} style={styles.authInput} />}
      {mode === "reset" && resetStep === "code" && <TextField label="Verification code" placeholder="123456" value={code} onChangeText={(value) => { setCode(value); setError(""); }} keyboardType="number-pad" style={styles.authInput} />}
      {mode !== "reset" && <TextField label="Password" placeholder="Your password" secureTextEntry value={password} onChangeText={setPassword} style={styles.authInput} />}
      {mode === "reset" && resetStep === "password" && <><TextField label="New password" placeholder="At least 8 characters" secureTextEntry value={password} onChangeText={(value) => { setPassword(value); setError(""); }} style={styles.authInput} /><TextField label="Confirm new password" placeholder="Repeat your new password" secureTextEntry value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(""); }} style={styles.authInput} /></>}
      {verification && <TextField label="Email verification code" placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" style={styles.authInput} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {mode === "reset" ? <Button label={resetStep === "email" ? "Send verification code" : resetStep === "code" ? "Verify code" : "Set new password"} onPress={submit} /> : <Button label={busy ? "Please wait..." : verification ? "Verify email" : mode === "signIn" ? "Sign in" : "Create account"} onPress={async () => {
        if (!verification || !signUpLoaded) return submit();
        setBusy(true); setError("");
        try { const result = await signUp.attemptEmailAddressVerification({ code }); if (result.status === "complete" && result.createdSessionId && setActive) { await setActive({ session: result.createdSessionId }); router.replace("/onboarding"); } } catch (err) { setError(err instanceof Error ? err.message : "Verification failed."); } finally { setBusy(false); }
      }} />}
      {mode === "signIn" && <Pressable onPress={() => { setMode("reset"); setResetStep("email"); setError(""); setPassword(""); setConfirmPassword(""); }}><Text style={styles.link}>Forgot password?</Text></Pressable>}
      {mode !== "reset" && <Button label="Continue with Google" variant="secondary" onPress={continueWithGoogle} />}
      <Button label={mode === "reset" ? "Back to Sign in" : mode === "signIn" ? "Create a new account" : "I already have an account / Sign in"} variant="secondary" onPress={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(""); setEmailConflict(false); setVerification(false); }} />
      {mode === "signUp" && emailConflict && <Text style={styles.authConflictHint}>Use the Sign in option above if this is your account.</Text>}
      </View>
    </View>
    <Pressable onPress={() => router.replace("/")}><Text style={[styles.authNav, { alignSelf: "center", marginTop: 4 }]}>Gentle guidance for everyday wellbeing</Text></Pressable>
  </Screen>;
}
