import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  return userId ? <AppShell>{children}</AppShell> : children;
}
