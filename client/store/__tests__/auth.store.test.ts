import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../auth.store';

jest.mock('@/lib/auth', () => ({
    authService: {
        login: jest.fn(),
        logout: jest.fn(),
        getProfile: jest.fn(),
        refresh: jest.fn(),
    },
}));

describe('useAuthStore', () => {
    beforeEach(() => {
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        jest.clearAllMocks();
    });

    describe('Estado inicial', () => {
        it('debe tener valores por defecto correctos', () => {
            const { result } = renderHook(() => useAuthStore());

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(typeof result.current.isLoading).toBe('boolean');
        });
    });

    describe('setUser', () => {
        it('debe establecer el usuario y marcar como autenticado', () => {
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'doctor' as const,
            };

            act(() => {
                result.current.setUser(mockUser);
            });

            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('clearAuth', () => {
        it('debe limpiar el estado de autenticación', () => {
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'admin' as const,
            };

            act(() => {
                result.current.setUser(mockUser);
            });

            expect(result.current.isAuthenticated).toBe(true);

            act(() => {
                result.current.clearAuth();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('login', () => {
        it('debe llamar al servicio de login y establecer el usuario', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'doctor@test.com',
                name: 'Dr. Test',
                role: 'doctor',
            };

            authService.login.mockResolvedValue({
                user: mockUser,
                accessToken: 'mock-token',
            });

            await act(async () => {
                await result.current.login('doctor@test.com', 'password123');
            });

            expect(authService.login).toHaveBeenCalledWith({
                email: 'doctor@test.com',
                password: 'password123',
            });
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('debe manejar errores en el login', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            authService.login.mockRejectedValue(new Error('Login failed'));

            await expect(
                act(async () => {
                    await result.current.login('invalid@test.com', 'wrongpassword');
                })
            ).rejects.toThrow('Login failed');

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('logout', () => {
        it('debe llamar al servicio de logout y limpiar el estado', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'patient' as const,
            };

            act(() => {
                result.current.setUser(mockUser);
            });

            expect(result.current.isAuthenticated).toBe(true);

            authService.logout.mockResolvedValue(undefined);

            await act(async () => {
                await result.current.logout();
            });

            expect(authService.logout).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('checkAuth', () => {
        it('debe verificar la autenticación y establecer el usuario si existe', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'admin@test.com',
                name: 'Admin User',
                role: 'admin',
            };

            authService.getProfile.mockResolvedValue({ user: mockUser });

            await act(async () => {
                await result.current.checkAuth();
            });

            expect(authService.getProfile).toHaveBeenCalled();
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });

        it('debe intentar refresh si getProfile falla', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                email: 'admin@test.com',
                name: 'Admin User',
                role: 'admin',
            };

            authService.getProfile.mockRejectedValue(new Error('Token expired'));
            authService.refresh.mockResolvedValue({ user: mockUser });

            await act(async () => {
                await result.current.checkAuth();
            });

            expect(authService.getProfile).toHaveBeenCalled();
            expect(authService.refresh).toHaveBeenCalled();
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('debe limpiar el estado si getProfile y refresh fallan', async () => {
            const { authService } = require('@/lib/auth');
            const { result } = renderHook(() => useAuthStore());

            authService.getProfile.mockRejectedValue(new Error('Not authenticated'));
            authService.refresh.mockRejectedValue(new Error('Refresh failed'));

            await act(async () => {
                await result.current.checkAuth();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
