export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly details: unknown;

  public constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = tokenStore.get();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    const message =
      typeof payload === 'object' &&
      payload &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Request failed';
    const details =
      typeof payload === 'object' && payload && 'errors' in payload ? payload.errors : undefined;
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};

export const uploadCv = async (file: File): Promise<{ profile: unknown }> => {
  const formData = new FormData();
  formData.append('cv', file);

  const token = tokenStore.get();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}/candidates/profile/cv`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
    const message =
      typeof payload === 'object' &&
      payload &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Upload failed';
    const details =
      typeof payload === 'object' && payload && 'errors' in payload ? payload.errors : undefined;
    throw new ApiError(response.status, message, details);
  }

  return (await response.json()) as { profile: unknown };
};
