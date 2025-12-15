import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../guards';
import { useAuthStore } from '@/store';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store', () => ({
  useAuthStore: jest.fn(),
}));

describe('AuthGuard', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe('Cuando está cargando', () => {
    it('debe mostrar un mensaje de carga', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Cuando el usuario no está autenticado', () => {
    it('debe redirigir a la página de login', async () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('no debe renderizar el contenido protegido', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Cuando el usuario está autenticado', () => {
    it('debe mostrar el contenido protegido sin restricción de rol', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'test@test.com', name: 'Test User', role: 'doctor' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('debe mostrar el contenido si el rol coincide', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('debe redirigir a home si el rol no coincide', async () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'doctor@test.com', name: 'Doctor', role: 'doctor' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Protección por roles específicos', () => {
    it('debe permitir acceso al admin con requiredRole="admin"', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Dashboard</div>
        </AuthGuard>
      );

      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('debe permitir acceso al doctor con requiredRole="doctor"', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '2', email: 'doctor@test.com', name: 'Doctor', role: 'doctor' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="doctor">
          <div>Doctor Panel</div>
        </AuthGuard>
      );

      expect(screen.getByText('Doctor Panel')).toBeInTheDocument();
    });

    it('debe permitir acceso al paciente con requiredRole="patient"', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '3', email: 'patient@test.com', name: 'Patient', role: 'patient' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="patient">
          <div>Patient Portal</div>
        </AuthGuard>
      );

      expect(screen.getByText('Patient Portal')).toBeInTheDocument();
    });

    it('debe bloquear al paciente intentando acceder a área de doctor', async () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '3', email: 'patient@test.com', name: 'Patient', role: 'patient' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <AuthGuard requiredRole="doctor">
          <div>Doctor Panel</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      expect(screen.queryByText('Doctor Panel')).not.toBeInTheDocument();
    });
  });
});
