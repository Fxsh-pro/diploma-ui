import { http } from './client';
import type { LoginResponse } from './types';

export const authApi = {
  login: (username: string, password: string) =>
    http.post<LoginResponse>('/api/auth/login', { username, password }),
};
