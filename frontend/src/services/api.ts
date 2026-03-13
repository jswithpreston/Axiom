// =============================================================================
// Axiom Frontend — Base API Configuration
// =============================================================================

const BASE_URL = "/api";

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({
      message: response.statusText,
    }));
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as Record<string, unknown>).message)
        : response.statusText;
    throw new ApiError(response.status, message);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

export function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(endpoint: string): Promise<void> {
  return apiFetch<void>(endpoint, { method: "DELETE" });
}

export { apiFetch, ApiError, BASE_URL };
