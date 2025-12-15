'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store';
import { Button } from './Button';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-[#fffefe] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:p-3 lg:p-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo-header-nutrabiotics.png" 
                alt="Logo" 
                width={150} 
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
          
          {/* Menu */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {user?.role === 'doctor' && (
                  <>
                    <Link 
                      href="/doctor/prescriptions"
                      className="text-white hover:text-[#bc862d] transition-colors duration-200 font-medium"
                    >
                      Prescripciones
                    </Link>
                    <Link 
                      href="/doctor/prescriptions/new"
                      className="text-white hover:text-[#bc862d] transition-colors duration-200 font-medium"
                    >
                      Nueva Prescripción
                    </Link>
                  </>
                )}
                
                {user?.role === 'patient' && (
                  <Link 
                    href="/patient/prescriptions"
                    className="text-white hover:text-[#bc862d] transition-colors duration-200 font-medium"
                  >
                    Mis Prescripciones
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className="text-white hover:text-[#bc862d] transition-colors duration-200 font-medium"
                  >
                    Admin
                  </Link>
                )}
                
                <span className="text-white font-medium">
                  Hola, {user?.name}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="primary"
                  size="md"
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="md">
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
