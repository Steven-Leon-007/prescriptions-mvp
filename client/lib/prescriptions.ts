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
};
