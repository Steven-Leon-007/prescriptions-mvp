import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {

    if (process.env.RUN_SEED !== 'true') {
        console.log('Seed skipped');
        return;
    }
    
    const userAdmin = await prisma.user.create({
        data: {
            email: 'admin@test.com',
            name: 'Dr. Juan Pérez',
            password: bcrypt.hashSync('admin123', 10),
            role: 'admin',
        },
    });

    const userDoctor = await prisma.user.create({
        data: {
            email: 'dr@test.com',
            name: 'Dra. Laura Garzón',
            password: bcrypt.hashSync('dr123', 10),
            role: 'doctor',
            doctor: {
                create: { specialty: 'Cardiología' }
            },
        },
        include: { doctor: true },
    });

    const userPatient = await prisma.user.create({
        data: {
            email: 'patient@test.com',
            name: 'Carlos López',
            password: bcrypt.hashSync('patient123', 10),
            role: 'patient',
            patient: {
                create: { birthDate: new Date('1985-08-15') }
            },
        },
        include: {
            patient: true,
        },
    });

    const prescription1 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-001',
            status: 'pending',
            notes: 'Tomar con alimentos',
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Ibuprofeno',
                        dosage: '400mg',
                        quantity: 20,
                        instructions: 'Cada 8 horas por 5 días',
                    },
                    {
                        name: 'Paracetamol',
                        dosage: '500mg',
                        quantity: 10,
                        instructions: 'Cada 6 horas si hay fiebre',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    const prescription2 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-002',
            status: 'consumed',
            notes: 'Tratamiento completado',
            consumedAt: new Date(),
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Amoxicilina',
                        dosage: '500mg',
                        quantity: 21,
                        instructions: 'Cada 8 horas por 7 días',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    const prescription3 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-003',
            status: 'pending',
            notes: 'Control de presión arterial',
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Losartán',
                        dosage: '50mg',
                        quantity: 30,
                        instructions: 'Una vez al día en ayunas',
                    },
                    {
                        name: 'Aspirina',
                        dosage: '100mg',
                        quantity: 30,
                        instructions: 'Una vez al día después del desayuno',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    const prescription4 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-004',
            status: 'pending',
            notes: 'Tratamiento para diabetes tipo 2',
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Metformina',
                        dosage: '850mg',
                        quantity: 60,
                        instructions: 'Dos veces al día con las comidas',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    const prescription5 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-005',
            status: 'consumed',
            notes: 'Tratamiento para infección respiratoria',
            consumedAt: new Date('2025-11-20'),
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Azitromicina',
                        dosage: '500mg',
                        quantity: 3,
                        instructions: 'Una vez al día por 3 días',
                    },
                    {
                        name: 'Loratadina',
                        dosage: '10mg',
                        quantity: 10,
                        instructions: 'Una vez al día si hay alergias',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    const prescription6 = await prisma.prescription.create({
        data: {
            code: 'RX-2025-006',
            status: 'pending',
            notes: 'Tratamiento preventivo para migraña',
            patientId: userPatient.patient!.id,
            authorId: userDoctor.doctor!.id,
            items: {
                create: [
                    {
                        name: 'Sumatriptán',
                        dosage: '50mg',
                        quantity: 6,
                        instructions: 'Al inicio de la migraña, máximo 2 al día',
                    },
                    {
                        name: 'Naproxeno',
                        dosage: '550mg',
                        quantity: 10,
                        instructions: 'Cada 12 horas si persiste el dolor',
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });