const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type ApiOptions = RequestInit & { token?: string | null };

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...requestOptions } = options;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (requestOptions.headers) Object.assign(headers, requestOptions.headers);
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });
  const text = await response.text();
  let data: T & { message?: string };
  try { data = JSON.parse(text) as T & { message?: string }; } catch { data = {} as T & { message?: string }; }
  if (!response.ok) throw new Error(data.message ?? "Request failed.");
  return data;
}

export const apiConfig = { baseUrl: API_URL };
