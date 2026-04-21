import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homebase",
  description: "Personal Home & Finance Command Center",
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
      <body>{children}</body>
    </html>
  );
}
