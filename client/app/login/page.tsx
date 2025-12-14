'use client';

import { GuestGuard } from '@/lib/guards';

const LoginPage = () => {
  return (
    <GuestGuard>
      <div>
        <h1>Iniciar Sesión</h1>
        {/* Formulario de login */}
      </div>
    </GuestGuard>
  );
};

export default LoginPage;
