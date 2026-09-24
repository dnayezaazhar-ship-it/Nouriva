import type { Exercise, Workout, Entitlement, WorkoutProfile } from "@/src/types";

export type WeeklyPlan = { day: string; label: string; workoutId?: string; duration?: number };
export type Data = { exercises: Exercise[]; workouts: Workout[]; weeklyPlan: WeeklyPlan[]; completedDates: string[]; entitlement: Entitlement; profile?: WorkoutProfile };