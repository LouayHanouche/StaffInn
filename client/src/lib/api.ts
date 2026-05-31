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

const buildHeaders = (headersInit?: HeadersInit): Headers => {
  const headers = new Headers(headersInit);
  const token = tokenStore.get();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

const toApiError = async (response: Response, fallbackMessage: string): Promise<ApiError> => {
  const payload = await response.json().catch(() => ({ message: fallbackMessage }));
  const message =
    typeof payload === 'object' &&
    payload &&
    'message' in payload &&
    typeof payload.message === 'string'
      ? payload.message
      : fallbackMessage;
  const details =
    typeof payload === 'object' && payload && 'errors' in payload ? payload.errors : undefined;

  return new ApiError(response.status, message, details);
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = buildHeaders(init.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw await toApiError(response, 'Request failed');
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

export const openProtectedCv = async (cvPath: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/files/cv/${cvPath}`, {
    method: 'GET',
    credentials: 'include',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response, 'CV download failed');
  }

  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  const contentType = response.headers.get('content-type') ?? fileBlob.type;
  const isPdf = contentType.toLowerCase().includes('pdf') || cvPath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = cvPath;
      link.rel = 'noopener noreferrer';
      link.click();
    }
  } else {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = cvPath;
    link.rel = 'noopener noreferrer';
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export const deleteCandidateCv = async (): Promise<void> => {
  await api.delete('/candidates/profile/cv');
};

export const uploadCv = async (file: File): Promise<{ profile: unknown }> => {
  const formData = new FormData();
  formData.append('cv', file);

  const headers = buildHeaders();

  const response = await fetch(`${apiBaseUrl}/candidates/profile/cv`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw await toApiError(response, 'Upload failed');
  }

  return (await response.json()) as { profile: unknown };
};
