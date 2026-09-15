import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors, styles } from "./theme";

export function Screen({ children, centered = false }: { children: ReactNode; centered?: boolean }) { return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, centered && styles.centered]} keyboardShouldPersistTaps="handled">{children}</ScrollView>; }
export function Card({ children }: { children: ReactNode }) { return <View style={styles.card}>{children}</View>; }
export function SectionHeader({ title }: { title: string }) { return <Text style={styles.sectionTitle}>{title}</Text>; }
export function TextField({ label, ...props }: TextInputProps & { label: string }) { return <View><Text style={styles.inputLabel}>{label}</Text><TextInput style={styles.input} placeholderTextColor={colors.muted} {...props} /></View>; }
export function Button({ label, onPress, variant = "primary" }: { label: string; onPress: () => void; variant?: "primary" | "secondary" }) { return <Pressable accessibilityRole="button" style={[styles.button, variant === "secondary" && styles.buttonSecondary]} onPress={onPress}><Text style={[styles.buttonText, variant === "secondary" && styles.buttonSecondaryText]}>{label}</Text></Pressable>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>; }
