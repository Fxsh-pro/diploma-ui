import { API_BASE_URL } from './config';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = undefined; }
    const err = new Error(`${res.status} ${res.statusText}`) as Error & { body?: unknown };
    err.body = body;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
};
