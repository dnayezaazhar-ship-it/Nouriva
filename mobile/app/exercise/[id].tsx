import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton, Button, Card, EmptyState, Screen } from "@/src/components";
import { styles } from "@/src/theme";
import { useApi } from "@/src/hooks";
import type { Data } from "@/src/workout-data";
import { ExerciseImage } from "@/src/workout-ui";
export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const data = useApi<Data>("/api/workouts"); const exercise = data.data?.exercises.find((item) => item.id === id);
  const [completed, setCompleted] = useState(false);
  if (data.loading) return <Screen centered><EmptyState title="Loading exercise..." body="Preparing your exercise details." /></Screen>;
  if (!exercise) return <Screen><BackButton href="/exercise-library" /><EmptyState title="Exercise not found" body="Choose another movement from the library." /></Screen>;
  return <Screen><BackButton href="/exercise-library" /><ExerciseImage uri={exercise.image} style={styles.detailImage} /><Text style={styles.eyebrow}>{exercise.category}</Text><Text style={styles.title}>{exercise.name}</Text><Text style={styles.body}>{exercise.description ?? ""}</Text><Text style={styles.caption}>{exercise.difficulty[0].toUpperCase()}{exercise.difficulty.slice(1)} · {exercise.muscleGroup} · {exercise.equipment.join(", ") || "No equipment"}</Text><Card><View style={styles.detailStats}><View style={styles.detailStat}><Text style={styles.caption}>SETS</Text><Text style={styles.detailStatValue}>{exercise.sets}</Text></View><View style={styles.detailStat}><Text style={styles.caption}>REPS</Text><Text style={styles.detailStatValue}>{exercise.reps ?? `${exercise.duration}s`}</Text></View><View style={styles.detailStat}><Text style={styles.caption}>REST</Text><Text style={styles.detailStatValue}>{exercise.rest} sec</Text></View></View></Card><Card><Text style={styles.sectionTitle}>How to perform</Text>{exercise.instructions.map((instruction, index) => <Text key={instruction} style={styles.body}>{index + 1}. {instruction}</Text>)}</Card><Card><Text style={styles.sectionTitle}>Safety</Text><Text style={styles.body}>{exercise.safetyNotes.join(" ")} Choose a comfortable pace.</Text></Card><Button label={completed ? "Exercise complete" : "Complete exercise"} onPress={() => setCompleted(true)} disabled={completed} /><Link href="/(tabs)/workout" style={styles.action}>Back to workout plan →</Link></Screen>;
}
