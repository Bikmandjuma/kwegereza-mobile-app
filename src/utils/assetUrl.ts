// Ported from the web app's src/utils/assetUrl.js: every uploaded file
// (book PDFs/covers, dars audio/thumbnails) comes back from the backend
// as a path relative to the API's own origin, not wherever this app is
// running from -- on a phone, that's never the same origin, so this is
// not optional the way it might look like it is in local dev.
const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");

export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
