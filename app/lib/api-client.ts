// lib/api-client.ts
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  const trimmed = raw.replace(/\/+$/, "");

  if (/\/api\/v\d+$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
}

export type TokenGetter = () => Promise<string | null>;

export const fetcher = async (
  url: string,
  options: RequestInit = {},
  getToken?: TokenGetter,
) => {
  const token = getToken ? await getToken() : null;
  const headers = new Headers(options.headers ?? undefined);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    // Keep cookies for any backend flows that still rely on them.
    credentials: "include",
    headers,
  });
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function getApiErrorMessage(
  res: Response,
  fallbackMessage: string,
): Promise<string> {
  const unauthorizedDefault =
    res.status === 401
      ? "Please sign in to continue"
      : res.status === 403
        ? "You are not allowed to perform this action"
        : fallbackMessage;

  try {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await res.json();
      const message =
        payload?.message ||
        payload?.error?.message ||
        payload?.error ||
        payload?.detail;

      if (typeof message === "string" && message.trim()) {
        return message;
      }
    } else {
      const text = await res.text();
      if (text.trim()) {
        return text;
      }
    }
  } catch {
    // Ignore parse issues and fallback to status-based defaults.
  }

  return unauthorizedDefault;
}

export async function throwApiError(
  res: Response,
  fallbackMessage: string,
): Promise<void> {
  if (res.ok) return;
  const message = await getApiErrorMessage(res, fallbackMessage);
  throw new ApiError(message, res.status);
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}