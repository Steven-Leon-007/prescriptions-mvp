'use client';

import { AuthGuard } from '@/lib/guards';
import { useEffect, useState } from 'react';
import { prescriptionsService } from '@/lib/prescriptions';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components';
import { toast } from 'react-toastify';

interface Patient {
  id: string;
  userId: string;
  birthDate?: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface MedicationItem {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

const NewPrescriptionPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: '', dosage: '', quantity: '', instructions: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await prescriptionsService.getPatients();
      setPatients(response.data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar los pacientes');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', quantity: '', instructions: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatientId) {
      setError('Debes seleccionar un paciente');
      return;
    }

    const validMedications = medications.filter((med) => med.name.trim() !== '');
    if (validMedications.length === 0) {
      setError('Debes agregar al menos un medicamento');
      return;
    }

    try {
      setIsSubmitting(true);

      const prescriptionData = {
        patientId: selectedPatientId,
        notes: notes.trim() || undefined,
        items: validMedications.map((med) => ({
          name: med.name.trim(),
          dosage: med.dosage.trim() || undefined,
          quantity: med.quantity ? parseInt(med.quantity) : undefined,
          instructions: med.instructions.trim() || undefined,
        })),
      };

      const newPrescription = await prescriptionsService.createPrescription(prescriptionData);
      toast.success('Prescripción creada exitosamente');
      router.push(`/doctor/prescriptions/${newPrescription.id}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al crear la prescripción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRole="doctor">
      <div className="min-h-screen bg-[#fffefe] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Nueva Prescripción
            </h1>
            <p className="text-gray-600">
              Crea una nueva prescripción médica para un paciente
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Seleccionar Paciente
                </h2>
                {isLoadingPatients ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#361951]"></div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-2">
                      Paciente *
                    </label>
                    <select
                      id="patient"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                      required
                    >
                      <option value="">Selecciona un paciente...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.user.name} - {patient.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Card>

            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#361951]">
                    Medicamentos
                  </h2>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addMedication}
                  >
                    + Agregar Medicamento
                  </Button>
                </div>

                <div className="space-y-6">
                  {medications.map((medication, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-800">
                          Medicamento {index + 1}
                        </h3>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Input
                            label="Nombre del medicamento *"
                            value={medication.name}
                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                            placeholder="Ej: Ibuprofeno"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="Dosis"
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="Ej: 400mg"
                          />
                        </div>
                        <div>
                          <Input
                            label="Cantidad"
                            type="number"
                            value={medication.quantity}
                            onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                            placeholder="Ej: 20"
                            min="1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instrucciones
                          </label>
                          <textarea
                            value={medication.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="Ej: Tomar cada 8 horas después de las comidas"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Notas Adicionales
                </h2>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade cualquier nota o comentario adicional sobre la prescripción..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                />
              </div>
            </Card>

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
                {isSubmitting ? 'Creando...' : 'Crear Prescripción'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
};

export default NewPrescriptionPage;
