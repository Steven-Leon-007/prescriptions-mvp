import { fetcher } from './fetcher';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'doctor' | 'patient' | 'admin';
  specialty?: string;
  birthDate?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return fetcher<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    return fetcher<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<void> => {
    return fetcher('/auth/logout', {
      method: 'POST',
    });
  },

  refresh: async (): Promise<AuthResponse> => {
    return fetcher<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  getProfile: async (): Promise<AuthResponse> => {
    return fetcher<AuthResponse>('/auth/profile');
  },
};
