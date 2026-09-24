import type {
  Food,
  GroceryItem,
  MealTemplate,
  NutritionGoal,
  Recipe,
  RecipeIngredient,
  SeedData,
  Exercise,
  Workout,
} from "./types";

export const seedId = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export const foodId = (name: string): string => `food_${seedId(name)}`;
export const recipeId = (name: string): string => `recipe_${seedId(name)}`;

const exerciseImages: Record<string, string> = {
  "Burpees": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85",
  "Squats": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85",
  "Push-ups": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=85",
  "Mountain Climbers": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=85",
  "Kettlebell Swings": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
  "Deadlifts": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85",
  "Pull-ups": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
  "Jump Squats": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  "Bulgarian Split Squats": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85",
  "Walking Lunges": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85",
};
const categoryImages: Record<string, string> = {
  "Full Body": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1600&q=85",
  Strength: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85",
  Cardio: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=85",
  "Upper Body": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1600&q=85",
};
const workoutImages: Record<string, string> = {
  "Full Body Foundation": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1600&q=85",
  "Home Strength & Stability": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85",
  "Movement Reset": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=85",
  "Cardio & Core Flow": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=85",
  "Upper Body Gym": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1600&q=85",
  "Fat Burn Circuit": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1600&q=85",
  "Muscle Gain Strength": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1600&q=85",
};
const exerciseImage = (name: string, category: string) =>
  exerciseImages[name] ?? categoryImages[category] ?? categoryImages["Full Body"];
