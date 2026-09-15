export const plans = {
  free: { id: "free", name: "Free", price: 0, interval: "forever", features: ["Food library and logging", "Daily nutrition picture", "Basic meal planning"] },
  plus: { id: "plus", name: "Nouriva+", price: 9, interval: "month", features: ["Everything in Free", "Personalized AI coach", "Deeper reports and trends", "Unlimited meal plans"] },
  together: { id: "together", name: "Together", price: 16, interval: "month", features: ["Up to 4 profiles", "Shared grocery lists", "Family-friendly plans"] },
} as const;

export type PlanId = keyof typeof plans;
