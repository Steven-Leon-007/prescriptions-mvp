import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';

describe('Prescriptions MVP E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let doctorAccessToken: string;
  let patientAccessToken: string;
  let adminAccessToken: string;
  let createdPrescriptionId: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    await prismaService.prescriptionItem.deleteMany();
    await prismaService.prescription.deleteMany();
    await prismaService.refreshToken.deleteMany();
    await prismaService.doctor.deleteMany();
    await prismaService.patient.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('should register a doctor', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'doctor-e2e@test.com',
          password: 'password123',
          name: 'Dr. E2E Test',
          role: 'doctor',
          specialty: 'Medicina General',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.user).toHaveProperty('id');
          expect(response.body.user.email).toBe('doctor-e2e@test.com');
          expect(response.body.user.role).toBe('doctor');
          expect(response.headers['set-cookie']).toBeDefined();
        });
    });

    it('should register a patient', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'patient-e2e@test.com',
          password: 'password123',
          name: 'Patient E2E Test',
          role: 'patient',
          birthDate: '1990-01-01',
        })
        .expect(201)
        .then(async (response) => {
          expect(response.body.user).toHaveProperty('id');
          expect(response.body.user.role).toBe('patient');

          const user = await prismaService.user.findUnique({
            where: { email: 'patient-e2e@test.com' },
            include: { patient: true },
          });
          if (user && user.patient) {
            patientId = user.patient.id;
          }
        });
    });

    it('should register an admin', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin-e2e@test.com',
          password: 'password123',
          name: 'Admin E2E Test',
          role: 'admin',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.user.role).toBe('admin');
        });
    });

    it('should login as doctor and get cookies', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'doctor-e2e@test.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.user.email).toBe('doctor-e2e@test.com');
          const cookies = response.headers['set-cookie'];
          expect(cookies).toBeDefined();

          const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
          const accessCookie = cookieArray.find((c: string) => c.startsWith('access_token='));
          if (accessCookie) {
            doctorAccessToken = accessCookie.split(';')[0].split('=')[1];
          }
        });
    });

    it('should login as patient and get cookies', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'patient-e2e@test.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          const cookies = response.headers['set-cookie'];
          const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
          const accessCookie = cookieArray.find((c: string) => c.startsWith('access_token='));
          if (accessCookie) {
            patientAccessToken = accessCookie.split(';')[0].split('=')[1];
          }
        });
    });

    it('should login as admin and get cookies', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin-e2e@test.com',
          password: 'password123',
        })
        .expect(201)
        .then((response) => {
          const cookies = response.headers['set-cookie'];
          const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
          const accessCookie = cookieArray.find((c: string) => c.startsWith('access_token='));
          if (accessCookie) {
            adminAccessToken = accessCookie.split(';')[0].split('=')[1];
          }
        });
    });

    it('should get doctor profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Cookie', [`access_token=${doctorAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.user.email).toBe('doctor-e2e@test.com');
          expect(response.body.user.role).toBe('doctor');
        });
    });
  });

  describe('Prescriptions Flow', () => {
    it('should create a prescription as doctor', () => {
      return request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', [`access_token=${doctorAccessToken}`])
        .send({
          patientId: patientId,
          notes: 'Prescripción de prueba E2E',
          items: [
            {
              name: 'Amoxicilina 500mg',
              dosage: '1 cada 8 horas',
              quantity: 21,
              instructions: 'Tomar después de las comidas',
            },
            {
              name: 'Ibuprofeno 400mg',
              dosage: '1 cada 12 horas',
              quantity: 10,
              instructions: 'Si hay dolor',
            },
          ],
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.code).toMatch(/^RX-\d{4}-\d{4}$/);
          expect(response.body.status).toBe('pending');
          expect(response.body.items).toHaveLength(2);
          createdPrescriptionId = response.body.id;
        });
    });

    it('should fail to create prescription as patient', () => {
      return request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .send({
          patientId: patientId,
          notes: 'Test',
          items: [],
        })
        .expect(403);
    });

    it('should list prescriptions for doctor', () => {
      return request(app.getHttpServer())
        .get('/api/prescriptions?mine=true')
        .set('Cookie', [`access_token=${doctorAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.meta).toHaveProperty('total');
          expect(response.body.meta).toHaveProperty('page');
        });
    });

    it('should get prescription detail as doctor', () => {
      return request(app.getHttpServer())
        .get(`/api/prescriptions/${createdPrescriptionId}`)
        .set('Cookie', [`access_token=${doctorAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(createdPrescriptionId);
          expect(response.body.items).toHaveLength(2);
        });
    });

    it('should list patient prescriptions', () => {
      return request(app.getHttpServer())
        .get('/api/me/prescriptions')
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should mark prescription as consumed', () => {
      return request(app.getHttpServer())
        .patch(`/api/prescriptions/${createdPrescriptionId}/consume`)
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBe('consumed');
          expect(response.body.consumedAt).toBeDefined();
        });
    });

    it('should fail to consume already consumed prescription', () => {
      return request(app.getHttpServer())
        .patch(`/api/prescriptions/${createdPrescriptionId}/consume`)
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .expect(400);
    });

    it('should download PDF of prescription', () => {
      return request(app.getHttpServer())
        .get(`/api/prescriptions/${createdPrescriptionId}/pdf`)
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toBe('application/pdf');
          expect(response.body).toBeInstanceOf(Buffer);
        });
    });
  });

  describe('Admin Flow', () => {
    it('should list all prescriptions as admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/prescriptions')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.meta).toHaveProperty('total');
        });
    });

    it('should get metrics as admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/metrics')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.totals).toHaveProperty('doctors');
          expect(response.body.totals).toHaveProperty('patients');
          expect(response.body.totals).toHaveProperty('prescriptions');
          expect(response.body.byStatus).toHaveProperty('pending');
          expect(response.body.byStatus).toHaveProperty('consumed');
          expect(response.body.byDay).toBeInstanceOf(Array);
          expect(response.body.topDoctors).toBeInstanceOf(Array);
        });
    });

    it('should list users as admin', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should fail to access admin endpoints as patient', () => {
      return request(app.getHttpServer())
        .get('/api/admin/metrics')
        .set('Cookie', [`access_token=${patientAccessToken}`])
        .expect(403);
    });

    it('should fail to access admin endpoints as doctor', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', [`access_token=${doctorAccessToken}`])
        .expect(403);
    });
  });

  describe('Authorization', () => {
    it('should fail to access protected routes without token', () => {
      return request(app.getHttpServer())
        .get('/api/prescriptions')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/prescriptions')
        .set('Cookie', ['access_token=invalid-token'])
        .expect(401);
    });
  });
});
