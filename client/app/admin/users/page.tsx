'use client';

import { AuthGuard } from '@/lib/guards';
import { useEffect, useState } from 'react';
import { adminService } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  createdAt: string;
  doctor?: {
    id: string;
    specialty?: string | null;
  };
  patient?: {
    id: string;
    birthDate?: string | null;
  };
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'doctor' | 'patient'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await adminService.getUsers({
        page,
        limit: 10,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchQuery && { query: searchQuery }),
      });
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar los usuarios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Doctor';
      case 'patient':
        return 'Paciente';
      default:
        return role;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-[#fffefe] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#361951] mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600">
                Administra los usuarios del sistema
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/admin/users/new')}
            >
              + Crear Usuario
            </Button>
          </div>

          {/* Filtros */}
          <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por nombre o email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Escribe para buscar..."
                      className="flex-1"
                    />
                    <Button type="submit" variant="secondary">
                      Buscar
                    </Button>
                    {searchQuery && (
                      <Button type="button" variant="filter" onClick={handleClearSearch}>
                        Limpiar
                      </Button>
                    )}
                  </div>
                </form>

                {/* Filtro por rol */}
                <div className="lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por rol
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="filter"
                      isActive={roleFilter === 'all'}
                      onClick={() => {
                        setRoleFilter('all');
                        setPage(1);
                      }}
                      size="sm"
                    >
                      Todos
                    </Button>
                    <Button
                      variant="filter"
                      isActive={roleFilter === 'admin'}
                      onClick={() => {
                        setRoleFilter('admin');
                        setPage(1);
                      }}
                      size="sm"
                    >
                      Admins
                    </Button>
                    <Button
                      variant="filter"
                      isActive={roleFilter === 'doctor'}
                      onClick={() => {
                        setRoleFilter('doctor');
                        setPage(1);
                      }}
                      size="sm"
                    >
                      Doctores
                    </Button>
                    <Button
                      variant="filter"
                      isActive={roleFilter === 'patient'}
                      onClick={() => {
                        setRoleFilter('patient');
                        setPage(1);
                      }}
                      size="sm"
                    >
                      Pacientes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#361951]"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                {searchQuery || roleFilter !== 'all'
                  ? 'No se encontraron usuarios con los filtros aplicados'
                  : 'No hay usuarios registrados'}
              </p>
              {(searchQuery || roleFilter !== 'all') && (
                <Button variant="secondary" onClick={() => {
                  setSearchQuery('');
                  setSearchInput('');
                  setRoleFilter('all');
                  setPage(1);
                }}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla de usuarios */}
              <Card className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Información Adicional
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Registro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'doctor' && user.doctor?.specialty && (
                              <div className="text-sm text-gray-900">
                                <span className="font-medium">Especialidad:</span> {user.doctor.specialty}
                              </div>
                            )}
                            {user.role === 'patient' && user.patient?.birthDate && (
                              <div className="text-sm text-gray-900">
                                <span className="font-medium">Fecha de nacimiento:</span>{' '}
                                {formatDate(user.patient.birthDate)}
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <div className="text-sm text-gray-500 italic">
                                Acceso completo al sistema
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminUsersPage;
