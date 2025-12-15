# Sistema de Gestión de Prescripciones Médicas - MVP para Nutrabiotics

Sistema completo de gestión de prescripciones médicas con tres tipos de usuarios: Administradores, Doctores y Pacientes.

Desarrollado con ♥️ por Steven León Para Nutrabiotics

## Arquitectura

- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS
- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Autenticación**: JWT con cookies httpOnly
- **Base de datos**: PostgreSQL con Docker

## Requisitos Previos

- Node.js 18+ 
- Docker y Docker Compose
- npm o yarn

## Setup Local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd prescriptions-mvp
```

### 2. Levantar la base de datos con Docker

#### Base de datos de desarrollo

```bash
docker run --name prescriptions-postgres -e POSTGRES_PASSWORD=mvp-init-pass -p 5432:5432 -d postgres:16-alpine
```

**Explicación de parámetros:**
- `--name prescriptions-postgres`: Nombre del contenedor para fácil identificación
- `-e POSTGRES_PASSWORD=mvp-init-pass`: Variable de entorno que establece la contraseña del usuario postgres
- `-p 5432:5432`: Mapea el puerto 5432 del contenedor al puerto 5432 del host
- `-d`: Ejecuta el contenedor en modo detached (segundo plano)
- `postgres:16-alpine`: Imagen de PostgreSQL 16 con Alpine Linux (más ligera)

**Credenciales de la base de datos:**
- **Usuario**: postgres
- **Password**: mvp-init-pass
- **Base de datos**: postgres (se crea por defecto)
- **Puerto**: 5432

#### Base de datos de testing (opcional)

Si deseas una base de datos separada para testing:

```bash
docker run --name prescriptions-postgres-test -e POSTGRES_PASSWORD=mvp-init-pass -p 5433:5432 -d postgres:16-alpine
```

**Nota:** Esta base de datos de testing usa el puerto 5433 para no entrar en conflicto con la de desarrollo. Deberás actualizar el `DATABASE_URL` en `.env.test.local` con el puerto correspondiente.

### 3. Configurar variables de entorno

El proyecto incluye archivos `.example` que puedes copiar y configurar:

#### Cliente

```bash
cd client
cp .env.local.example .env.local
```

Contenido de `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Servidor

```bash
cd server
cp .env.example .env
cp .env.test.local.example .env.test.local
```

Contenido de `server/.env`:

```env
DATABASE_URL="postgresql://postgres:mvp-init-pass@localhost:5432/postgres?schema=public"
PORT=4000
JWT_ACCESS_SECRET=tu-secreto-muy-seguro-para-access-tokens
JWT_REFRESH_SECRET=tu-secreto-muy-seguro-para-refresh-tokens
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
APP_ORIGIN=http://localhost:3000
```

Contenido de `server/.env.test.local`:

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

### 4. Instalar dependencias

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 5. Ejecutar migraciones y seed

Desde la carpeta `server/`:

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar la base de datos con datos de prueba
npx prisma db seed
```

### 6. Iniciar la aplicación

#### Backend (Terminal 1)
```bash
cd server
npm run start:dev
```

El servidor estará disponible en: http://localhost:4000

#### Frontend (Terminal 2)
```bash
cd client
npm run dev
```

El cliente estará disponible en: http://localhost:3000

## Cuentas de Prueba

Una vez ejecutado el seed, puedes ingresar con las siguientes cuentas:

### Administrador
- **Email**: admin@test.com
- **Password**: admin123
- **Permisos**: Gestión completa de usuarios, visualización de métricas y reportes

### Doctor
- **Email**: dr@test.com
- **Password**: dr123
- **Nombre**: Dra. Laura Garzón
- **Especialidad**: Cardiología
- **Permisos**: Crear prescripciones, ver pacientes asignados

### Paciente
- **Email**: patient@test.com
- **Password**: patient123
- **Nombre**: Carlos López
- **Permisos**: Ver y consumir prescripciones propias, descargar PDF

## Estructura del Proyecto

```
prescriptions-mvp/
├── client/                 # Frontend Next.js
│   ├── app/               # Rutas de la aplicación
│   │   ├── admin/        # Panel de administrador
│   │   ├── doctor/       # Panel de doctor
│   │   ├── patient/      # Panel de paciente
│   │   └── login/        # Página de login
│   ├── components/       # Componentes reutilizables
│   ├── lib/             # Servicios y utilidades
│   ├── store/           # Estado global (Zustand)
│   └── types/           # Tipos TypeScript
│
└── server/               # Backend NestJS
    ├── src/
    │   ├── auth/        # Autenticación y autorización
    │   ├── users/       # Gestión de usuarios
    │   ├── prescriptions/ # Gestión de prescripciones
    │   ├── metrics/     # Métricas y reportes
    │   └── prisma/      # Servicio de Prisma
    └── prisma/
        ├── schema.prisma # Esquema de base de datos
        ├── seed.ts      # Datos de prueba
        └── migrations/  # Migraciones de base de datos
