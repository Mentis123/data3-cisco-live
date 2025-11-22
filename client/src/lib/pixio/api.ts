/**
 * Pixio API Client
 * Uses the existing infrastructure (fetch + credentials: include)
 * but provides a clean interface for Pixio-specific endpoints
 */

interface ApiError {
  message: string;
  status: number;
}

class PixioApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PixioApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new PixioApiError(`${response.status}: ${text}`, response.status);
  }

  return response.json();
}

/**
 * Core API request function
 * Reuses the existing pattern from queryClient.ts
 */
export async function pixioRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: unknown
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: data ? { 'Content-Type': 'application/json' } : {},
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return handleResponse<T>(response);
}

// Convenience methods
export const pixioApi = {
  get: <T = any>(endpoint: string) =>
    pixioRequest<T>('GET', endpoint),

  post: <T = any>(endpoint: string, data?: unknown) =>
    pixioRequest<T>('POST', endpoint, data),

  put: <T = any>(endpoint: string, data?: unknown) =>
    pixioRequest<T>('PUT', endpoint, data),

  patch: <T = any>(endpoint: string, data?: unknown) =>
    pixioRequest<T>('PATCH', endpoint, data),

  delete: <T = any>(endpoint: string) =>
    pixioRequest<T>('DELETE', endpoint),
};

// Type-safe endpoint builders
export const endpoints = {
  // Add your API endpoints here
  health: () => '/api/health',
  users: {
    me: () => '/api/users/me',
    byId: (id: string) => `/api/users/${id}`,
  },
  // Add more as needed
};
