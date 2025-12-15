import { fetcher } from './fetcher';
import { Prescription } from '@/types';

interface PrescriptionsResponse {
  data: Prescription[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface QueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'consumed';
  from?: string;
  to?: string;
  order?: string;
}

interface Patient {
  id: string;
  userId: string;
  birthDate?: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface PatientsResponse {
  data: Patient[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const prescriptionsService = {
  getMyPrescriptions: async (params?: QueryParams): Promise<PrescriptionsResponse> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    return fetcher<PrescriptionsResponse>(
      `/api/me/prescriptions${queryString ? `?${queryString}` : ''}`
    );
  },

  getPrescription: async (id: string): Promise<Prescription> => {
    return fetcher<Prescription>(`/api/me/prescriptions/${id}`);
  },

  consumePrescription: async (id: string): Promise<Prescription> => {
    return fetcher<Prescription>(`/api/prescriptions/${id}/consume`, {
      method: 'PATCH',
    });
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/prescriptions/${id}/pdf`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Error al descargar el PDF');
    }

    return response.blob();
  },

  getDoctorPrescriptions: async (params?: QueryParams & { mine?: string }): Promise<PrescriptionsResponse> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    return fetcher<PrescriptionsResponse>(
      `/api/prescriptions${queryString ? `?${queryString}` : ''}`
    );
  },

  getDoctorPrescription: async (id: string): Promise<Prescription> => {
    return fetcher<Prescription>(`/api/prescriptions/${id}`);
  },

  createPrescription: async (data: {
    patientId: string;
    notes?: string;
    items: Array<{
      name: string;
      dosage?: string;
      quantity?: number;
      instructions?: string;
    }>;
  }): Promise<Prescription> => {
    return fetcher<Prescription>('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPatients: async (page = 1, limit = 100): Promise<PatientsResponse> => {
    return fetcher<PatientsResponse>(`/api/patients?page=${page}&limit=${limit}`);
  },
};
