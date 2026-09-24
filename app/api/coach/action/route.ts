import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";

export async function PATCH(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { messageId?: unknown; status?: unknown };
    if (typeof body.messageId !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(body.messageId) || (body.status !== "logged" && body.status !== "declined")) {
      return NextResponse.json({ message: "That coach action is invalid." }, { status: 400 });
    }
    const ref = db.collection("users").doc(userId).collection("coachMessages").doc(body.messageId);
    const snapshot = await ref.get();
    const data = snapshot.data();
    if (!snapshot.exists || data?.role !== "coach" || !data.analysis) {
      return NextResponse.json({ message: "That coach analysis could not be found." }, { status: 404 });
    }
    if (data.analysis.actionStatus) return NextResponse.json({ actionStatus: data.analysis.actionStatus });
    if (data.analysis.logged) return NextResponse.json({ actionStatus: "logged" });
    await ref.update({ "analysis.actionStatus": body.status, ...(body.status === "logged" ? { "analysis.logged": true } : {}) });
    return NextResponse.json({ actionStatus: body.status });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
