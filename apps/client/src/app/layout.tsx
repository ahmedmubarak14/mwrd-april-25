import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import "@mwrd/ui/globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MWRD · مورد",
    template: "%s · MWRD",
  },
  description: "Smart procurement for Saudi enterprises",
  openGraph: {
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024 }],
    siteName: "MWRD",
  },
};

/**
 * Root layout — owns <html> and <body> as required by Next.js 15+.
 * lang/dir/body-className are stamped at runtime by <LocaleAttributes> in the
 * locale layout so each locale gets the correct values without nested <html>.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${ibmPlexArabic.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
