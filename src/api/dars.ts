import { api } from "./client";

export function getPublishedDarsat(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/dars/published${qs ? `?${qs}` : ""}`);
}

export function trackDarsPlay(id: string, watchSeconds?: number) {
  return api.post(`/dars/${id}/play`, watchSeconds != null ? { watchSeconds } : {});
}
