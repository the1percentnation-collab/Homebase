"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "./auth-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const BARE_ROUTES = ["/login", "/signup"];

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auth pages skip the shell chrome (no sidebar/topbar) so login/signup
  // feel like standalone screens.
  if (isBareRoute(pathname)) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
