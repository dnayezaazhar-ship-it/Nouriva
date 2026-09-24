"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Exercise, Workout } from "@/types";
import { exerciseCardGoals } from "@/seed/data";

type WorkoutResponse = {
  exercises: Exercise[];
  workouts: Workout[];
  workoutCategories: string[];
  weeklyPlan: Array<{ day: string; label: string; workoutId?: string }>;
  completedDates: string[];
};
const librarySections = ["Fat Burn & Cardio", "Legs Exercises", "Back Exercises", "Chest Exercises", "Weight Loss / Weight Gain routines"] as const;

export default function WorkoutsPage() {
  const [data, setData] = useState<WorkoutResponse | null>(null);
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function loadWorkouts() {
    setLoading(true);
    setError("");
    fetch("/api/workouts")
      .then(async (response) => {
        const body = await response.json() as WorkoutResponse & { message?: string };
        if (!response.ok) throw new Error(body.message ?? "Unable to load workouts.");
        setData(body);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load workouts."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadWorkouts(); }, []);

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  const featured = data?.workouts[0];
  const filterOptions = useMemo(() => {
    const allExercises = data?.exercises ?? [];
    return {
      difficulties: ["beginner", "intermediate", "advanced"],
      muscleGroups: Array.from(new Set(allExercises.flatMap((exercise) => exercise.muscleGroup.split(", ")))).sort(),
      equipment: Array.from(new Set(allExercises.flatMap((exercise) => exercise.equipment))).sort(),
    };
  }, [data]);
  const exercises = useMemo(() => data?.exercises.filter((exercise) => {
    const matchesQuery = exercise.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesGoal = !goal || exercise.goals.includes(goal);
    const matchesDifficulty = !difficulty || exercise.difficulty === difficulty;
    const matchesMuscle = !muscleGroup || exercise.muscleGroup.split(", ").includes(muscleGroup);
    const matchesEquipment = !equipment || (equipment === "No Equipment" ? exercise.noEquipment : exercise.equipment.includes(equipment));
    return matchesQuery && matchesGoal && matchesDifficulty && matchesMuscle && matchesEquipment;
  }) ?? [], [data, difficulty, equipment, goal, muscleGroup, query]);
  const groupedExercises = useMemo(() => librarySections.map((section) => ({
    section,
    exercises: exercises.filter((exercise) => exercise.librarySection === section),
  })).filter((group) => group.exercises.length), [exercises]);

  return <div className="page-wrap">
    {error && <div className="error-box" role="alert"><span>{error}</span><button className="button button-ghost" type="button" onClick={loadWorkouts} disabled={loading}>{loading ? "Retrying…" : "Try again"}</button></div>}
    {!data && loading ? <div className="app-card loading-state">Loading your workouts…</div> : !data ? null : <>
      {featured && <section className="app-card workout-hero">
        {featured.image && <img className="workout-hero-image" src={featured.image} alt={`${featured.name} featured workout`} />}
        <div className="workout-hero-content">
          <div className="eyebrow">Featured workout</div>
          <span className="pill">{featured.difficulty}</span>
          <h2 className="section-title">{featured.name}</h2>
          <p className="page-copy">{featured.description}</p>
          <div className="workout-hero-footer"><span>{featured.duration} min · {featured.exercises.length} exercises · {featured.category}</span><Link href={`/workouts/${featured.id}`} className="button button-primary">View workout →</Link></div>
        </div>
      </section>}
      <div className="page-heading"><div><div className="eyebrow">Move in a way that feels supportive</div><h1>Your workouts.</h1><p>Choose a routine, explore an exercise, and go at a comfortable pace.</p></div><Link href={featured ? `/workouts/${featured.id}` : "/workouts"} className="button button-primary">Start a workout</Link></div>
      <section className="app-card"><h2 className="section-title">This week</h2><div className="workout-week">{data.weeklyPlan.map((day) => { const planWorkout = day.workoutId ? data.workouts.find((workout) => workout.id === day.workoutId) : undefined; return <div className={`workout-day ${day.day === today ? "current" : ""}`} key={day.day}>{planWorkout?.image && <img className="workout-day-image" src={planWorkout.image} alt="" />}<b>{day.day}</b><span>{day.label}</span>{day.workoutId ? <Link href={`/workouts/${day.workoutId}`}>View plan →</Link> : <small>Recovery day</small>}</div>; })}</div></section>
      <section><div className="page-heading"><div><h2 className="section-title">Exercise library</h2><p className="page-copy">Browse complete movement plans by goal, difficulty, muscle group, or equipment.</p></div><input className="input" aria-label="Search exercises" placeholder="Search exercises" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="workout-goal-list" aria-label="Workout goals">{["Weight Loss", "Fat Burn", "Muscle Gain", "Strength", "Full Body", "Home Workout"].map((item) => <button className={`goal-chip ${goal === item ? "active" : ""}`} type="button" key={item} onClick={() => setGoal(goal === item ? "" : item)}>{item}</button>)}</div>
        <div className="workout-filters">
          <label>Goal<select className="select" value={goal} onChange={(event) => setGoal(event.target.value)}><option value="">All goals</option>{data.workoutCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Difficulty<select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">All levels</option>{filterOptions.difficulties.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>
          <label>Muscle group<select className="select" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)}><option value="">All muscles</option>{filterOptions.muscleGroups.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Equipment<select className="select" value={equipment} onChange={(event) => setEquipment(event.target.value)}><option value="">Any equipment</option><option value="No Equipment">No equipment</option>{filterOptions.equipment.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        {groupedExercises.map((group) => <div className="exercise-library-section" key={group.section}><h3 className="exercise-library-heading">{group.section}</h3><div className="food-grid">{group.exercises.map((exercise) => <Link className="app-card food-card exercise-card" href={`/workouts/exercises/${exercise.id}`} key={exercise.id}>
          {exercise.image && <img className="exercise-card-image" src={exercise.image} alt={`${exercise.name} exercise`} />}
          <div className="exercise-card-body">
            <span className="pill">{exercise.difficulty}</span>
            <h3>{exercise.name}</h3>
            <p className="exercise-card-muscles">{exercise.muscleGroup}</p>
            <div className="exercise-card-stats"><span>{exercise.duration} min</span><span>{exercise.sets} sets{exercise.reps ? ` · ${exercise.reps} reps` : ""}</span></div>
            <div className="workout-tag-list">{exerciseCardGoals(exercise).map((item) => <span key={item}>{item}</span>)}</div>
            <span className="text-link">View details →</span>
          </div>
        </Link>)}</div></div>)}{exercises.length === 0 && <div className="empty-state"><strong>No matching exercises</strong><span>Try a different filter combination.</span></div>}</section>
    </>}
  </div>;
}
