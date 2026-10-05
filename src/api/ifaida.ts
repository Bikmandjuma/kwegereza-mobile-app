import { api } from "./client";

export function listPublishedIfaida(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/ifaida/published${qs ? `?${qs}` : ""}`);
}

export function getPublishedIfaida(id: string) {
  return api.get(`/ifaida/published/${id}`);
}
