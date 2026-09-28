import { Platform } from "react-native";

const envUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export const API_URL =
  envUrl || (Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000");

export class ApiError extends Error {
  constructor(message, extras = {}) {
    super(message);
    this.name = "ApiError";
    this.status = extras.status;
    this.code = extras.code;
    this.fields = extras.fields ?? null;
    this.retryAfterSeconds = extras.retryAfterSeconds;
  }
}

export async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("We could not reach the server. Check that the API is running, then try again.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(json?.error?.message || "Something went wrong. Please try again.", {
      status: response.status,
      code: json?.error?.code,
      fields: json?.error?.fields,
      retryAfterSeconds: json?.error?.retryAfterSeconds,
    });
  }
  return json;
}
