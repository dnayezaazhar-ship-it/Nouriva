import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { getEntitlement } from "@/lib/entitlements";

export async function GET() {
  try { const { userId, db } = await requireUser({ allowExpired: true }); return NextResponse.json(await getEntitlement(db, userId)); }
  catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}
