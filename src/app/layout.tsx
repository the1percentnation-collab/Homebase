import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homebase",
  description: "Personal Home & Finance Command Center",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var t = localStorage.getItem('theme');
                  var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (t === 'dark' || (!t && m)) document.documentElement.classList.add('dark');
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
