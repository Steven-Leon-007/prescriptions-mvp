'use client';

import { AuthGuard } from '@/lib/guards';

const AdminPage = () => {
  return (
    <AuthGuard requiredRole="admin">
      <div>
        <h1>Panel de Administración</h1>
        {/* Dashboard administrativo */}
      </div>
    </AuthGuard>
  );
};

export default AdminPage;
