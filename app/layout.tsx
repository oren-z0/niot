import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Next JS SaaS Starter Template",
  description: "Next JS SaaS Starter Template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta property="og:title" content="nIoT.space" />
        <meta property="og:description" content="Tools for connecting IoT to Nostr." />
        <meta property="og:image" content="https://niot.space/images/avatar.png" />
        <meta property="og:url" content="https://niot.space" />
        <meta property="og:type" content="website" />
      </head>
      <body className="bg-white dark:bg-black min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
