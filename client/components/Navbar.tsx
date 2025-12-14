'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">Prescriptions MVP</Link>
      </div>
      
      <div className="navbar-menu">
        {isAuthenticated ? (
          <>
            {user?.role === 'doctor' && (
              <>
                <Link href="/doctor/prescriptions">Prescripciones</Link>
                <Link href="/doctor/prescriptions/new">Nueva Prescripción</Link>
              </>
            )}
            
            {user?.role === 'patient' && (
              <Link href="/patient/prescriptions">Mis Prescripciones</Link>
            )}
            
            {user?.role === 'admin' && (
              <Link href="/admin">Admin</Link>
            )}
            
            <span>Hola, {user?.name}</span>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </>
        ) : (
          <Link href="/login">Iniciar Sesión</Link>
        )}
      </div>
    </nav>
  );
};
