import { fetcher } from './fetcher';

interface MetricsResponse {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: Array<{
    date: string;
    count: number;
  }>;
  topDoctors: Array<{
    doctorId: string;
    doctorName: string;
    doctorEmail: string;
    specialty?: string | null;
    count: number;
  }>;
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  specialty?: string;
  birthDate?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  createdAt: string;
  doctor?: {
    id: string;
    specialty?: string | null;
  };
  patient?: {
    id: string;
    birthDate?: string | null;
  };
}

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminService = {
  getMetrics: async (from?: string, to?: string): Promise<MetricsResponse> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    return fetcher<MetricsResponse>(
      `/api/admin/metrics${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    return fetcher<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: 'admin' | 'doctor' | 'patient';
    query?: string;
  }): Promise<UsersResponse> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    
    return fetcher<UsersResponse>(
      `/api/users${queryString ? `?${queryString}` : ''}`
    );
  },
};
