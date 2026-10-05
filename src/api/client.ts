import * as SecureStore from "expo-secure-store";

// Expo exposes env vars prefixed EXPO_PUBLIC_ to the JS bundle directly
// (no separate config step needed) -- set these in a .env file at the
// project root, same two values the web app's own .env uses, just with
// this prefix instead of VITE_.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.kwegereza.org/api";
const LIVE_BASE_URL = process.env.EXPO_PUBLIC_LIVE_API_URL || "https://live-class.kwegereza.org/api";

export const SOCKET_URL = BASE_URL.replace(/\/api$/, "");
export const LIVE_SOCKET_URL = LIVE_BASE_URL.replace(/\/api$/, "");

const TOKEN_KEY = "kiu_token";

// expo-secure-store (iOS Keychain / Android Keystore) instead of
// AsyncStorage for the auth token specifically -- AsyncStorage is
// genuinely plain, unencrypted storage; a JWT is exactly the kind of
// thing that belongs in the OS's own secure credential store instead,
// the same reasoning that keeps it out of localStorage's own equivalent
// concerns on web.
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
};

async function request(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, headers = {}, baseUrl = BASE_URL } = options;
  const token = await getToken();
  const url = `${baseUrl}${path}`;

  if (__DEV__) console.log(`${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok || payload.success === false) {
    throw new ApiError(payload.message || "Habaye ikibazo. Ongera ugerageze.", res.status, payload);
  }

  return payload;
}

/** Multipart/form-data requests (file uploads) -- same reasoning as the
 * web client: deliberately no Content-Type set, so fetch sets it itself
 * with the correct multipart boundary for a FormData body. */
async function requestForm(
  path: string,
  options: { method?: "POST" | "PATCH"; formData: FormData; baseUrl?: string }
) {
  const { method = "POST", formData, baseUrl = BASE_URL } = options;
  const token = await getToken();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.success === false) {
    throw new ApiError(payload.message || "Habaye ikibazo. Ongera ugerageze.", res.status, payload);
  }
  return payload;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) => request(path, { method: "POST", body }),
  patch: (path: string, body?: unknown) => request(path, { method: "PATCH", body }),
  put: (path: string, body?: unknown) => request(path, { method: "PUT", body }),
  del: (path: string) => request(path, { method: "DELETE" }),
  postForm: (path: string, formData: FormData) => requestForm(path, { method: "POST", formData }),
  patchForm: (path: string, formData: FormData) => requestForm(path, { method: "PATCH", formData }),
};

/** Identical shape to `api`, pointed at the separate live-class service
 * -- same pattern as the web app's liveApi, kept as a thin wrapper
 * around the SAME request()/requestForm() rather than a second copy of
 * the error-handling logic. */
export const liveApi = {
  get: (path: string) => request(path, { baseUrl: LIVE_BASE_URL }),
  post: (path: string, body?: unknown) => request(path, { method: "POST", body, baseUrl: LIVE_BASE_URL }),
  patch: (path: string, body?: unknown) => request(path, { method: "PATCH", body, baseUrl: LIVE_BASE_URL }),
  put: (path: string, body?: unknown) => request(path, { method: "PUT", body, baseUrl: LIVE_BASE_URL }),
  del: (path: string) => request(path, { method: "DELETE", baseUrl: LIVE_BASE_URL }),
};
