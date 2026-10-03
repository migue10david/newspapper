import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthNavbar } from "@/components/auth/auth-navbar";
import { PublicQueryProvider } from "@/components/providers/public-query-provider";
import { api, type SiteSettings } from "@/lib/api";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fallbackSettings: SiteSettings = {
  siteName: "Periódico",
  description: "Periódico digital de noticias",
  logoUrl: null,
};

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await api.getSettings();
  } catch {
    return fallbackSettings;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings.siteName,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.description,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-surface/95 backdrop-blur-md">
          <nav aria-label="Navegación principal" className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="group flex min-w-0 items-center gap-3 text-lg font-bold tracking-tight">
              {settings.logoUrl ? (
                <span
                  aria-label={`${settings.siteName} logo`}
                  className="h-9 w-9 rounded-full border border-border bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${settings.logoUrl})` }}
                />
              ) : null}
              <span className="truncate font-display-editorial text-xl group-hover:text-brand sm:text-2xl">{settings.siteName}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
              <Link href="/" className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-semibold transition-colors hover:bg-surface-muted hover:text-brand">
                Portada
              </Link>
              <Link href="/buscar" className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-semibold transition-colors hover:bg-surface-muted hover:text-brand">
                Buscar
              </Link>
              <AuthNavbar />
            </div>
          </nav>
        </header>
        <PublicQueryProvider>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            {children}
          </main>
        </PublicQueryProvider>
        <footer className="border-t border-border bg-surface-muted">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p className="font-display-editorial text-lg font-bold text-foreground">{settings.siteName}</p>
            <p>{settings.description}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