```

## Scripts Útiles

### Backend (desde `server/`)

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e

# Prisma
npx prisma studio          # Abrir UI de base de datos
npx prisma migrate dev     # Crear nueva migración
npx prisma db seed         # Ejecutar seed
npx prisma generate        # Generar cliente de Prisma
```

### Frontend (desde `client/`)

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run start

# Linting
npm run lint

# Testing
npm test                # Ejecutar todas las pruebas
npm run test:watch      # Modo watch
npm run test:coverage   # Con cobertura
```

## Funcionalidades por Rol

### Administrador
-  Crear, listar y gestionar usuarios (admin, doctor, paciente)
-  Visualizar métricas del sistema
-  Ver estadísticas de prescripciones
-  Gráficos de análisis (por estado, por doctor, series de tiempo)

### Doctor
-  Crear prescripciones para pacientes
-  Ver lista de todas las prescripciones
-  Filtrar prescripciones propias y por estado
-  Ver detalle de prescripciones
-  Acceso a lista de pacientes

### Paciente
-  Ver prescripciones propias
-  Marcar prescripciones como consumidas
-  Descargar prescripciones en PDF
-  Ver detalle de cada prescripción con medicamentos

##  Documentación API

Una vez levantado el servidor, puedes acceder a la documentación Swagger en:

http://localhost:4000/api

## Docker

Comandos útiles para gestionar el contenedor de PostgreSQL:

```bash
# Levantar contenedor (primera vez)
docker run --name prescriptions-postgres -e POSTGRES_PASSWORD=mvp-init-pass -p 5432:5432 -d postgres:16-alpine

# Iniciar contenedor existente
docker start prescriptions-postgres

# Detener contenedor
docker stop prescriptions-postgres

# Ver logs
docker logs -f prescriptions-postgres

# Reiniciar contenedor
docker restart prescriptions-postgres

# Eliminar contenedor (cuidado: elimina los datos)
docker rm -f prescriptions-postgres

# Conectarse a PostgreSQL desde el contenedor
docker exec -it prescriptions-postgres psql -U postgres
```

## Testing

### Backend

```bash
cd server

# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Tests con coverage
npm run test:cov
```

### Frontend

```bash
cd client

# Ejecutar todas las pruebas
npm test

# Modo watch (útil durante desarrollo)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

**Pruebas implementadas:**
- Hook `useAuthStore`: Gestión de autenticación y estado global (10 casos de prueba)
- Componente `AuthGuard`: Protección de rutas por autenticación y roles (10 casos de prueba)

## Tecnologías Utilizadas

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS
- Chart.js (react-chartjs-2)
- Zustand (estado global)
- React Toastify (notificaciones)

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Passport JWT
- bcrypt
- PDFKit (generación de PDFs)
- Swagger/OpenAPI

## Notas Importantes

1. **Seguridad**: Los secrets de JWT en `.env` son de ejemplo. En producción deben ser valores seguros y únicos.

2. **Base de datos**: Para reset completo de la base de datos:
   ```bash
   docker stop prescriptions-postgres
   docker rm prescriptions-postgres
   docker run --name prescriptions-postgres -e POSTGRES_PASSWORD=mvp-init-pass -p 5432:5432 -d postgres:16-alpine
   cd server && npx prisma migrate deploy && npx prisma db seed
   ```

3. **Puertos**: 
   - Frontend: 3000
   - Backend: 4000
   - PostgreSQL: 5432

4. **CORS**: El backend está configurado para aceptar requests desde http://localhost:3000

## Troubleshooting

### Error de conexión a base de datos
- Verificar que Docker esté corriendo: `docker ps`
- Verificar que el contenedor de PostgreSQL esté levantado
- Verificar las credenciales en `.env`

### Error de migraciones
```bash
cd server
npx prisma migrate reset  # Esto reseteará la base de datos
npx prisma migrate deploy
npx prisma db seed
```

### Puerto en uso
Si algún puerto está en uso, puedes cambiarlos en:
- Frontend: `package.json` (script dev con `-p` flag)
- Backend: `.env` (variable PORT)
- PostgreSQL: Cambiar el mapeo de puertos en el comando docker run: `-p 5433:5432`

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades, crear un issue en el repositorio.
