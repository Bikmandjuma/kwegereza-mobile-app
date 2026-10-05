// Ported verbatim from the web app's src/utils/timeAgo.js -- same
// wording, same thresholds, so a message's timestamp reads identically
// whether someone's on the website or this app.
export function timeAgo(dateInput: string | number | Date): string {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return date.toLocaleDateString();
  if (seconds < 60) return "vuba (ubu)";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `iminota ${minutes} irashize`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `amasaha ${hours} arashize`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `iminsi ${days} irashize`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `ibyumweru ${weeks} birashize`;
  const months = Math.floor(days / 30);
  if (months < 12) return `amezi ${months} arashize`;
  return date.toLocaleDateString();
}
