import { Suspense } from "react";
import { LoginClient } from "@/components/auth/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
