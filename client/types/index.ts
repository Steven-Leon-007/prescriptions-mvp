export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'doctor' | 'patient';
    createdAt: string;
}

export interface Doctor {
    id: string;
    userId: string;
    specialty?: string | null;
    user?: User;
    prescriptions?: Prescription[];
}

export interface Patient {
    id: string;
    userId: string;
    birthDate?: string | null;
    user?: User;
    prescriptions?: Prescription[];
}

export enum PrescriptionStatus {
    pending = 'pending',
    consumed = 'consumed',
}

export interface Prescription {
    id: string;
    code: string;
    patientId: string;
    authorId: string;
    notes?: string | null;
    status: PrescriptionStatus;
    createdAt: string;
    consumedAt?: string | null;
    patient?: Patient;
    author?: Doctor;
    items?: PrescriptionItem[];
}

export interface PrescriptionItem {
    id: string;
    prescriptionId: string;
    name: string;
    dosage?: string | null;
    quantity?: number | null;
    instructions?: string | null;
    prescription?: Prescription;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreatePrescriptionItemDTO {
    name: string;
    dosage?: string;
    quantity?: number;
    instructions?: string;
}

export interface CreatePrescriptionDTO {
    patientId: string;
    notes?: string;
    items: CreatePrescriptionItemDTO[];
}

export interface UpdatePrescriptionDTO {
    patientId?: string;
    notes?: string;
    items?: CreatePrescriptionItemDTO[];
}

export interface RegisterDTO {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'doctor' | 'patient';
    specialty?: string;
    birthDate?: string;
}

export interface CreateUserDTO {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'doctor' | 'patient';
    specialty?: string;
    birthDate?: string;
}

export interface UpdateUserDTO {
    email?: string;
    password?: string;
    name?: string;
    role?: 'admin' | 'doctor' | 'patient';
    specialty?: string;
    birthDate?: string;
}
