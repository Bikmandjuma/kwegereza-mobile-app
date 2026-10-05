import { liveApi } from "./client";

export function createLiveClass(title: string, scheduledFor?: string | null) {
  return liveApi.post("/live-classes", scheduledFor ? { title, scheduledFor } : { title });
}

export function listActiveLiveClasses() {
  return liveApi.get("/live-classes/active");
}

export function listUpcomingLiveClasses() {
  return liveApi.get("/live-classes/upcoming");
}

export function startScheduledLiveClass(id: string) {
  return liveApi.post(`/live-classes/${id}/start`);
}

export function endLiveClass(id: string) {
  return liveApi.post(`/live-classes/${id}/end`);
}
