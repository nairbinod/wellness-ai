import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/jsonld";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/auth/callback"],
      },
      // Explicitly allow known AI agent / assistant crawlers rather than
      // relying on the wildcard rule — this is an agent-discovery product
      // first, so intent matters more than the default here.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
