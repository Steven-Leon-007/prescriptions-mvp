# Servidor - Sistema de Gestión de Prescripciones Médicas

API REST del sistema de gestión de prescripciones médicas construida con NestJS, Prisma ORM y PostgreSQL.

## Instalación

```bash
npm install
```

## Variables de Entorno

El proyecto incluye archivos `.example` que puedes copiar y configurar:

```bash
cp .env.example .env
cp .env.test.local.example .env.test.local
```

### Archivo `.env` (Desarrollo)

```env
DATABASE_URL="postgresql://postgres:mvp-init-pass@localhost:5432/postgres?schema=public"
PORT=4000
JWT_ACCESS_SECRET=tu-secreto-muy-seguro-para-access-tokens
JWT_REFRESH_SECRET=tu-secreto-muy-seguro-para-refresh-tokens
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
APP_ORIGIN=http://localhost:3000
```

### Archivo `.env.test.local` (Testing)

```env
DATABASE_URL="postgresql://postgres:mvp-init-pass@localhost:5432/postgres?schema=public"
PORT=4000
JWT_ACCESS_SECRET=tu-secreto-muy-seguro-para-access-tokens-cambiar-en-produccion
JWT_REFRESH_SECRET=tu-secreto-muy-seguro-para-refresh-tokens-cambiar-en-produccion
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
APP_ORIGIN=http://localhost:3000
```

**Nota:** Si usas una base de datos separada para testing en el puerto 5433, cambia el `DATABASE_URL` en `.env.test.local` a:
```env
DATABASE_URL="postgresql://postgres:mvp-init-pass@localhost:5433/postgres?schema=public"
```

## Base de Datos

### Levantar PostgreSQL con Docker

#### Base de datos de desarrollo

```bash
docker run --name prescriptions-postgres -e POSTGRES_PASSWORD=mvp-init-pass -p 5432:5432 -d postgres:16-alpine
```

#### Base de datos de testing (opcional)

Si deseas una base de datos separada para testing:

```bash
docker run --name prescriptions-postgres-test -e POSTGRES_PASSWORD=mvp-init-pass -p 5433:5432 -d postgres:16-alpine
```

### Generar Cliente de Prisma

```bash
npx prisma generate
```

### Ejecutar Migraciones

```bash
npx prisma migrate deploy
```

### Poblar Base de Datos (Seed)

```bash
npx prisma db seed
```

Esto creará las siguientes cuentas de prueba:

#### Administrador
- **Email**: admin@test.com
- **Password**: admin123

#### Doctor
- **Email**: dr@test.com
- **Password**: dr123
- **Especialidad**: Cardiología

#### Paciente
- **Email**: patient@test.com
- **Password**: patient123
- **Fecha de nacimiento**: 15/08/1985

## Ejecutar la Aplicación

```bash
# Desarrollo
npm run start

# Modo watch (desarrollo)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La API estará disponible en: http://localhost:4000

## Documentación Swagger

Una vez iniciado el servidor, accede a:

http://localhost:4000/api

## Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

```

## Estructura del Proyecto

