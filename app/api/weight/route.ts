import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
const validId = (id: string | null) => Boolean(id && /^[A-Za-z0-9_-]{1,150}$/.test(id));

export async function GET() {
  try {
    const { userId, db } = await requireUser();
    const snapshot = await db.collection("users").doc(userId).collection("weightLogs").orderBy("loggedAt", "desc").limit(100).get();
    return NextResponse.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { weight?: unknown; unit?: unknown };
    const weight = typeof body.weight === "number" ? body.weight : Number(body.weight);
    if (!Number.isFinite(weight) || weight < 1 || weight > 1000 || (body.unit !== "kg" && body.unit !== "lb")) return NextResponse.json({ message: "Enter a valid weight and unit." }, { status: 400 });
    const log = { userId, weight, unit: body.unit, loggedAt: new Date().toISOString() };
    const ref = await db.collection("users").doc(userId).collection("weightLogs").add(log);
    return NextResponse.json({ id: ref.id, ...log }, { status: 201 });
  } catch (error) {
    const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!validId(id) || !id) return NextResponse.json({ message: "A valid weight entry ID is required." }, { status: 400 });
    const ref = db.collection("users").doc(userId).collection("weightLogs").doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ message: "Weight entry not found." }, { status: 404 });
    await ref.delete(); return NextResponse.json({ deleted: true });
  } catch (error) {
    const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
