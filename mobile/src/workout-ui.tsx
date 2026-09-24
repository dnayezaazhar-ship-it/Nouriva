import { useState } from "react";
import { ActivityIndicator, Image, type ImageStyle, Text, View, type StyleProp } from "react-native";
import { colors, styles } from "./theme";

export function ExerciseImage({ uri, style }: { uri?: string; style?: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState(!uri);
  const [loading, setLoading] = useState(Boolean(uri));
  if (failed) return <View style={[styles.exercisePlaceholder, style]}><Text style={{ color: colors.green }}>✦</Text></View>;
  return <View style={[styles.exerciseImageFrame, style]}><Image source={{ uri }} style={styles.exerciseImageFill} resizeMode="cover" onLoadStart={() => setLoading(true)} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />{loading && <View style={styles.exerciseImageLoading}><ActivityIndicator color={colors.green} /></View>}</View>;
}
