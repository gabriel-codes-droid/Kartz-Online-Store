// api.ts - axios instance with JWT interceptor and typed helpers.
/// <reference types="vite/client" />
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { User } from './types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const TOKEN_KEY = 'kartz_token';

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(t: string): void {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore quota / privacy-mode errors
  }
}

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    // Axios v1 narrowed headers type — cast to allow custom Authorization.
    (config.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return config;
});

// Public helper that calls protected routes when token is set.
export async function fetchMe(): Promise<User | null> {
  const t = getToken();
  if (!t) return null;
  try {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  } catch {
    setToken('');
    return null;
  }
}

// Convenience wrapper for the multipart upload endpoint.
export interface UploadImageResponse {
  url: string;
  filename: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('image', file);
  const cfg: AxiosRequestConfig = {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: () => {
      // intentionally no-op; pages can supply their own progress via axios events
    },
  };
  const { data } = await api.post<UploadImageResponse>('/upload/image', form, cfg);
  return data;
}

export default api;
