import Link from "next/link";
import { notFound } from "next/navigation";
import { seedData } from "@/seed/data";

export default async function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const workout = seedData.workouts.find((item) => item.id === params.id);
  if (!workout) notFound();
  const exercises = workout.exercises.map((item) => seedData.exercises.find((exercise) => exercise.id === item.exerciseId)).filter(Boolean);
  return <div className="page-wrap"><Link href="/workouts" className="text-link">← All workouts</Link><section className="workout-detail-hero"><img src={workout.image} alt="" /><div><div className="eyebrow">{workout.category} · {workout.difficulty}</div><h1>{workout.name}</h1><p>{workout.description}</p><Link className="button button-primary" href={`/workouts/${workout.id}#exercises`}>Start workout</Link></div></section><div className="stats-grid"><div className="app-card stat-card"><small>Duration</small><strong>{workout.duration} min</strong></div><div className="app-card stat-card"><small>Exercises</small><strong>{exercises.length}</strong></div></div><div id="exercises" className="food-grid workout-exercise-grid">{exercises.map((exercise) => exercise && <Link href={`/workouts/exercises/${exercise.id}`} className="app-card food-card exercise-card" key={exercise.id}><img className="exercise-card-image" src={exercise.image} alt={`${exercise.name} exercise`} /><div className="exercise-card-body"><span className="pill">{exercise.difficulty}</span><h3>{exercise.name}</h3><p>{exercise.muscleGroup} · {exercise.sets} sets{exercise.reps ? ` · ${exercise.reps} reps` : ""}</p><p>{exercise.instructions[0]}</p><span className="text-link">View details →</span></div></Link>)}</div></div>;
}
