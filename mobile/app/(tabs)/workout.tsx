import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Card, EmptyState, Screen } from "@/src/components";
import { colors, styles } from "@/src/theme";
import { useApi } from "@/src/hooks";
import { ExerciseImage } from "@/src/workout-ui";
import type { Data } from "@/src/workout-data";
import type { Exercise } from "@/src/types";
const librarySections = ["Fat Burn & Cardio", "Legs Exercises", "Back Exercises", "Chest Exercises", "Weight Loss / Weight Gain routines"] as const;
const exerciseCardGoals = (exercise: Exercise): string[] => {
  const badges: string[] = [];
  if (exercise.goals.includes("Weight Loss")) badges.push("Weight Loss");
  if (exercise.goals.includes("Fat Burn")) badges.push("Fat Burn");
  if (exercise.goals.includes("Muscle Gain")) badges.push("Muscle Gain");
  if (exercise.goals.includes("Full Body")) badges.push("Full Body");
  if (exercise.noEquipment && exercise.goals.includes("Muscle Gain")) badges.push("Home Workout");
  else if (exercise.goals.includes("Muscle Gain") && exercise.goals.includes("Upper Body")) badges.push("Upper Body");
  else if (exercise.goals.includes("Muscle Gain") && exercise.goals.includes("Lower Body")) badges.push("Lower Body");
  return badges.slice(0, 3);
};

export default function WorkoutHome() {
  const data = useApi<Data>("/api/workouts");
  const [query, setQuery] = useState("");
  const exercises = data.data?.exercises ?? [];
  const filteredExercises = useMemo(
    () => exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.trim().toLowerCase())),
    [exercises, query],
  );

  if (data.loading) return <Screen centered><EmptyState title="Preparing your movement plan..." body="Finding workouts that fit your Nouriva profile." /></Screen>;
  if (data.error) return <Screen><EmptyState title="Your movement plan is unavailable" body={data.error} /><Pressable accessibilityRole="button" style={styles.button} onPress={() => void data.refresh()}><Text style={styles.buttonText}>Try again</Text></Pressable></Screen>;

  const workouts = data.data?.workouts ?? [];
  const featured = workouts[0];
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  const todayCompleted = data.data?.completedDates.includes(new Date().toISOString().slice(0, 10)) ?? false;
  const workoutsById = new Map(workouts.map((workout) => [workout.id, workout]));

  return <Screen>
    {featured && <Card style={styles.todayWorkout}>
      <ExerciseImage uri={featured.image} style={styles.heroWorkoutImage} />
      <Text style={styles.eyebrow}>FEATURED WORKOUT</Text>
      <Text style={styles.pill}>{featured.difficulty}</Text>
      <Text style={styles.sectionTitle}>{featured.name}</Text>
      <Text style={styles.body}>{featured.description}</Text>
      <View style={styles.workoutMeta}>
        <Text style={styles.caption}>{featured.duration} min</Text>
        <Text style={styles.caption}>{featured.exercises.length} exercises</Text>
        <Text style={styles.caption}>{featured.category}</Text>
      </View>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push({ pathname: "/workout/[id]", params: { id: featured.id } })}>
        <Text style={styles.buttonText}>View workout →</Text>
      </Pressable>
    </Card>}

    <Text style={styles.eyebrow}>MOVE IN A WAY THAT FEELS SUPPORTIVE</Text>
    <Text style={styles.title}>Your workouts.</Text>
    <Text style={styles.body}>Choose a routine, explore an exercise, and go at a comfortable pace.</Text>

    <Text style={styles.sectionTitle}>This week</Text>
    {(data.data?.weeklyPlan ?? []).map((day) => {
      const workout = day.workoutId ? workoutsById.get(day.workoutId) : undefined;
      const isToday = day.day === today;
      const status = isToday && todayCompleted ? "Completed" : workout ? "Planned" : "Rest day";
      return <Pressable
        key={day.day}
        accessibilityRole={workout ? "button" : undefined}
        disabled={!workout}
        onPress={() => workout && router.push({ pathname: "/workout/[id]", params: { id: workout.id } })}
      >
        <Card style={[styles.workoutRow, isToday && styles.workoutRowToday]}>
          <ExerciseImage uri={workout?.image} style={styles.workoutRowImage} />
          <View style={styles.workoutRowText}>
            <Text style={styles.caption}>{day.day.toUpperCase()}{isToday ? " · TODAY" : ""}</Text>
            <Text style={styles.workoutRowTitle} numberOfLines={2}>{workout?.name ?? day.label}</Text>
            <Text style={styles.workoutRowMeta} numberOfLines={2}>{workout ? `${workout.duration} min · ${workout.difficulty} · ${status}` : `Rest and recovery · ${status}`}</Text>
          </View>
          <Text style={styles.workoutCheck}>{isToday && todayCompleted ? "✓" : workout ? "○" : "–"}</Text>
        </Card>
      </Pressable>;
    })}

    <View style={styles.libraryHeader}>
      <View style={styles.libraryHeading}>
        <Text style={styles.sectionTitle}>Exercise library</Text>
        <Text style={styles.body}>Explore movements for strength, cardio, mobility, and core.</Text>
      </View>
      <TextInput
        accessibilityLabel="Search exercises"
        placeholder="Search exercises"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />
    </View>
    {librarySections.map((section) => {
      const sectionExercises = filteredExercises.filter((exercise) => exercise.librarySection === section);
      if (!sectionExercises.length) return null;
      return <View key={section} style={styles.exerciseLibrarySection}><Text style={styles.exerciseLibraryHeading}>{section}</Text><View style={styles.exerciseGrid}>
      {sectionExercises.map((exercise) => <Pressable
        key={exercise.id}
        accessibilityRole="button"
        style={styles.exerciseCard}
        onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } })}
      >
        <ExerciseImage uri={exercise.image} style={styles.exerciseImage} />
        <View style={styles.exerciseCardContent}>
          <Text style={styles.pill}>{exercise.difficulty}</Text>
          <Text style={styles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
          <Text style={styles.exerciseMuscles} numberOfLines={2}>{exercise.muscleGroup}</Text>
          <Text style={styles.exerciseMeta} numberOfLines={2}>{exercise.duration} min · {exercise.sets} sets{exercise.reps ? ` · ${exercise.reps} reps` : ""}</Text>
          <View style={styles.exerciseGoalBadges}>{exerciseCardGoals(exercise).map((goal) => <Text style={styles.exerciseGoalBadge} key={goal}>{goal}</Text>)}</View>
          <Text style={styles.exerciseDetails}>View details →</Text>
        </View>
      </Pressable>)}
    </View></View>;
    })}
    {filteredExercises.length === 0 && <EmptyState title="No matching exercises" body="Try a different search." />}
  </Screen>;
}
