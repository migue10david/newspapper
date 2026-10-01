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
        <header className="border-b border-border bg-surface">
          <nav className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-3 text-lg font-bold tracking-tight">
              {settings.logoUrl ? (
                <span
                  aria-label={`${settings.siteName} logo`}
                  className="h-9 w-9 rounded-full border border-border bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${settings.logoUrl})` }}
                />
              ) : null}
              <span className="font-display-editorial text-xl group-hover:text-brand">{settings.siteName}</span>
            </Link>
            <div className="flex items-center gap-2 text-sm sm:gap-4">
              <Link href="/" className="inline-flex min-h-11 items-center px-2 font-semibold hover:text-brand">
                Portada
              </Link>
              <Link href="/buscar" className="inline-flex min-h-11 items-center px-2 font-semibold hover:text-brand">
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
