const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.18.98:3000").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15000;

export type ApiOptions = RequestInit & { token?: string | null };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (requestOptions.headers) Object.assign(headers, requestOptions.headers);
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers, signal: controller.signal });
    const text = await response.text();
    let data: T & { message?: string };
    try {
      data = JSON.parse(text) as T & { message?: string };
    } catch {
      data = {} as T & { message?: string };
    }
    if (!response.ok) throw new ApiError(data.message ?? "Request failed.", response.status);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((error instanceof Error && error.name === "AbortError") || /fetch request has been canceled|network request failed|failed to fetch/i.test(message)) {
      throw new Error(`Unable to reach Nouriva at ${API_URL}. Start the web server and confirm this address is reachable from the phone.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiConfig = { baseUrl: API_URL };
