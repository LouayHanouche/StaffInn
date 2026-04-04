const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
let accessToken = null;
export const tokenStore = {
    get: () => accessToken,
    set: (token) => {
        accessToken = token;
    },
};
export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
const request = async (path, init = {}) => {
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
        throw new ApiError(response.status, payload.message ?? 'Request failed');
    }
    if (response.status === 204) {
        return undefined;
    }
    return (await response.json());
};
export const api = {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
export const uploadCv = async (file) => {
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
        throw new ApiError(response.status, payload.message ?? 'Upload failed');
    }
    return (await response.json());
};
