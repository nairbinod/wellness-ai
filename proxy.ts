import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Same crawlers explicitly allowed in robots.ts — logged separately from
// regular traffic (which Vercel Analytics already covers) so agent/crawler
// volume is a real, queryable number instead of just an architectural claim.
const BOT_PATTERNS: Record<string, RegExp> = {
  GPTBot: /GPTBot/i,
  "ChatGPT-User": /ChatGPT-User/i,
  ClaudeBot: /ClaudeBot/i,
  "Claude-User": /Claude-User/i,
  "anthropic-ai": /anthropic-ai/i,
  PerplexityBot: /PerplexityBot/i,
  "Google-Extended": /Google-Extended/i,
  Googlebot: /Googlebot/i,
  Bingbot: /bingbot/i,
};

function matchBot(userAgent: string) {
  for (const [name, pattern] of Object.entries(BOT_PATTERNS)) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const botName = matchBot(userAgent);

  if (botName) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      // Fire-and-forget via waitUntil — never delays the actual response,
      // and a failed log write shouldn't affect the page load either way.
      event.waitUntil(
        fetch(`${url}/rest/v1/agent_traffic_log`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bot_name: botName,
            path: request.nextUrl.pathname,
            user_agent: userAgent,
          }),
        }).catch(() => {})
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
