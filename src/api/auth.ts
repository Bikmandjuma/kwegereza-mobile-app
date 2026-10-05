import { api } from "./client";

export type RegisterFields = {
  fullName: string;
  kunia?: string;
  ageRange: string;
  gender: "MALE" | "FEMALE";
  phone: string;
  email: string;
  location: string;
  quranReading: "KNOWS" | "TRYING" | "NONE";
  availableDays: string;
  availableHours: string;
  registrationNote?: string;
  agreedToRequirements: boolean;
  agreedToRules: boolean;
};

export function registerRequest(fields: RegisterFields) {
  return api.post("/auth/register", fields);
}

export function loginRequest(email: string, password: string) {
  return api.post("/auth/login", { email, password });
}

export function meRequest() {
  return api.get("/auth/me");
}
