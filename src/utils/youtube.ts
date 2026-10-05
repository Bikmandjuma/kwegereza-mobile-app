// Ported verbatim from the web app's src/utils/youtube.js.
export function youtubeVideoId(url?: string | null): string | null {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}
