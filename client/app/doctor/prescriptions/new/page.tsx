'use client';

import { AuthGuard } from '@/lib/guards';

const NewPrescriptionPage = () => {
  return (
    <AuthGuard requiredRole="doctor">
      <div>
        <h1>Nueva Prescripción</h1>
        {/* Formulario para crear prescripción */}
      </div>
    </AuthGuard>
  );
};

export default NewPrescriptionPage;
