"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_PREFIXES = ["/login", "/signup"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/**
 * In cloud mode, redirect unauthenticated users to /login. In local mode,
 * no-op. Public routes (/login, /signup) always render.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isCloudMode, user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (!isCloudMode) return;
    if (loading) return;
    if (!user && !publicRoute) {
      const dest = `/login?next=${encodeURIComponent(pathname)}`;
      router.replace(dest);
    }
  }, [isCloudMode, loading, user, publicRoute, pathname, router]);

  if (!isCloudMode) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user && !publicRoute) {
    // Brief gap before redirect fires
    return null;
  }
  return <>{children}</>;
}
