import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin-core";
import type { Food, FoodCategory } from "@/types";
import { foodCategory, seedData } from "@/seed/data";

const categories: FoodCategory[] = ["Pakistani / Desi", "Indian", "Chinese", "Middle Eastern", "Mediterranean", "Western / Continental", "Japanese", "Korean", "Mexican", "Fruits", "Vegetables", "Grains", "Snacks", "Beverages"];

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim().slice(0, 80).toLowerCase();
    const category = params.get("category");
    const cuisine = (params.get("cuisine") ?? "").trim().slice(0, 80).toLowerCase();
    if (category && !categories.includes(category as FoodCategory)) {
      return NextResponse.json({ message: "Invalid food category." }, { status: 400 });
    }
    const snapshot = await getAdminFirestore().collection("foods").get();
    const foods = (snapshot.empty ? seedData.foods : snapshot.docs.map((doc) => {
      const data = doc.data() as Partial<Food> & { category?: string; cuisine?: string };
      return { id: doc.id, ...data, category: foodCategory(data.category ?? "", data.cuisine ?? "") };
    })) as Food[];
    const filtered = foods.filter((food) => {
      const searchable = `${food.name} ${food.cuisine} ${(food.tags ?? []).join(" ")}`.toLowerCase();
      return (!query || searchable.includes(query))
        && (!category || food.category === category)
        && (!cuisine || food.cuisine.toLowerCase() === cuisine);
    });
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Unable to load the food library." }, { status: 500 });
  }
}
