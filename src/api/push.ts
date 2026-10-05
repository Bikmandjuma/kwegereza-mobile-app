import { api } from "./client";

export function registerExpoPushToken(token: string) {
  return api.post("/push/expo-register", { token });
}

export function unregisterExpoPushToken(token: string) {
  return api.post("/push/expo-unregister", { token });
}
