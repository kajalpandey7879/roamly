import { env } from '@/shared/config/env';

interface ApiErrorBody {
  detail?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as ApiErrorBody);
    throw new ApiError(body.detail ?? 'Something went wrong', response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
