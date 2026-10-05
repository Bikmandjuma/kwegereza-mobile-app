import { api } from "./client";

export function getPublishedBooks(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/books/published${qs ? `?${qs}` : ""}`);
}

export function trackBookDownload(id: string) {
  return api.post(`/books/${id}/download`, {});
}

export function trackBookView(id: string) {
  return api.post(`/books/${id}/view`, {});
}
