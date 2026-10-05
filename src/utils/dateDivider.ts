// Ported verbatim from the web app's src/utils/dateDivider.js -- same
// WhatsApp-style Today/Yesterday/day-name/date pattern, so a long
// thread reads identically on both platforms.
const DAY_NAMES = ["Ku cyumweru", "Kuwa mbere", "Kuwa kabiri", "Kuwa gatatu", "Kuwa kane", "Kuwa gatanu", "Kuwa gatandatu"];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateDividerLabel(dateInput: string | number | Date): string {
  const date = startOfDay(new Date(dateInput));
  const today = startOfDay(new Date());
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return "Uyu munsi";
  if (diffDays === 1) return "Ejo";
  if (diffDays > 1 && diffDays < 7) return DAY_NAMES[date.getDay()];
  if (diffDays >= 7 && diffDays < 14) return "Icyumweru gishize";
  return date.toLocaleDateString("rw-RW", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function isNewDay(current: string | number | Date, previous?: string | number | Date | null): boolean {
  if (!previous) return true;
  return startOfDay(new Date(current)).getTime() !== startOfDay(new Date(previous)).getTime();
}
