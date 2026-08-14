import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_NAME, siteUrl } from "@/lib/jsonld";
import { Footer } from "@/components/footer";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl("")),
  title: {
    default: `${SITE_NAME} — Local Wellness & Aesthetics Directory`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Find med spas, IV therapy, and men's health clinics near you. Real pricing, verified listings, and agent-friendly data.",
  // Deliberately no title/description/images here — Next.js falls back to
  // the page's own resolved title/description for these automatically, so
  // every page gets correct link-preview text without repeating it.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
