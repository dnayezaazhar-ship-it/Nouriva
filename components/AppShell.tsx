"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const navigation = [
  ["dashboard", "Overview", "⌂"],
  ["foods", "Food library", "◌"],
  ["log", "Log a meal", "+"],
  ["planner", "Meal planner", "▦"],
  ["progress", "Progress", "↗"],
  ["grocery", "Grocery list", "□"],
  ["reports", "Reports", "◒"],
  ["coach", "AI coach", "✦"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="app-layout">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><span className="brand-mark">N</span> nouriva</Link>
      <p className="side-label">Your space</p>
      <nav>{navigation.map(([path, label, icon]) => <Link key={path} href={`/${path}`} className={pathname.startsWith(`/${path}`) ? "active" : ""}><span>{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/pricing" className="upgrade-card"><span>✦</span><b>Go further</b><small>Unlock your full picture →</small></Link><Link href="/onboarding" className="profile-link">⚙ <span>Preferences</span></Link><div className="user-row"><UserButton afterSignOutUrl="/" /><span>Your account</span></div></div>
    </aside>
    <main className="app-main"><div className="mobile-top"><Link href="/dashboard" className="brand"><span className="brand-mark">N</span> nouriva</Link><UserButton /></div>{children}</main>
  </div>;
}
