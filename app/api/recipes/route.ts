import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin-core";
import type { Recipe } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80).toLowerCase();
    const snapshot = await getAdminFirestore().collection("recipes").get();
    const recipes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Recipe[];
    const filtered = recipes.filter((recipe) => !query
      || `${recipe.name} ${recipe.description} ${recipe.cuisine} ${recipe.tags.join(" ")}`.toLowerCase().includes(query));
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Unable to load recipes." }, { status: 500 });
  }
}
