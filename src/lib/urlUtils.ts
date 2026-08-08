/**
 * URL utilities for the embedded web projector.
 *
 * Google's pages cannot render inside the sandboxed proxy iframe: Google
 * requires JavaScript execution to build search results and blocks
 * non-browser clients, so a server-side fetch only returns a blank
 * "JavaScript required" shell (title "Google Search", no results). We
 * transparently route those URLs through DuckDuckGo's server-rendered HTML
 * search, which loads real, clickable results inside the proxy and works
 * reliably with the click/form interceptor script.
 */
export function toEmbeddableSearchUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    // Google's root search hosts (google.com, google.co.in, google.de, ...).
    // Subdomains like maps.google.com / accounts.google.com are left alone:
    // maps has a dedicated embed renderer, and accounts is an auth flow.
    const isGoogleRootHost =
      host === "google.com" || /^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
    if (isGoogleRootHost) {
      const isMapsPath = parsed.pathname.startsWith("/maps");
      if (!isMapsPath) {
        const isSearchPath =
          parsed.pathname === "/search" ||
          parsed.pathname.startsWith("/search/");
        if (isSearchPath) {
          const q = parsed.searchParams.get("q");
          if (q && q.trim()) {
            return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q.trim())}`;
          }
        }
        // Google's homepage and other non-maps pages can't render inside the
        // sandbox proxy (JS-required shell / frame-blocking), so land on
        // DuckDuckGo's server-rendered HTML search start page instead.
        return "https://html.duckduckgo.com/html/";
      }
    }
  } catch {
    // Not a parseable URL — leave unchanged.
  }
  return rawUrl;
}
