import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-boot";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// tight grotesk for public page headings
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-inter-tight" });

export const metadata: Metadata = {
  title: {
    default: "CUTM Awarding Body",
    template: "%s · CUTM Awarding Body",
  },
  description: "Skill assessment and certification portal of the CUTM Awarding Body.",
};

// form controls follow the page theme (set through CSS color-scheme), not the OS setting
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the boot script may add .dark before React hydrates
    <html lang="en" className={cn("h-full antialiased", inter.variable, interTight.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