```
server/
├── src/
│   ├── auth/                    # Autenticación y autorización
│   │   ├── auth.controller.ts  # Endpoints de auth
│   │   ├── auth.service.ts     # Lógica de negocio
│   │   ├── jwt.strategy.ts     # Estrategia JWT access
│   │   ├── jwt-refresh.strategy.ts # Estrategia JWT refresh
│   │   └── dto/                # DTOs de autenticación
│   │
│   ├── users/                  # Gestión de usuarios
│   │   ├── users.controller.ts # Endpoints CRUD
│   │   ├── users.service.ts    # Lógica de negocio
│   │   ├── dto/                # DTOs de usuarios
│   │   └── entities/           # Entidades
│   │
│   ├── prescriptions/          # Gestión de prescripciones
│   │   ├── prescriptions.controller.ts
│   │   ├── prescriptions.service.ts
│   │   ├── pdf.service.ts      # Generación de PDFs
│   │   └── dto/                # DTOs de prescripciones
│   │
│   ├── metrics/                # Métricas y reportes
│   │   ├── metrics.controller.ts
│   │   └── metrics.service.ts
│   │
│   ├── prisma/                 # Servicio de Prisma
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── common/                 # Utilidades compartidas
│   │   ├── decorators/        # Decoradores personalizados
│   │   ├── filters/           # Filtros de excepciones
│   │   └── guards/            # Guards de autorización
│   │
│   ├── app.module.ts          # Módulo principal
│   └── main.ts                # Bootstrap de la aplicación
│
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.ts                # Datos de prueba
│   └── migrations/            # Historial de migraciones
│
└── test/                      # Tests e2e
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

## Autenticación y Autorización

### JWT Tokens

La API usa JWT con dos tipos de tokens:

- **Access Token**: Válido por 15 minutos, se envía en cookie httpOnly
- **Refresh Token**: Válido por 7 días, permite renovar el access token

### Roles

- `admin`: Acceso completo al sistema
- `doctor`: Crear y gestionar prescripciones
- `patient`: Ver y consumir prescripciones propias

### Guards

- `@Public()`: Endpoints públicos (login, register)
- `@Roles(Role.admin)`: Solo administradores
- `@Roles(Role.doctor)`: Solo doctores
- `@Roles(Role.patient)`: Solo pacientes

## Endpoints Principales

### Autenticación

```
POST   /auth/register        # Registrar nuevo usuario
POST   /auth/login           # Iniciar sesión
POST   /auth/logout          # Cerrar sesión
POST   /auth/refresh         # Renovar access token
GET    /auth/me              # Obtener usuario actual
```

### Usuarios (Admin)

```
GET    /users                # Listar usuarios (filtros, paginación)
POST   /users                # Crear usuario
GET    /users/patients       # Listar pacientes (admin y doctor)
GET    /users/:id            # Obtener usuario por ID
PATCH  /users/:id            # Actualizar usuario
DELETE /users/:id            # Eliminar usuario
```

### Prescripciones

```
GET    /prescriptions        # Listar prescripciones (filtros, paginación)
POST   /prescriptions        # Crear prescripción (doctor)
GET    /prescriptions/me     # Mis prescripciones (paciente)
GET    /prescriptions/:id    # Obtener prescripción
PATCH  /prescriptions/:id    # Actualizar prescripción
DELETE /prescriptions/:id    # Eliminar prescripción
POST   /prescriptions/:id/consume # Marcar como consumida (paciente)
GET    /prescriptions/:id/pdf     # Descargar PDF
```

### Métricas (Admin)

```
GET    /metrics              # Obtener métricas del sistema
```

## Scripts de Prisma

```bash
# Abrir Prisma Studio (UI de base de datos)
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre_de_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Reset de base de datos (CUIDADO: elimina todos los datos)
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate

# Ejecutar seed
npx prisma db seed

# Ver estado de migraciones
npx prisma migrate status

# Formatear schema.prisma
npx prisma format
```

## Modelo de Datos

### User
```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  password   String
  role       Role
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  doctor     Doctor?
  patient    Patient?
  refreshToken RefreshToken[]
}
```

### Doctor
```prisma
model Doctor {
  id           String   @id @default(uuid())
  specialty    String?
  userId       String   @unique
  
  user         User     @relation(...)
  prescriptions Prescription[]
}
```

### Patient
```prisma
model Patient {
  id           String   @id @default(uuid())
  birthDate    DateTime?
  userId       String   @unique
  
  user         User     @relation(...)
  prescriptions Prescription[]
}
```

### Prescription
```prisma
model Prescription {
  id          String   @id @default(uuid())
  code        String   @unique
  status      PrescriptionStatus
  notes       String?
  consumedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  patientId   String
  authorId    String
  
  patient     Patient  @relation(...)
  author      Doctor   @relation(...)
  items       PrescriptionItem[]
}
```

## Configuración Adicional

### CORS

Configurado para aceptar requests desde `http://localhost:3000`:

```typescript
app.enableCors({
  origin: process.env.APP_ORIGIN,
  credentials: true,
});
```

### Cookies

Las cookies se configuran como:

```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

### Validación

Se usa `class-validator` para validación automática de DTOs con pipes de NestJS.

## Troubleshooting

### Error de conexión a PostgreSQL

```bash
# Verificar que Docker esté corriendo
docker ps

# Verificar logs del contenedor
docker logs -f prescriptions-postgres

# Reiniciar contenedor
docker restart prescriptions-postgres
```

### Problemas con Prisma

```bash
# Regenerar cliente
npx prisma generate

# Reset completo (cuidado: elimina datos)
npx prisma migrate reset

# Verificar conexión
npx prisma db pull
```

### Puerto en uso

Si el puerto 4000 está ocupado, cambia la variable `PORT` en `.env`.

## Notas de Seguridad

⚠️ **IMPORTANTE**: Los valores de `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` en los archivos de ejemplo son solo para desarrollo. En producción deben ser valores seguros y únicos:

```bash
# Generar secrets seguros
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Recursos

- [Documentación NestJS](https://docs.nestjs.com)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Ver README principal del proyecto](../README.md)

## Licencia

Este proyecto es parte de un MVP de gestión de prescripciones médicas.
