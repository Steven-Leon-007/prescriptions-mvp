'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

const HomePage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'doctor':
          router.push('/doctor/prescriptions');
          break;
        case 'patient':
          router.push('/patient/prescriptions');
          break;
        case 'admin':
          router.push('/admin');
          break;
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/bienestar-nutrabiotics.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-6">
          Bienestar para<br />latinoamérica
        </h1>
        
        <p className="text-white text-lg md:text-xl lg:text-2xl text-center max-w-3xl leading-relaxed">
          Con fórmulas, servicios y conocimientos en<br />
          Medicina Funcional para despertar tu naturaleza.
        </p>
      </div>
    </div>
  )
}

export default HomePage