const workoutImage = (name: string, category: string) => {
  return workoutImages[name] ?? categoryImages[category] ?? categoryImages["Full Body"];
};
const exerciseRows: Array<[string, string, string, Exercise["difficulty"], string[], number, number, number | undefined, string[]]> = [
  ["Bodyweight Squat", "Full Body", "legs", "beginner", [], 8, 3, 12, ["Stand with feet hip-width apart.", "Lower hips while keeping your chest lifted.", "Drive through your feet to stand."]],
  ["Glute Bridge", "Lower Body", "glutes", "beginner", [], 6, 3, 15, ["Lie on your back with knees bent.", "Squeeze glutes and lift hips.", "Lower with control."]],
  ["Reverse Lunge", "Lower Body", "legs", "beginner", [], 8, 3, 10, ["Step one foot back.", "Lower both knees with control.", "Push through the front foot."]],
  ["Push-up", "Upper Body", "chest", "intermediate", [], 8, 3, 10, ["Brace your core in a straight line.", "Lower your chest toward the floor.", "Press away without locking your elbows."]],
  ["Wall Push-up", "Beginner", "chest", "beginner", [], 6, 3, 12, ["Place hands on a wall.", "Bend elbows to bring chest closer.", "Press back to the start."]],
  ["Plank", "Core", "core", "beginner", [], 5, 3, undefined, ["Hold a straight line from shoulders to heels.", "Brace your abdomen.", "Breathe steadily."]],
  ["Side Plank", "Core", "obliques", "intermediate", [], 5, 3, undefined, ["Stack shoulders over elbow.", "Lift hips into a straight line.", "Hold while breathing calmly."]],
  ["Mountain Climbers", "Cardio", "core", "intermediate", [], 8, 3, 20, ["Start in a high plank.", "Drive knees toward your chest alternately.", "Keep hips level."]],
  ["Bird Dog", "Mobility", "core", "beginner", [], 6, 3, 10, ["Start on hands and knees.", "Extend opposite arm and leg.", "Return slowly and switch sides."]],
  ["Dead Bug", "Core", "core", "beginner", [], 6, 3, 10, ["Lie on your back with arms up.", "Lower opposite arm and leg.", "Keep your lower back gently grounded."]],
  ["Jumping Jacks", "Cardio", "full body", "beginner", [], 6, 3, 30, ["Stand tall with arms by your sides.", "Jump feet out as arms lift.", "Return softly."]],
  ["High Knees", "Cardio", "legs", "beginner", [], 6, 3, 30, ["Stand tall.", "March or jog while lifting knees.", "Land softly and stay controlled."]],
  ["Shoulder Taps", "Core", "shoulders", "beginner", [], 6, 3, 16, ["Start in a stable plank.", "Tap opposite shoulder.", "Minimize hip movement."]],
  ["Forward Lunge", "Lower Body", "legs", "beginner", [], 8, 3, 10, ["Step forward.", "Lower until both knees bend comfortably.", "Return to standing."]],
  ["Calf Raises", "Lower Body", "calves", "beginner", [], 5, 3, 15, ["Stand tall near support.", "Rise onto the balls of your feet.", "Lower slowly."]],
  ["Hip Bridge", "Lower Body", "glutes", "beginner", [], 6, 3, 12, ["Brace your core.", "Lift hips and squeeze glutes.", "Pause before lowering."]],
  ["Arm Circles", "Mobility", "shoulders", "beginner", [], 4, 2, 20, ["Stand relaxed.", "Make small circles with both arms.", "Gradually widen the circles."]],
  ["Cat Cow", "Mobility", "spine", "beginner", [], 5, 2, 10, ["Start on hands and knees.", "Alternate rounding and extending your spine.", "Move with your breath."]],
  ["Child's Pose", "Mobility", "full body", "beginner", [], 5, 2, undefined, ["Sit hips toward heels.", "Reach arms forward.", "Breathe into your back."]],
  ["Step-ups", "Lower Body", "legs", "beginner", ["step"], 8, 3, 10, ["Place one foot on a stable step.", "Drive through that foot.", "Step down carefully."]],
  ["Resistance Band Row", "Upper Body", "back", "beginner", ["resistance band"], 8, 3, 12, ["Anchor the band safely.", "Pull elbows back.", "Return with control."]],
  ["Dumbbell Shoulder Press", "Strength", "shoulders", "intermediate", ["dumbbells"], 8, 3, 10, ["Hold weights at shoulder height.", "Press overhead.", "Lower without shrugging."]],
  ["Dumbbell Deadlift", "Strength", "posterior chain", "intermediate", ["dumbbells"], 10, 3, 10, ["Hinge at the hips.", "Keep weights close.", "Stand by driving hips forward."]],
  ["Goblet Squat", "Strength", "legs", "intermediate", ["dumbbell"], 10, 3, 10, ["Hold weight at your chest.", "Squat with knees tracking toes.", "Stand tall."]],
  ["Dumbbell Chest Press", "Strength", "chest", "intermediate", ["dumbbells", "bench"], 10, 3, 10, ["Lie supported on a bench.", "Lower weights beside chest.", "Press upward."]],
  ["Bicycle Crunch", "Core", "abdominals", "intermediate", [], 6, 3, 20, ["Lie on your back.", "Rotate opposite elbow toward knee.", "Move slowly and keep neck relaxed."]],
  ["Russian Twist", "Core", "obliques", "intermediate", [], 6, 3, 20, ["Sit with knees bent.", "Rotate your torso side to side.", "Keep movement controlled."]],
  ["Bear Crawl", "Full Body", "full body", "intermediate", [], 8, 3, 20, ["Start on hands and feet with knees hovering.", "Move opposite hand and foot.", "Keep your back steady."]],
  ["Burpee", "Cardio", "full body", "advanced", [], 10, 3, 8, ["Squat and place hands down.", "Step or jump to plank.", "Return and stand tall."]],
  ["Skater Steps", "Cardio", "legs", "beginner", [], 6, 3, 20, ["Step side to side.", "Reach opposite hand toward the floor.", "Stay light on your feet."]],
  ["Standing Knee Drive", "Cardio", "core", "beginner", [], 5, 3, 20, ["Stand tall.", "Drive one knee up with opposite arm.", "Alternate smoothly."]],
  ["Marching in Place", "Beginner", "full body", "beginner", [], 5, 3, 30, ["Stand tall with relaxed shoulders.", "March while lifting each knee comfortably.", "Keep a steady, easy rhythm."]],
  ["Standing Knee Raises", "Core", "core", "beginner", [], 5, 3, 16, ["Stand tall near support if needed.", "Lift one knee toward your waist.", "Lower with control and alternate."]],
  ["Donkey Kicks", "Lower Body", "glutes", "beginner", [], 6, 3, 12, ["Start on hands and knees.", "Press one foot upward without arching your back.", "Return slowly and switch sides."]],
  ["Fire Hydrants", "Lower Body", "glutes", "beginner", [], 6, 3, 12, ["Start on hands and knees.", "Lift one knee out to the side.", "Keep your pelvis steady and switch sides."]],
  ["Superman", "Strength", "back", "beginner", [], 6, 3, 10, ["Lie face down with arms extended.", "Lift arms and legs gently.", "Lower slowly without straining your neck."]],
  ["Incline Push-up", "Upper Body", "chest", "beginner", ["bench or countertop"], 6, 3, 10, ["Place hands on a stable elevated surface.", "Lower your chest toward it.", "Press away while keeping your body aligned."]],
  ["Bodyweight Good Morning", "Mobility", "posterior chain", "beginner", [], 6, 3, 12, ["Stand with feet hip-width apart.", "Hinge at the hips with a long spine.", "Squeeze glutes to return upright."]],
  ["Wall Sit", "Lower Body", "legs", "beginner", ["wall"], 5, 3, undefined, ["Slide your back down a wall.", "Keep knees comfortable and aligned.", "Hold while breathing steadily."]],
  ["Glute Kickback", "Lower Body", "glutes", "beginner", [], 6, 3, 12, ["Stand tall or hold support.", "Extend one leg behind you.", "Squeeze the glute and return with control."]],
  ["Standing Side Leg Raise", "Mobility", "hips", "beginner", [], 5, 3, 12, ["Stand tall near support.", "Lift one leg to the side without leaning.", "Lower slowly and switch sides."]],
  ["Deadlifts", "Strength", "back, hamstrings, glutes", "intermediate", ["barbell"], 10, 4, 8, ["Stand with the bar over your midfoot.", "Hinge at the hips and keep your spine neutral.", "Drive through the floor and stand tall."]],
  ["Pull-ups", "Upper Body", "back, biceps", "advanced", ["pull-up bar"], 8, 4, 8, ["Grip the bar slightly wider than your shoulders.", "Brace your core and pull your chest toward the bar.", "Lower with control until your arms are extended."]],
  ["Jump Squats", "Legs", "legs, glutes", "intermediate", [], 8, 4, 12, ["Stand with feet just outside hip width.", "Lower into a controlled squat.", "Drive through your feet to jump, then land softly."]],
  ["Bulgarian Split Squats", "Legs", "legs, glutes", "advanced", ["bench"], 10, 3, 10, ["Place your rear foot on a stable bench.", "Lower your hips while keeping the front knee aligned.", "Drive through the front foot to stand."]],
  ["Romanian Deadlifts", "Strength", "hamstrings, glutes", "intermediate", ["dumbbells"], 10, 4, 10, ["Hold weights close to your thighs.", "Hinge at the hips with a long spine.", "Drive your hips forward to stand tall."]],
  ["Renegade Rows", "Upper Body", "back, core", "advanced", ["dumbbells"], 10, 3, 8, ["Start in a strong plank holding dumbbells.", "Row one weight toward your ribs without rotating.", "Lower with control and alternate sides."]],
  ["Kettlebell Swings", "Cardio", "full body, glutes", "intermediate", ["kettlebell"], 8, 4, 15, ["Hike the kettlebell between your legs.", "Snap your hips forward to swing it to chest height.", "Let the bell fall back while keeping your spine neutral."]],
  ["Walking Lunges", "Strength", "legs, glutes", "intermediate", [], 10, 3, 12, ["Stand tall with feet hip-width apart.", "Step forward and lower both knees with control.", "Push through the front foot and continue walking."]],
];
const highDemandExerciseNames = new Set(["Burpee", "Bodyweight Squat", "Deadlifts", "Pull-ups", "Push-up", "Mountain Climbers", "Jump Squats", "Bulgarian Split Squats", "Kettlebell Swings", "Walking Lunges"]);
const librarySectionFor = (name: string): Exercise["librarySection"] => {
  if (["Mountain Climbers", "Burpee", "Kettlebell Swings"].includes(name)) return "Fat Burn & Cardio";
  if (["Bodyweight Squat", "Bulgarian Split Squats", "Walking Lunges"].includes(name)) return "Legs Exercises";
  if (["Deadlifts", "Pull-ups"].includes(name)) return "Back Exercises";
  if (name === "Push-up") return "Chest Exercises";
  if (name === "Jump Squats") return "Weight Loss / Weight Gain routines";
  return "Weight Loss / Weight Gain routines";
};
export const workoutCategories = ["Weight Loss", "Fat Burn", "Muscle Gain", "Strength", "Full Body", "Beginner", "Intermediate", "Advanced", "Home Workout", "No Equipment", "Core & Abs", "Lower Body", "Upper Body", "Cardio", "Mobility & Stretching"];
export const exerciseCardGoals = (exercise: Exercise): string[] => {
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
const exerciseOverrides: Record<string, { name?: string; category: string; muscleGroup: string; tags: string[]; equipment?: string[]; description: string }> = {
  Burpee: { name: "Burpees", category: "Full Body", muscleGroup: "full body", tags: ["fat burn", "weight loss", "cardio"], description: "A full-body power movement that elevates the heart rate and builds conditioning." },
  "Bodyweight Squat": { name: "Squats", category: "Lower Body", muscleGroup: "legs, glutes", tags: ["muscle building", "strength", "weight gain"], description: "A foundational lower-body movement for building leg strength, balance, and muscle." },
  Deadlifts: { category: "Strength", muscleGroup: "back, hamstrings, glutes", tags: ["muscle building", "strength", "weight gain"], description: "A compound hip-hinge movement that develops posterior-chain strength and muscle." },
  "Pull-ups": { category: "Upper Body", muscleGroup: "back, biceps", tags: ["muscle building", "strength", "upper body"], description: "A demanding bodyweight pull that builds back, arm, and grip strength." },
  "Mountain Climbers": { category: "Core", muscleGroup: "core", tags: ["cardio", "fat burn", "weight loss"], description: "A fast-paced core and cardio movement for building work capacity." },
  "Dumbbell Shoulder Press": { category: "Upper Body", muscleGroup: "shoulders", tags: ["upper body", "muscle building", "strength"], description: "A controlled pressing movement for shoulder strength and upper-body development." },
  "Push-up": { name: "Push-ups", category: "Upper Body", muscleGroup: "chest, triceps", tags: ["upper body", "muscle building", "strength"], description: "A foundational upper-body press that trains the chest, triceps, and core." },
  "Jump Squats": { category: "Legs", muscleGroup: "legs, glutes", tags: ["fat burn", "weight loss", "lower body"], description: "An explosive lower-body squat variation that builds power and raises the heart rate." },
  "Bulgarian Split Squats": { category: "Legs", muscleGroup: "legs, glutes", tags: ["muscle building", "strength", "lower body"], description: "A unilateral strength movement that challenges leg stability and glute power." },
  "Kettlebell Swings": { category: "Cardio", muscleGroup: "full body, glutes", tags: ["fat burn", "cardio", "weight loss"], description: "A rhythmic hip-power movement for full-body conditioning and glute strength." },
  "Walking Lunges": { category: "Strength", muscleGroup: "legs, glutes", tags: ["strength", "fat burn", "lower body"], description: "A traveling lunge pattern that builds lower-body strength, balance, and stamina." },
};
const titleCase = (value: string) => value.replace(/\b\w/g, (character) => character.toUpperCase());
const goalsForExercise = (category: string, muscleGroup: string, difficulty: Exercise["difficulty"], equipment: string[], tags: string[]) => {
  const goals = new Set<string>([titleCase(difficulty)]);
  if (category === "Full Body") goals.add("Full Body");
  if (category === "Core") goals.add("Core & Abs");
  if (category === "Lower Body" || category === "Legs") goals.add("Lower Body");
  if (category === "Upper Body") goals.add("Upper Body");
  if (category === "Cardio") goals.add("Cardio");
  if (category === "Mobility") goals.add("Mobility & Stretching");
  if (category === "Strength") goals.add("Strength");
  if (tags.some((tag) => ["weight loss", "fat burn"].includes(tag))) goals.add("Weight Loss");
  if (tags.includes("fat burn") || category === "Cardio") goals.add("Fat Burn");
  if (tags.some((tag) => ["muscle building", "muscle gain", "strength"].includes(tag)) || category === "Strength") goals.add("Muscle Gain");
  if (equipment.length === 0) {
    goals.add("No Equipment");
    goals.add("Home Workout");
  }
  return workoutCategories.filter((goal) => goals.has(goal));
};
export const exercises: Exercise[] = exerciseRows
  .filter(([originalName]) => highDemandExerciseNames.has(originalName))
  .map(([originalName, originalCategory, originalMuscleGroup, difficulty, equipment, duration, sets, reps, instructions]) => {
    const override = exerciseOverrides[originalName];
    const name = override?.name ?? originalName;
    const category = override?.category ?? originalCategory;
    const muscleGroup = override?.muscleGroup ?? originalMuscleGroup;
    const finalEquipment = override?.equipment ?? equipment;
    const tags = override?.tags ?? [category.toLowerCase(), muscleGroup, difficulty];
    return {
      id: `exercise_${seedId(name)}`, name, category, librarySection: librarySectionFor(originalName), goals: goalsForExercise(category, muscleGroup, difficulty, finalEquipment, tags), muscleGroup, difficulty, equipment: finalEquipment,
      homeSuitable: finalEquipment.length === 0 || finalEquipment.every((item) => ["resistance band", "dumbbells", "dumbbell", "kettlebell", "pull-up bar", "step", "wall"].includes(item)),
      noEquipment: finalEquipment.length === 0, duration, sets, reps, rest: 45,
      description: override?.description ?? `A supportive ${category.toLowerCase()} movement for mobility, control, and recovery.`,
      instructions, safetyNotes: ["Use a comfortable range of motion and stop if you feel sharp pain."],
      image: exerciseImage(name, category), caloriesEstimate: duration * 7, tags,
    };
  });
const workout = (id: string, name: string, category: string, difficulty: Workout["difficulty"], ids: string[], duration: number, goalIds = ["goal_balanced_nutrition", "goal_weight_maintenance", "goal_weight_loss"]) => ({
  id, name, category, categories: workoutCategories.filter((item) => item === category || item === titleCase(difficulty) || (category === "Cardio" && item === "Fat Burn") || (category === "Strength" && item === "Muscle Gain")), difficulty, duration, image: workoutImage(name, category), equipment: [], description: "A thoughtful Nouriva session designed to build consistency and energy.", exercises: ids.map((exerciseId) => ({ exerciseId })), goalIds, tags: [category.toLowerCase(), difficulty],
});
export const workouts: Workout[] = [
  workout("workout_full_body_foundation", "Full Body Foundation", "Full Body", "intermediate", ["exercise_burpees", "exercise_squats", "exercise_push-ups", "exercise_mountain-climbers", "exercise_kettlebell-swings"], 28),
  workout("workout_home_strength", "Home Strength & Stability", "Strength", "intermediate", ["exercise_squats", "exercise_deadlifts", "exercise_bulgarian-split-squats", "exercise_walking-lunges", "exercise_pull-ups"], 32, ["goal_muscle_gain", "goal_weight_gain", "goal_weight_maintenance"]),
  workout("workout_mobility_reset", "Movement Reset", "Full Body", "intermediate", ["exercise_squats", "exercise_walking-lunges", "exercise_mountain-climbers", "exercise_push-ups", "exercise_kettlebell-swings"], 22),
  workout("workout_cardio_core", "Cardio & Core Flow", "Cardio", "intermediate", ["exercise_mountain-climbers", "exercise_kettlebell-swings", "exercise_burpees", "exercise_walking-lunges", "exercise_jump-squats"], 25, ["goal_weight_loss", "goal_fat_burn"]),
  workout("workout_upper_body_gym", "Upper Body Gym", "Upper Body", "advanced", ["exercise_pull-ups", "exercise_push-ups", "exercise_bulgarian-split-squats", "exercise_mountain-climbers", "exercise_deadlifts"], 35, ["goal_muscle_gain", "goal_weight_gain"]),
  workout("workout_fat_burn_circuit", "Fat Burn Circuit", "Cardio", "intermediate", ["exercise_burpees", "exercise_jump-squats", "exercise_mountain-climbers", "exercise_kettlebell-swings", "exercise_walking-lunges"], 24, ["goal_fat_burn", "goal_weight_loss"]),
  workout("workout_muscle_gain_strength", "Muscle Gain Strength", "Strength", "advanced", ["exercise_bulgarian-split-squats", "exercise_deadlifts", "exercise_pull-ups", "exercise_squats", "exercise_push-ups"], 38, ["goal_muscle_gain", "goal_weight_gain", "goal_high_protein"]),
];

type LegacyFoodCategory = "fruit" | "vegetable" | "grain" | "legume" | "protein" | "dairy" | "nuts-seeds" | "condiment" | "snack" | "beverage";
type FoodRow = [
  name: string,
  category: LegacyFoodCategory,
  cuisine: string,
  calories: number,
  protein: number,
  carbohydrates: number,
  fat: number,
  fiber: number,
];

export const foodCategory = (category: string, cuisine: string): Food["category"] => {
  const normalizedCuisine = cuisine.toLowerCase();
  if (normalizedCuisine === "pakistani") return "Pakistani / Desi";
  if (normalizedCuisine === "south asian") return "Indian";
  if (normalizedCuisine === "japanese") return "Japanese";
  if (normalizedCuisine === "korean") return "Korean";
  if (normalizedCuisine === "mexican" || normalizedCuisine === "latin american") return "Mexican";
  if (normalizedCuisine === "middle eastern" || normalizedCuisine === "north african") return "Middle Eastern";
  if (normalizedCuisine === "mediterranean") return "Mediterranean";
  if (normalizedCuisine === "east asian" || normalizedCuisine === "southeast asian") return "Chinese";
  if (category === "fruit" || category === "Fruits") return "Fruits";
  if (category === "vegetable" || category === "Vegetables") return "Vegetables";
  if (category === "grain" || category === "Grains") return "Grains";
  if (category === "snack" || category === "Snacks") return "Snacks";
  if (category === "beverage" || category === "Beverages") return "Beverages";
  return "Western / Continental";
};

const foodRows: FoodRow[] = [
  ["Apple", "fruit", "global", 95, 0.5, 25, 0.3, 4.4],
  ["Banana", "fruit", "global", 105, 1.3, 27, 0.4, 3.1],
  ["Orange", "fruit", "Mediterranean", 62, 1.2, 15, 0.2, 3.1],
  ["Lemon", "fruit", "Mediterranean", 17, 0.6, 5.4, 0.2, 1.6],
  ["Mango", "fruit", "South Asian", 99, 1.4, 25, 0.6, 2.6],
  ["Pineapple", "fruit", "Caribbean", 82, 0.9, 22, 0.2, 2.3],
  ["Papaya", "fruit", "Latin American", 59, 0.9, 15, 0.4, 2.5],
  ["Strawberries", "fruit", "global", 49, 1, 12, 0.5, 3],
  ["Blueberries", "fruit", "North American", 84, 1.1, 21, 0.5, 3.6],
  ["Dates", "fruit", "Middle Eastern", 282, 2.5, 75, 0.4, 8],
  ["Pomegranate seeds", "fruit", "Middle Eastern", 83, 1.7, 19, 1.2, 4],
  ["Avocado", "fruit", "Latin American", 240, 3, 13, 22, 10],
  ["Raisins", "fruit", "global", 299, 3.1, 79, 0.5, 3.7],
  ["Tomato", "vegetable", "global", 22, 1.1, 4.8, 0.2, 1.5],
  ["Spinach", "vegetable", "global", 23, 2.9, 3.6, 0.4, 2.2],
  ["Kale", "vegetable", "North American", 35, 2.9, 4.4, 1.5, 4.1],
  ["Broccoli", "vegetable", "global", 34, 2.8, 7, 0.4, 2.6],
  ["Cauliflower", "vegetable", "South Asian", 25, 1.9, 5, 0.3, 2],
  ["Carrot", "vegetable", "global", 41, 0.9, 10, 0.2, 2.8],
  ["Cucumber", "vegetable", "Mediterranean", 16, 0.7, 3.6, 0.1, 0.5],
  ["Bell pepper", "vegetable", "global", 31, 1, 6, 0.3, 2.1],
  ["Eggplant", "vegetable", "Mediterranean", 35, 0.8, 9, 0.2, 3],
  ["Zucchini", "vegetable", "Mediterranean", 17, 1.2, 3.1, 0.3, 1],
  ["Okra", "vegetable", "South Asian", 33, 1.9, 7.5, 0.2, 3.2],
  ["Green beans", "vegetable", "global", 31, 1.8, 7, 0.2, 2.7],
  ["Sweet potato", "vegetable", "global", 112, 2, 26, 0.1, 3.9],
  ["Potato", "vegetable", "global", 130, 3, 30, 0.2, 3.4],
  ["Onion", "vegetable", "global", 40, 1.1, 9, 0.1, 1.7],
  ["Garlic", "vegetable", "global", 5, 0.2, 1, 0, 0.1],
  ["Ginger", "vegetable", "South Asian", 8, 0.2, 1.8, 0.1, 0.2],
  ["Mushrooms", "vegetable", "East Asian", 22, 3.1, 3.3, 0.3, 1],
  ["Corn", "vegetable", "Latin American", 96, 3.4, 21, 1.5, 2.4],
  ["Basmati rice", "grain", "South Asian", 205, 4.3, 45, 0.4, 0.6],
  ["Brown rice", "grain", "global", 216, 5, 45, 1.8, 3.5],
  ["Quinoa", "grain", "Andean", 222, 8, 39, 3.6, 5.2],
  ["Rolled oats", "grain", "global", 150, 5, 27, 3, 4],
  ["Whole wheat flour", "grain", "global", 407, 16, 84, 2.2, 13],
  ["Corn tortillas", "grain", "Mexican", 104, 2.7, 22, 1.4, 2.5],
  ["Whole wheat bread", "grain", "global", 100, 4, 18, 1.5, 2.5],
  ["Roti", "grain", "Pakistani", 120, 4, 22, 2, 3],
  ["Naan", "grain", "Pakistani", 262, 9, 45, 5, 2],
  ["Paratha", "grain", "Pakistani", 260, 5, 35, 11, 3],
  ["Chickpeas", "legume", "Middle Eastern", 269, 14.5, 45, 4.2, 12.5],
  ["Chana", "legume", "Pakistani", 240, 13, 40, 4, 11],
  ["Daal", "legume", "Pakistani", 215, 16, 35, 3, 11],
  ["Red lentils", "legume", "South Asian", 230, 18, 40, 0.8, 15],
  ["Green lentils", "legume", "Mediterranean", 230, 18, 40, 0.8, 15],
  ["Black beans", "legume", "Latin American", 227, 15, 41, 0.9, 15],
  ["Kidney beans", "legume", "Latin American", 225, 15, 40, 0.9, 11],
  ["Black-eyed peas", "legume", "West African", 198, 13, 35, 0.9, 11],
  ["Edamame", "legume", "East Asian", 188, 18, 14, 8, 8],
  ["Tofu", "protein", "East Asian", 144, 17, 3, 9, 2],
  ["Tempeh", "protein", "Indonesian", 195, 20, 8, 11, 4],
  ["Chicken breast", "protein", "global", 165, 31, 0, 3.6, 0],
  ["Chicken thigh", "protein", "global", 209, 26, 0, 11, 0],
  ["Chicken tikka", "protein", "Pakistani", 190, 29, 4, 7, 0],
  ["Chicken karahi", "protein", "Pakistani", 280, 25, 9, 16, 2],
  ["Chicken biryani", "protein", "Pakistani", 310, 18, 34, 11, 3],
  ["Salmon", "protein", "Nordic", 208, 20, 0, 13, 0],
  ["Cod", "protein", "Mediterranean", 90, 20, 0, 0.7, 0],
  ["Tuna", "protein", "global", 132, 29, 0, 1.3, 0],
  ["Shrimp", "protein", "Southeast Asian", 99, 24, 0.2, 0.3, 0],
  ["Lean beef", "protein", "global", 217, 26, 0, 12, 0],
  ["Lamb", "protein", "Middle Eastern", 250, 25, 0, 16, 0],
  ["Egg", "protein", "global", 72, 6.3, 0.4, 4.8, 0],
  ["Paneer", "dairy", "South Asian", 265, 18, 6, 20, 0],
  ["Greek yogurt", "dairy", "Mediterranean", 100, 17, 6, 0.7, 0],
  ["Plain yogurt", "dairy", "global", 61, 3.5, 4.7, 3.3, 0],
  ["Raita", "dairy", "Pakistani", 75, 4, 6, 3, 1],
  ["Milk", "dairy", "global", 122, 8, 12, 5, 0],
  ["Feta cheese", "dairy", "Mediterranean", 75, 4, 1, 6, 0],
  ["Cheddar cheese", "dairy", "global", 113, 7, 0.4, 9, 0],
  ["Coconut milk", "dairy", "Southeast Asian", 76, 0.7, 2.3, 7.2, 0],
  ["Almonds", "nuts-seeds", "Middle Eastern", 164, 6, 6, 14, 3.5],
  ["Walnuts", "nuts-seeds", "Mediterranean", 185, 4.3, 3.9, 18.5, 1.9],
  ["Peanuts", "nuts-seeds", "global", 161, 7.3, 4.6, 14, 2.4],
  ["Cashews", "nuts-seeds", "South Asian", 157, 5.2, 9, 12.4, 0.9],
  ["Chia seeds", "nuts-seeds", "Latin American", 138, 4.7, 12, 8.7, 10],
  ["Flax seeds", "nuts-seeds", "global", 150, 5.1, 8, 12, 7.6],
  ["Tahini", "condiment", "Middle Eastern", 89, 2.6, 3.2, 8, 1.4],
  ["Hummus", "condiment", "Middle Eastern", 166, 8, 14, 10, 6],
  ["Olive oil", "condiment", "Mediterranean", 119, 0, 0, 13.5, 0],
  ["Peanut butter", "condiment", "North American", 188, 8, 7, 16, 2],
  ["Coconut oil", "condiment", "Southeast Asian", 121, 0, 0, 13.5, 0],
  ["Soy sauce", "condiment", "East Asian", 9, 1.3, 0.8, 0.1, 0],
  ["Tomato passata", "condiment", "Italian", 29, 1.4, 5.5, 0.2, 1.5],
  ["Salsa", "condiment", "Mexican", 36, 1.5, 7, 0.2, 1.5],
  ["Curry paste", "condiment", "Thai", 40, 1, 6, 1.5, 1],
  ["Dark chocolate", "snack", "European", 170, 2.2, 13, 12, 3],
  ["Popcorn", "snack", "North American", 93, 3.1, 19, 1.1, 3.5],
  ["Rice cakes", "snack", "East Asian", 70, 1.5, 15, 0.5, 0.5],
  ["Samosa", "snack", "Pakistani", 262, 5, 31, 13, 3],
  ["Pakora", "snack", "Pakistani", 180, 5, 20, 9, 3],
  ["Lassi", "beverage", "Pakistani", 130, 6, 17, 4, 0],
  ["Green tea", "beverage", "East Asian", 2, 0, 0, 0, 0],
  ["Coffee", "beverage", "global", 2, 0.3, 0, 0, 0],
  ["Coconut water", "beverage", "Southeast Asian", 46, 2, 9, 0.5, 2.6],
  ["Nihari", "protein", "Pakistani", 310, 25, 8, 20, 1],
  ["Haleem", "legume", "Pakistani", 280, 18, 28, 10, 8],
  ["Saag", "vegetable", "Pakistani", 110, 5, 12, 5, 5],
  ["Bhindi masala", "vegetable", "Pakistani", 145, 4, 16, 8, 5],
  ["Aloo gobi", "vegetable", "Pakistani", 170, 5, 26, 6, 6],
  ["Chana dal", "legume", "Pakistani", 230, 14, 38, 4, 12],
  ["Moong dal", "legume", "Pakistani", 212, 14, 36, 3, 10],
  ["Masoor dal", "legume", "Pakistani", 215, 16, 35, 3, 11],
  ["Seekh kebab", "protein", "Pakistani", 230, 23, 5, 14, 1],
  ["Kheer", "dairy", "Pakistani", 210, 6, 32, 6, 1],
  ["Kimchi", "vegetable", "Korean", 15, 1, 2, 0.5, 1.5],
  ["Miso paste", "condiment", "Japanese", 56, 3.5, 7, 1.8, 2],
  ["Couscous", "grain", "North African", 176, 6, 36, 0.3, 2.2],
  ["Pita bread", "grain", "Middle Eastern", 165, 5.5, 33, 1, 1.5],
  ["Falafel", "legume", "Middle Eastern", 333, 13, 32, 18, 7],
  ["Harissa", "condiment", "North African", 30, 1, 4, 1.2, 1],
  ["Plantain", "fruit", "West African", 218, 2.3, 57, 0.7, 4.1],
  ["Cassava", "vegetable", "West African", 160, 1.4, 38, 0.3, 1.8],
  ["Arepa", "grain", "Latin American", 215, 5, 44, 2, 3],
  ["Pesto", "condiment", "Italian", 160, 4, 3, 16, 1],
  ["Mozzarella", "dairy", "Italian", 85, 6, 1, 6, 0],
];

const foodTags = (category: LegacyFoodCategory): string[] =>
  ["fruit", "vegetable", "grain", "legume", "nuts-seeds"].includes(category)
    ? ["vegetarian"]
    : category === "dairy"
      ? ["vegetarian"]
      : [];

export const foods: Food[] = foodRows.map(
  ([name, category, cuisine, calories, protein, carbohydrates, fat, fiber]) => ({
    id: foodId(name),
    name,
    category: foodCategory(category, cuisine),
    cuisine,
    servingSize: "1 serving",
    calories,
    protein,
    carbohydrates,
    fat,
    fiber,
    commonServingSizes: ["1 serving", "100 g", "1 cup"],
    tags: foodTags(category),
  }),
);

const n = (
  calories: number,
  protein: number,
  carbohydrates: number,
  fat: number,
  fiber: number,
): [number, number, number, number, number] => [
  calories,
  protein,
  carbohydrates,
  fat,
  fiber,
];

const ingredient = (name: string, quantity: number, unit: string): RecipeIngredient => ({
  foodId: foodId(name),
  quantity,
  unit,
});

type RecipeRow = {
  name: string;
  cuisine: string;
  mealType: Recipe["mealType"];
  description: string;
  prep: number;
  cook: number;
  servings?: number;
  ingredients: RecipeIngredient[];
  calories: [number, number, number, number, number];
  tags?: string[];
};

const r = (
  name: string,
  cuisine: string,
  mealType: Recipe["mealType"],
  ingredients: RecipeIngredient[],
  nutrition: [number, number, number, number, number],
  description = `A practical ${cuisine} ${mealType} made with balanced, everyday ingredients.`,
  prep = 10,
  cook = 20,
  tags: string[] = [],
): RecipeRow => ({ name, cuisine, mealType, ingredients, calories: nutrition, description, prep, cook, tags });

const recipeRows: RecipeRow[] = [
  r("Masala omelette", "Pakistani", "breakfast", [ingredient("Egg", 2, "eggs"), ingredient("Tomato", 0.5, "cup"), ingredient("Onion", 0.25, "cup"), ingredient("Roti", 1, "piece")], n(390, 21, 35, 18, 5)),
  r("Aloo paratha", "Pakistani", "breakfast", [ingredient("Paratha", 1, "piece"), ingredient("Potato", 0.75, "cup"), ingredient("Plain yogurt", 0.5, "cup"), ingredient("Onion", 0.1, "cup")], n(465, 13, 63, 17, 7)),
  r("Overnight oats with berries", "North American", "breakfast", [ingredient("Rolled oats", 0.75, "cup"), ingredient("Greek yogurt", 0.5, "cup"), ingredient("Milk", 0.5, "cup"), ingredient("Blueberries", 0.5, "cup"), ingredient("Chia seeds", 1, "tbsp")], n(410, 24, 58, 10, 12), undefined, 5, 0, ["vegetarian"]),
  r("Shakshuka", "North African", "breakfast", [ingredient("Egg", 2, "eggs"), ingredient("Tomato passata", 1, "cup"), ingredient("Bell pepper", 0.5, "cup"), ingredient("Onion", 0.25, "cup"), ingredient("Pita bread", 1, "piece")], n(380, 21, 38, 16, 7)),
  r("Avocado toast", "North American", "breakfast", [ingredient("Whole wheat bread", 2, "slices"), ingredient("Avocado", 0.5, "fruit"), ingredient("Egg", 1, "egg"), ingredient("Tomato", 0.25, "cup")], n(365, 16, 35, 19, 10)),
  r("Congee with egg", "Chinese", "breakfast", [ingredient("Brown rice", 0.6, "cup"), ingredient("Egg", 1, "egg"), ingredient("Mushrooms", 0.5, "cup"), ingredient("Soy sauce", 1, "tsp"), ingredient("Ginger", 1, "tsp")], n(330, 14, 47, 10, 4)),
  r("Mango lassi bowl", "Pakistani", "breakfast", [ingredient("Greek yogurt", 1, "cup"), ingredient("Mango", 0.75, "cup"), ingredient("Chia seeds", 1, "tbsp"), ingredient("Almonds", 0.25, "cup")], n(390, 25, 44, 14, 9), undefined, 8, 0, ["vegetarian"]),
  r("Turkish menemen", "Turkish", "breakfast", [ingredient("Egg", 2, "eggs"), ingredient("Tomato", 1, "cup"), ingredient("Bell pepper", 0.5, "cup"), ingredient("Whole wheat bread", 1, "slice")], n(350, 20, 31, 16, 6)),
  r("Veggie breakfast burrito", "Mexican", "breakfast", [ingredient("Corn tortillas", 2, "tortillas"), ingredient("Black beans", 0.5, "cup"), ingredient("Egg", 1, "egg"), ingredient("Avocado", 0.25, "fruit"), ingredient("Salsa", 0.25, "cup")], n(430, 22, 53, 16, 15)),
  r("Japanese miso breakfast soup", "Japanese", "breakfast", [ingredient("Miso paste", 1, "tbsp"), ingredient("Tofu", 0.5, "cup"), ingredient("Mushrooms", 0.5, "cup"), ingredient("Brown rice", 0.5, "cup"), ingredient("Spinach", 0.5, "cup")], n(310, 18, 43, 8, 6)),
  r("Chickpea spinach salad", "Mediterranean", "lunch", [ingredient("Chickpeas", 0.75, "cup"), ingredient("Spinach", 2, "cups"), ingredient("Cucumber", 0.5, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Feta cheese", 0.25, "cup"), ingredient("Olive oil", 1, "tbsp")], n(420, 18, 48, 19, 14), undefined, 12, 0, ["vegetarian"]),
  r("Chicken tikka rice bowl", "Pakistani", "lunch", [ingredient("Chicken tikka", 1, "serving"), ingredient("Basmati rice", 0.75, "cup"), ingredient("Cucumber", 0.5, "cup"), ingredient("Plain yogurt", 0.25, "cup"), ingredient("Spinach", 1, "cup")], n(520, 42, 58, 14, 6)),
  r("Lentil dal with roti", "Pakistani", "lunch", [ingredient("Masoor dal", 1, "cup"), ingredient("Roti", 2, "pieces"), ingredient("Spinach", 1, "cup"), ingredient("Tomato", 0.5, "cup")], n(510, 25, 83, 10, 19), undefined, 15, 30, ["vegetarian"]),
  r("Greek quinoa salad", "Greek", "lunch", [ingredient("Quinoa", 0.75, "cup"), ingredient("Cucumber", 0.5, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Feta cheese", 0.25, "cup"), ingredient("Chickpeas", 0.5, "cup"), ingredient("Olive oil", 1, "tbsp")], n(490, 20, 64, 18, 13), undefined, 15, 15, ["vegetarian"]),
  r("Tuna avocado pita", "Mediterranean", "lunch", [ingredient("Tuna", 1, "can"), ingredient("Avocado", 0.5, "fruit"), ingredient("Pita bread", 1, "piece"), ingredient("Cucumber", 0.25, "cup"), ingredient("Greek yogurt", 0.25, "cup")], n(455, 35, 45, 16, 10)),
  r("Thai tofu lettuce wraps", "Thai", "lunch", [ingredient("Tofu", 1, "cup"), ingredient("Bell pepper", 0.5, "cup"), ingredient("Mushrooms", 0.5, "cup"), ingredient("Peanuts", 2, "tbsp"), ingredient("Soy sauce", 1, "tbsp")], n(390, 25, 25, 22, 7), undefined, 15, 15, ["vegetarian"]),
  r("Mexican black bean tacos", "Mexican", "lunch", [ingredient("Corn tortillas", 3, "tortillas"), ingredient("Black beans", 0.75, "cup"), ingredient("Avocado", 0.25, "fruit"), ingredient("Salsa", 0.25, "cup"), ingredient("Corn", 0.25, "cup")], n(470, 19, 72, 15, 19), undefined, 10, 15, ["vegetarian"]),
  r("Moroccan couscous bowl", "Moroccan", "lunch", [ingredient("Couscous", 0.75, "cup"), ingredient("Chickpeas", 0.5, "cup"), ingredient("Carrot", 0.5, "cup"), ingredient("Zucchini", 0.5, "cup"), ingredient("Raisins", 2, "tbsp")], n(455, 17, 79, 10, 14), undefined, 15, 20, ["vegetarian"]),
  r("Korean bibimbap", "Korean", "lunch", [ingredient("Brown rice", 0.75, "cup"), ingredient("Egg", 1, "egg"), ingredient("Spinach", 0.5, "cup"), ingredient("Carrot", 0.5, "cup"), ingredient("Mushrooms", 0.5, "cup"), ingredient("Kimchi", 0.25, "cup")], n(465, 19, 66, 15, 9)),
  r("Falafel hummus plate", "Middle Eastern", "lunch", [ingredient("Falafel", 3, "pieces"), ingredient("Hummus", 0.25, "cup"), ingredient("Pita bread", 1, "piece"), ingredient("Cucumber", 0.5, "cup"), ingredient("Tomato", 0.5, "cup")], n(520, 18, 70, 21, 13), undefined, 15, 10, ["vegetarian"]),
  r("Nigerian bean and plantain bowl", "West African", "lunch", [ingredient("Black-eyed peas", 0.75, "cup"), ingredient("Plantain", 0.5, "piece"), ingredient("Tomato", 0.5, "cup"), ingredient("Spinach", 1, "cup")], n(510, 22, 86, 10, 15), undefined, 15, 25, ["vegetarian"]),
  r("Caprese quinoa salad", "Italian", "lunch", [ingredient("Quinoa", 0.75, "cup"), ingredient("Tomato", 1, "cup"), ingredient("Mozzarella", 0.5, "cup"), ingredient("Spinach", 1, "cup"), ingredient("Olive oil", 1, "tbsp")], n(465, 22, 50, 21, 8), undefined, 10, 15, ["vegetarian"]),
  r("Chicken shawarma salad", "Middle Eastern", "lunch", [ingredient("Chicken breast", 1, "serving"), ingredient("Pita bread", 0.5, "piece"), ingredient("Cucumber", 0.5, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Tahini", 1, "tbsp")], n(450, 39, 39, 17, 8)),
  r("Vietnamese shrimp rolls", "Vietnamese", "lunch", [ingredient("Shrimp", 1, "serving"), ingredient("Rice cakes", 3, "pieces"), ingredient("Cucumber", 0.5, "cup"), ingredient("Carrot", 0.5, "cup"), ingredient("Peanuts", 1, "tbsp")], n(365, 28, 48, 9, 6)),
  r("Nihari with naan", "Pakistani", "dinner", [ingredient("Nihari", 1, "serving"), ingredient("Naan", 1, "piece"), ingredient("Onion", 0.25, "cup"), ingredient("Cucumber", 0.25, "cup")], n(620, 35, 61, 27, 6)),
  r("Chicken biryani", "Pakistani", "dinner", [ingredient("Chicken thigh", 1, "serving"), ingredient("Basmati rice", 1, "cup"), ingredient("Onion", 0.5, "cup"), ingredient("Plain yogurt", 0.25, "cup"), ingredient("Carrot", 0.25, "cup")], n(610, 35, 78, 18, 7)),
  r("Salmon with sweet potato", "Nordic", "dinner", [ingredient("Salmon", 1, "fillet"), ingredient("Sweet potato", 1, "piece"), ingredient("Broccoli", 1, "cup"), ingredient("Olive oil", 1, "tsp")], n(560, 39, 52, 22, 11)),
  r("Thai green curry tofu", "Thai", "dinner", [ingredient("Tofu", 1, "cup"), ingredient("Coconut milk", 0.5, "cup"), ingredient("Curry paste", 1, "tbsp"), ingredient("Bell pepper", 0.5, "cup"), ingredient("Brown rice", 0.75, "cup")], n(575, 25, 61, 25, 8), undefined, 15, 25, ["vegetarian"]),
  r("Beef and broccoli stir-fry", "Chinese", "dinner", [ingredient("Lean beef", 1, "serving"), ingredient("Broccoli", 1.5, "cups"), ingredient("Brown rice", 0.75, "cup"), ingredient("Soy sauce", 1, "tbsp"), ingredient("Garlic", 1, "clove")], n(545, 40, 57, 18, 9)),
  r("Lamb kofta with couscous", "Middle Eastern", "dinner", [ingredient("Lamb", 1, "serving"), ingredient("Couscous", 0.75, "cup"), ingredient("Cucumber", 0.5, "cup"), ingredient("Plain yogurt", 0.25, "cup")], n(590, 35, 52, 27, 6)),
  r("Paneer tikka masala", "Indian", "dinner", [ingredient("Paneer", 1, "serving"), ingredient("Tomato passata", 1, "cup"), ingredient("Onion", 0.25, "cup"), ingredient("Basmati rice", 0.75, "cup"), ingredient("Spinach", 1, "cup")], n(650, 30, 66, 30, 8), undefined, 15, 30, ["vegetarian"]),
  r("Vegetable saag with roti", "Pakistani", "dinner", [ingredient("Saag", 1, "serving"), ingredient("Roti", 2, "pieces"), ingredient("Plain yogurt", 0.25, "cup"), ingredient("Tomato", 0.25, "cup")], n(430, 17, 62, 13, 12), undefined, 10, 20, ["vegetarian"]),
  r("Mediterranean baked cod", "Mediterranean", "dinner", [ingredient("Cod", 1, "fillet"), ingredient("Quinoa", 0.75, "cup"), ingredient("Zucchini", 1, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Olive oil", 1, "tsp")], n(475, 39, 49, 14, 8)),
  r("Italian lentil pasta", "Italian", "dinner", [ingredient("Red lentils", 0.75, "cup"), ingredient("Whole wheat flour", 0.5, "cup"), ingredient("Tomato passata", 1, "cup"), ingredient("Spinach", 1, "cup")], n(510, 27, 82, 9, 19), undefined, 15, 25, ["vegetarian"]),
  r("Japanese salmon rice bowl", "Japanese", "dinner", [ingredient("Salmon", 1, "fillet"), ingredient("Brown rice", 0.75, "cup"), ingredient("Edamame", 0.5, "cup"), ingredient("Cucumber", 0.5, "cup"), ingredient("Soy sauce", 1, "tsp")], n(570, 42, 54, 21, 9)),
  r("Caribbean jerk chicken", "Caribbean", "dinner", [ingredient("Chicken breast", 1, "serving"), ingredient("Brown rice", 0.75, "cup"), ingredient("Pineapple", 0.5, "cup"), ingredient("Bell pepper", 0.5, "cup")], n(520, 42, 63, 12, 8)),
  r("Ethiopian misir wat", "Ethiopian", "dinner", [ingredient("Red lentils", 1, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Onion", 0.5, "cup"), ingredient("Roti", 1, "piece"), ingredient("Spinach", 1, "cup")], n(485, 25, 76, 11, 20), undefined, 15, 30, ["vegetarian"]),
  r("Stuffed bell peppers", "Mexican", "dinner", [ingredient("Bell pepper", 2, "peppers"), ingredient("Black beans", 0.5, "cup"), ingredient("Brown rice", 0.5, "cup"), ingredient("Corn", 0.25, "cup"), ingredient("Cheddar cheese", 0.25, "cup"), ingredient("Salsa", 0.25, "cup")], n(505, 23, 73, 16, 16), undefined, 20, 35, ["vegetarian"]),
  r("Soba tofu noodle bowl", "Japanese", "dinner", [ingredient("Tofu", 1, "cup"), ingredient("Whole wheat flour", 0.5, "cup"), ingredient("Mushrooms", 1, "cup"), ingredient("Spinach", 1, "cup"), ingredient("Soy sauce", 1, "tbsp")], n(470, 26, 63, 15, 10), undefined, 15, 20, ["vegetarian"]),
  r("Chicken and okra curry", "Pakistani", "dinner", [ingredient("Chicken thigh", 1, "serving"), ingredient("Okra", 1, "cup"), ingredient("Tomato", 0.5, "cup"), ingredient("Basmati rice", 0.75, "cup")], n(565, 37, 59, 20, 8)),
  r("Haleem with roti", "Pakistani", "dinner", [ingredient("Haleem", 1, "serving"), ingredient("Roti", 1, "piece"), ingredient("Onion", 0.25, "cup"), ingredient("Lemon", 0.25, "fruit")], n(510, 27, 61, 18, 13)),
  r("Peanut butter banana toast", "North American", "snack", [ingredient("Whole wheat bread", 1, "slice"), ingredient("Peanut butter", 1, "tbsp"), ingredient("Banana", 0.5, "fruit")], n(275, 10, 39, 10, 6), undefined, 5, 0),
  r("Hummus veggie sticks", "Middle Eastern", "snack", [ingredient("Hummus", 0.25, "cup"), ingredient("Carrot", 1, "cup"), ingredient("Cucumber", 1, "cup"), ingredient("Bell pepper", 0.5, "cup")], n(210, 8, 27, 9, 10), undefined, 8, 0, ["vegetarian"]),
  r("Spiced roasted chickpeas", "Middle Eastern", "snack", [ingredient("Chickpeas", 0.75, "cup"), ingredient("Olive oil", 1, "tsp")], n(250, 12, 38, 7, 11), undefined, 5, 30, ["vegetarian"]),
  r("Apple walnut yogurt", "Mediterranean", "snack", [ingredient("Apple", 1, "fruit"), ingredient("Plain yogurt", 0.75, "cup"), ingredient("Walnuts", 2, "tbsp")], n(280, 12, 34, 12, 6), undefined, 5, 0, ["vegetarian"]),
  r("Samosa chaat", "Pakistani", "snack", [ingredient("Samosa", 1, "piece"), ingredient("Chickpeas", 0.5, "cup"), ingredient("Plain yogurt", 0.25, "cup"), ingredient("Tomato", 0.25, "cup")], n(390, 15, 53, 14, 11)),
  r("Edamame sea-salt cup", "Japanese", "snack", [ingredient("Edamame", 1, "cup")], n(188, 18, 14, 8, 8), undefined, 3, 5, ["vegetarian"]),
  r("Energy date balls", "Global", "snack", [ingredient("Dates", 0.75, "cup"), ingredient("Almonds", 0.5, "cup"), ingredient("Chia seeds", 1, "tbsp")], n(240, 6, 32, 12, 7), undefined, 12, 0, ["vegetarian"]),
  r("Lassi smoothie", "Pakistani", "snack", [ingredient("Lassi", 1, "cup"), ingredient("Mango", 0.5, "cup"), ingredient("Chia seeds", 1, "tbsp")], n(250, 10, 35, 8, 6)),
  r("Popcorn trail mix", "North American", "snack", [ingredient("Popcorn", 2, "cups"), ingredient("Peanuts", 2, "tbsp"), ingredient("Raisins", 2, "tbsp"), ingredient("Dark chocolate", 1, "square")], n(295, 9, 40, 13, 6)),
  r("Kimchi rice cakes", "Korean", "snack", [ingredient("Rice cakes", 3, "pieces"), ingredient("Kimchi", 0.5, "cup"), ingredient("Egg", 1, "egg")], n(250, 10, 37, 7, 3)),
  r("Coconut chia pudding", "Southeast Asian", "snack", [ingredient("Coconut milk", 0.75, "cup"), ingredient("Chia seeds", 2, "tbsp"), ingredient("Mango", 0.5, "cup")], n(300, 7, 32, 18, 12), undefined, 5, 0, ["vegetarian"]),
];

export const recipes: Recipe[] = recipeRows.map((row) => ({
  id: recipeId(row.name),
  name: row.name,
  description: row.description,
  cuisine: row.cuisine,
  mealType: row.mealType,
  preparationTime: row.prep + row.cook,
  servings: row.servings ?? 2,
  ingredients: row.ingredients,
  instructions: [
    "Prepare and measure the ingredients.",
    "Cook the ingredients using the listed method until tender and safely cooked.",
    "Taste, adjust seasoning, and serve while warm.",
  ],
  calories: row.calories[0],
  protein: row.calories[1],
  carbohydrates: row.calories[2],
  fat: row.calories[3],
  fiber: row.calories[4],
  tags: row.tags ?? [],
}));

export const nutritionGoals: NutritionGoal[] = [
  { id: "goal_weight_loss", name: "Weight Loss", description: "A flexible, portion-aware pattern centered on satisfying, nutrient-dense foods.", recommendedFocus: ["vegetables", "protein at meals", "fiber-rich carbohydrates"], defaultMealStructure: { breakfast: "protein and fruit", lunch: "vegetables and lean protein", snack: "fruit or yogurt", dinner: "vegetables, protein, and a measured grain" }, notes: "General wellness guidance only; individual energy needs vary." },
  { id: "goal_weight_maintenance", name: "Weight Maintenance", description: "A balanced everyday pattern designed to support steady energy and variety.", recommendedFocus: ["variety", "regular meals", "balanced portions"], defaultMealStructure: { breakfast: "balanced breakfast", lunch: "balanced lunch", snack: "optional nourishing snack", dinner: "balanced dinner" }, notes: "Adjust portions to personal needs, activity, and preferences." },
  { id: "goal_weight_gain", name: "Weight Gain", description: "A practical pattern that adds energy-dense, nourishing foods across the day.", recommendedFocus: ["energy-dense whole foods", "protein", "regular snacks"], defaultMealStructure: { breakfast: "substantial breakfast", lunch: "calorie-dense balanced lunch", snack: "nut or dairy-based snack", dinner: "balanced dinner with an extra side" }, notes: "Consider professional guidance when weight changes are difficult or unintentional." },
  { id: "goal_fat_burn", name: "Fat Burn", description: "A sustainable movement-focused plan combining cardio, strength, and recovery.", recommendedFocus: ["regular movement", "cardio intervals", "strength training"], defaultMealStructure: { breakfast: "protein and fruit", lunch: "vegetables and lean protein", snack: "fruit or yogurt", dinner: "vegetables, protein, and whole grains" }, notes: "Fat loss varies by person; avoid extreme restriction and prioritize recovery." },
  { id: "goal_muscle_gain", name: "Muscle Gain", description: "A strength-focused plan supported by adequate energy, protein, and recovery.", recommendedFocus: ["progressive strength", "protein at meals", "rest and recovery"], defaultMealStructure: { breakfast: "protein-rich breakfast", lunch: "protein, vegetables, and grains", snack: "protein-rich snack", dinner: "protein, vegetables, and a substantial side" }, notes: "Strength and body-composition changes take time; adapt training to your experience." },
  { id: "goal_high_protein", name: "High Protein", description: "A meal pattern that includes a meaningful protein source at each meal.", recommendedFocus: ["protein at each meal", "legumes and dairy", "hydration"], defaultMealStructure: { breakfast: "protein-rich breakfast", lunch: "protein and vegetables", snack: "protein-rich snack", dinner: "protein, vegetables, and whole grains" }, notes: "Protein needs vary by person; this is not medical or treatment advice." },
  { id: "goal_high_fiber", name: "High Fiber", description: "A gradual, varied approach featuring fruits, vegetables, legumes, nuts, seeds, and whole grains.", recommendedFocus: ["legumes", "whole grains", "fruits and vegetables"], defaultMealStructure: { breakfast: "whole grain and fruit", lunch: "legume and vegetable meal", snack: "fruit, nuts, or seeds", dinner: "vegetables, legumes, or whole grains" }, notes: "Increase fiber gradually and drink fluids according to personal needs." },
  { id: "goal_balanced_nutrition", name: "Balanced Nutrition", description: "A flexible global template for enjoying a broad range of foods and nutrients.", recommendedFocus: ["food variety", "colorful produce", "balanced portions"], defaultMealStructure: { breakfast: "protein, produce, and whole grain", lunch: "vegetables, protein, and grain", snack: "fruit, dairy, or nuts", dinner: "vegetables, protein, and grain" }, notes: "Seed values are approximate reference data, not medical-grade measurements." },
];

const meal = (name: string, servings = 1) => ({ recipeId: recipeId(name), servings });

export const mealTemplates: MealTemplate[] = [
  { id: "template_balanced_day", name: "Balanced global day", goalId: "goal_balanced_nutrition", description: "A varied day with familiar meals from several cuisines.", breakfast: [meal("Overnight oats with berries")], lunch: [meal("Chicken tikka rice bowl")], dinner: [meal("Salmon with sweet potato")], snack: [meal("Apple walnut yogurt")] },
  { id: "template_high_protein", name: "High-protein training day", goalId: "goal_high_protein", description: "Protein-forward meals for active days.", breakfast: [meal("Masala omelette")], lunch: [meal("Chicken shawarma salad")], dinner: [meal("Beef and broccoli stir-fry")], snack: [meal("Edamame sea-salt cup")] },
  { id: "template_weight_loss", name: "Light and filling day", goalId: "goal_weight_loss", description: "High-fiber portions that keep preparation simple.", breakfast: [meal("Japanese miso breakfast soup")], lunch: [meal("Chickpea spinach salad")], dinner: [meal("Vegetable saag with roti")], snack: [meal("Spiced roasted chickpeas")] },
  { id: "template_weight_maintenance", name: "Steady everyday day", goalId: "goal_weight_maintenance", description: "A practical mix of familiar meals for everyday maintenance.", breakfast: [meal("Turkish menemen")], lunch: [meal("Greek quinoa salad")], dinner: [meal("Chicken biryani")], snack: [meal("Hummus veggie sticks")] },
  { id: "template_weight_gain", name: "Nourishing energy day", goalId: "goal_weight_gain", description: "Practical meals with satisfying portions and nourishing snacks.", breakfast: [meal("Mango lassi bowl")], lunch: [meal("Chicken tikka rice bowl")], dinner: [meal("Paneer tikka masala")], snack: [meal("Peanut butter banana toast")] },
  { id: "template_high_fiber", name: "High-fiber global day", goalId: "goal_high_fiber", description: "Legumes, produce, seeds, and whole grains across the day.", breakfast: [meal("Overnight oats with berries")], lunch: [meal("Lentil dal with roti")], dinner: [meal("Ethiopian misir wat")], snack: [meal("Energy date balls")] },
];

const groceryRows: [string, GroceryItem["category"], string, string[]][] = [
  ["Apples", "produce", "piece", []], ["Bananas", "produce", "bunch", []], ["Mangoes", "produce", "piece", []], ["Spinach", "produce", "bag", ["vegetarian", "vegan"]], ["Tomatoes", "produce", "kg", []], ["Onions", "produce", "kg", []], ["Cucumbers", "produce", "piece", []], ["Broccoli", "produce", "head", []], ["Carrots", "produce", "kg", []], ["Bell peppers", "produce", "piece", []], ["Potatoes", "produce", "kg", []], ["Fresh ginger", "produce", "piece", []],
  ["Chicken breast", "protein", "kg", []], ["Chicken thighs", "protein", "kg", []], ["Salmon fillets", "protein", "fillet", []], ["Eggs", "protein", "dozen", []], ["Firm tofu", "protein", "block", ["vegetarian", "vegan"]], ["Canned tuna", "protein", "can", []],
  ["Greek yogurt", "dairy", "tub", ["vegetarian"]], ["Plain yogurt", "dairy", "tub", ["vegetarian"]], ["Milk", "dairy", "liter", ["vegetarian"]], ["Feta cheese", "dairy", "pack", ["vegetarian"]], ["Paneer", "dairy", "pack", ["vegetarian"]],
  ["Basmati rice", "grains", "kg", ["vegan"]], ["Brown rice", "grains", "kg", ["vegan"]], ["Rolled oats", "grains", "bag", ["vegan"]], ["Whole wheat bread", "grains", "loaf", []], ["Roti", "grains", "pack", ["vegan"]], ["Pita bread", "grains", "pack", ["vegan"]],
  ["Chickpeas", "pantry", "can", ["vegan"]], ["Red lentils", "pantry", "bag", ["vegan"]], ["Black beans", "pantry", "can", ["vegan"]], ["Olive oil", "pantry", "bottle", ["vegan"]], ["Canned tomato passata", "pantry", "jar", ["vegan"]], ["Peanut butter", "pantry", "jar", ["vegan"]], ["Tahini", "pantry", "jar", ["vegan"]],
  ["Cumin", "spices", "jar", ["vegan"]], ["Turmeric", "spices", "jar", ["vegan"]], ["Garam masala", "spices", "jar", ["vegan"]], ["Chili flakes", "spices", "jar", ["vegan"]], ["Black pepper", "spices", "jar", ["vegan"]],
  ["Granola bars", "snacks", "box", ["vegetarian"]], ["Roasted almonds", "snacks", "bag", ["vegan"]], ["Rice crackers", "snacks", "bag", ["vegan"]],
  ["Frozen edamame", "frozen", "bag", ["vegan"]], ["Frozen berries", "frozen", "bag", ["vegan"]], ["Frozen mixed vegetables", "frozen", "bag", ["vegan"]], ["Green tea", "beverages", "box", ["vegan"]], ["Coffee", "beverages", "bag", ["vegan"]],
];

export const groceryItems: GroceryItem[] = groceryRows.map(([name, category, defaultUnit, dietaryTags]) => ({
  id: `grocery_${seedId(name)}`,
  name,
  category,
  defaultUnit,
  tags: dietaryTags,
}));

export const seedData: SeedData = { foods, recipes, nutritionGoals, mealTemplates, groceryItems, exercises, workouts };
