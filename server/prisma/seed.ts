import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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