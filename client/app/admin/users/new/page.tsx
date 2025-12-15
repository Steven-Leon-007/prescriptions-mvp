'use client';

import { AuthGuard } from '@/lib/guards';
import { useState } from 'react';
import { adminService } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components';
import { toast } from 'react-toastify';

const NewUserPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: '' as | 'doctor' | 'patient' | '',
        specialty: '',
        birthDate: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const validatePassword = (password: string): { isValid: boolean; message: string } => {
        if (password.length < 8) {
            return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

        if (!passwordRegex.test(password)) {
            return {
                isValid: false,
                message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)'
            };
        }

        return { isValid: true, message: '' };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password || !formData.name || !formData.role) {
            setError('Todos los campos obligatorios deben ser completados');
            return;
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.message);
            return;
        }

        try {
            setIsSubmitting(true);

            const userData: any = {
                email: formData.email.trim(),
                password: formData.password,
                name: formData.name.trim(),
                role: formData.role,
            };

            if (formData.role === 'doctor' && formData.specialty) {
                userData.specialty = formData.specialty.trim();
            }

            if (formData.role === 'patient' && formData.birthDate) {
                userData.birthDate = formData.birthDate;
            }

            await adminService.createUser(userData);
            toast.success('Usuario creado exitosamente');
            router.push('/admin');
        } catch (err: any) {
            const errorMessage = err.message || 'Error al crear el usuario';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthGuard requiredRole="admin">
            <div className="min-h-screen bg-[#fffefe] py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Button
                            onClick={() => router.back()}
                            variant="secondary"
                            size="sm"
                        >
                            ← Volver
                        </Button>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[#361951] mb-2">
                            Crear Nuevo Usuario
                        </h1>
                        <p className="text-gray-600">
                            Completa el formulario para crear un nuevo usuario en el sistema
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-[#361951] mb-4">
                                    Información Básica
                                </h2>
                                <div className="space-y-4">
                                    <Input
                                        label="Nombre completo *"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Ej: Dr. Juan Pérez"
                                        required
                                    />

                                    <Input
                                        label="Correo electrónico *"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="ejemplo@correo.com"
                                        required
                                    />

                                    <Input
                                        label="Contraseña *"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Mínimo 8 caracteres"
                                        minLength={8}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&)
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rol *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                                            required
                                        >
                                            <option value="">Selecciona un rol...</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="patient">Paciente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Información Específica del Rol */}
                        {formData.role && (
                            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-[#361951] mb-4">
                                        Información Adicional
                                    </h2>

                                    {formData.role === 'doctor' && (
                                        <div className="space-y-4">
                                            <Input
                                                label="Especialidad"
                                                value={formData.specialty}
                                                onChange={(e) => handleInputChange('specialty', e.target.value)}
                                                placeholder="Ej: Cardiología"
                                            />
                                            <p className="text-sm text-gray-500">
                                                La especialidad es opcional pero recomendada
                                            </p>
                                        </div>
                                    )}

                                    {formData.role === 'patient' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de nacimiento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.birthDate}
                                                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                La fecha de nacimiento es opcional
                                            </p>
                                        </div>
                                    )}

                                </div>
                            </Card>
                        )}

                        {/* Resumen */}
                        {formData.role && (
                            <Card className="mb-6 rounded-lg border border-gray-200 bg-blue-50">
                                <div className="p-6">
                                    <h2 className="text-lg font-bold text-[#361951] mb-3">
                                        Resumen del Usuario
                                    </h2>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-semibold">Nombre:</span> {formData.name || '(sin especificar)'}</p>
                                        <p><span className="font-semibold">Email:</span> {formData.email || '(sin especificar)'}</p>
                                        <p><span className="font-semibold">Rol:</span> {
                                            formData.role === 'doctor' ? 'Doctor' :
                                                formData.role === 'patient' ? 'Paciente' : '(sin especificar)'
                                        }</p>
                                        {formData.role === 'doctor' && formData.specialty && (
                                            <p><span className="font-semibold">Especialidad:</span> {formData.specialty}</p>
                                        )}
                                        {formData.role === 'patient' && formData.birthDate && (
                                            <p><span className="font-semibold">Fecha de nacimiento:</span> {new Date(formData.birthDate).toLocaleDateString('es-ES')}</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                                {error}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </div>
                    </form>

                </div>
            </div>
        </AuthGuard>
    );
};

export default NewUserPage;
