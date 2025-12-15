'use client';

import { GuestGuard } from '@/lib/guards';
import Image from 'next/image';
import { Input, Button } from '@/components';
import { useState } from 'react';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'doctor') {
        router.push('/doctor/prescriptions');
      } else if (user?.role === 'patient') {
        router.push('/patient/prescriptions');
      } else if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block relative w-[40%] h-full">
          <Image
            src="/nutrabiotics_login.png"
            alt="Nutrabiotics Login"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-0 right-0 w-20 h-full bg-white transform origin-top-right skew-x-[-3deg] translate-x-20"></div>
        </div>

        <div className="flex-1 bg-white flex items-center justify-center px-6 md:px-8 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/Nutrabiotics_Logo.svg"
                  alt="Nutrabiotics Logo"
                  width={40}
                  height={40}
                />
                <h1 className="text-2xl font-bold text-[#361951]">
                  Accede al universo Nutrabiotics
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Bienvenido al ecosistema NUTRABIOTICS. Un universo diseñado para ti.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#bc862d] focus:ring-[#bc862d] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
                <a href="#" className="text-sm text-[#bc862d] hover:text-[#a67628] font-medium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Iniciar sesión
              </Button>

            </form>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
};

export default LoginPage;
