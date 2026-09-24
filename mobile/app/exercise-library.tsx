import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { EmptyState, Screen, TextField } from "@/src/components";
import { styles } from "@/src/theme";
import { useApi } from "@/src/hooks";
import { useMemo, useState } from "react";
import type { Data } from "@/src/workout-data";
import { ExerciseImage } from "@/src/workout-ui";
export default function ExerciseLibrary() {
  const data = useApi<Data>("/api/workouts"); const [query, setQuery] = useState(""); const [filter, setFilter] = useState("All");
  const filters = ["All", "Beginner", "Strength", "Cardio", "Core", "Mobility", "Home", "Gym"];
  const items = useMemo(() => (data.data?.exercises ?? []).filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()) || item.muscleGroup.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || item.difficulty === filter.toLowerCase() || item.category.toLowerCase() === filter.toLowerCase() || (filter === "Home" && item.equipment.length === 0) || (filter === "Gym" && item.equipment.length > 0);
    return matchesQuery && matchesFilter;
  }), [data.data, filter, query]);
  if (data.loading) return <Screen centered><EmptyState title="Loading exercises..." body="Finding your movement library." /></Screen>;
  return <Screen><Text style={styles.eyebrow}>EXERCISE LIBRARY</Text><Text style={styles.title}>Move with confidence.</Text><Text style={styles.body}>Explore clear, approachable exercises for home or gym.</Text><TextField label="Search exercises" placeholder="Try core, mobility, squat..." value={query} onChangeText={setQuery} /><View style={styles.chipRow}>{filters.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipActive]}><Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>{!items.length && <EmptyState title="No exercises found" body="Try another search or filter." />}{items.map((exercise) => <Link key={exercise.id} href={{ pathname: "/exercise/[id]", params: { id: exercise.id } }} style={styles.libraryRow}><ExerciseImage uri={exercise.image} style={styles.libraryImage} /><View style={styles.libraryCopy}><Text style={styles.sectionTitle}>{exercise.name}</Text><Text style={styles.caption}>{exercise.category} · {exercise.muscleGroup} · {exercise.difficulty}</Text><Text style={styles.caption} numberOfLines={2}>{exercise.description}</Text><Text style={styles.caption}>{exercise.sets} sets · {exercise.reps ?? exercise.duration + " sec"} · {exercise.equipment.join(", ") || "No equipment"}</Text></View><Text style={styles.actionText}>›</Text></Link>)}</Screen>;
}
