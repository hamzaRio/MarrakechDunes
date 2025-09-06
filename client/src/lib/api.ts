import { API_URL } from "./env";

export function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options
  });
}
