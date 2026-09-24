import Link from "next/link";
import { notFound } from "next/navigation";
import { seedData } from "@/seed/data";

export default function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const exercise = seedData.exercises.find((item) => item.id === params.id);
  if (!exercise) notFound();

  return <div className="page-wrap">
    <Link href="/workouts" className="text-link">← Back to workouts</Link>
    <div className="page-heading exercise-detail-heading">
      <div>
        <div className="eyebrow">{exercise.category} · {exercise.difficulty}</div>
        <h1>{exercise.name}</h1>
        <p>{exercise.muscleGroup} · {exercise.equipment.length ? exercise.equipment.join(", ") : "No equipment"} · {exercise.homeSuitable ? "Home suitable" : "Gym equipment"}</p>
      </div>
      <Link href="/workouts" className="button button-primary">Back to library</Link>
    </div>
    <img className="exercise-detail-image" src={exercise.image} alt={`${exercise.name} exercise`} />
    <div className="stats-grid">
      <div className="app-card stat-card"><small>Sets</small><strong>{exercise.sets}</strong></div>
      <div className="app-card stat-card"><small>Reps</small><strong>{exercise.reps ?? "Timed"}</strong></div>
      <div className="app-card stat-card"><small>Rest</small><strong>{exercise.rest} sec</strong></div>
      <div className="app-card stat-card"><small>Duration</small><strong>{exercise.duration} min</strong></div>
    </div>
    <div className="workout-tag-list exercise-goals">{exercise.goals.map((goal) => <span key={goal}>{goal}</span>)}</div>
    <div className="dashboard-two exercise-detail-grid">
      <section className="app-card"><h2 className="section-title">How to perform</h2><ol className="instruction-list">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol></section>
      <section className="app-card"><h2 className="section-title">Safety</h2><ul className="instruction-list">{exercise.safetyNotes.map((note) => <li key={note}>{note}</li>)}</ul><p className="page-copy exercise-safety-note">Choose a comfortable pace and stop if you experience pain, dizziness, or unusual discomfort.</p></section>
    </div>
  </div>;
}
