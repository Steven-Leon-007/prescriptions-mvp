# Decisiones Técnicas - Sistema de Gestión de Prescripciones Médicas

Este documento detalla las decisiones técnicas clave tomadas durante el desarrollo del MVP del sistema de gestión de prescripciones médicas.

## 1. Autenticación: Tokens en Cookies vs Bearer Tokens

### Decisión
Se optó por usar **tokens JWT almacenados en cookies httpOnly** en lugar del esquema tradicional de Bearer tokens en headers.

### Razones

#### Seguridad
- **HttpOnly cookies**: Los tokens no son accesibles desde JavaScript, eliminando el riesgo de ataques XSS (Cross-Site Scripting)
- **SameSite attribute**: Protección adicional contra ataques CSRF (Cross-Site Request Forgery)
- **Automatic handling**: Las cookies se envían automáticamente con cada request, reduciendo errores de implementación

#### Experiencia de Usuario
- **Persistencia automática**: Las cookies persisten entre sesiones del navegador
- **Refresh transparente**: El proceso de renovación de tokens es invisible para el usuario
- **Menos código cliente**: No es necesario manejar manualmente el almacenamiento y envío de tokens

### Implementación

**Backend:**
```typescript
// Configuración de cookies seguras
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000 // 15 minutos
});
```

**Librerías utilizadas:**
- `@nestjs/jwt`: Generación y verificación de tokens JWT
- `@nestjs/passport`: Integración con estrategias de autenticación
- `passport-jwt`: Estrategia JWT para Passport
- `cookie-parser`: Parseo de cookies en Express
- `bcrypt`: Hash seguro de contraseñas

### Tokens de Refresh
Se implementó un sistema de dual tokens:
- **Access Token**: Corta duración (15 minutos)
- **Refresh Token**: Mayor duración (7 días)
- Almacenados en tabla `RefreshToken` para permitir revocación

## 2. Control de Acceso Basado en Roles (RBAC)

### Decisión
Implementación de RBAC con tres roles: `admin`, `doctor` y `patient`.

### Implementación

**Guards personalizados:**
```typescript
@Roles(Role.admin, Role.doctor)
@UseGuards(JwtAuthGuard, RolesGuard)
```

**Decoradores:**
- `@Public()`: Endpoints sin autenticación
- `@Roles()`: Restricción por rol
- `@CurrentUser()`: Inyección del usuario autenticado

**Librerías:**
- `@nestjs/common`: Decoradores y guards de NestJS
- `reflect-metadata`: Metadata para decoradores

### Jerarquía de Permisos
- **Admin**: Acceso completo, gestión de usuarios y métricas
- **Doctor**: Crear prescripciones, ver pacientes
- **Patient**: Ver y consumir prescripciones propias

## 3. Generación de PDF

### Decisión
Uso de **PDFKit** para generación de PDFs en el servidor.

### Razones
- **Server-side**: Mayor control sobre el formato y seguridad
- **Streaming**: Generación eficiente sin cargar todo en memoria
- **Personalización**: Control total sobre diseño y contenido
- **QR codes**: Integración con código QR para validación

### Implementación

**Librerías:**
- `pdfkit`: Generación de PDFs
- `qrcode`: Generación de códigos QR

**Características:**
- Información del paciente, doctor y medicamentos
- Código QR con ID único de prescripción
- Marca de agua con estado (pending/consumed)

## 4. Paginación

### Decisión
Implementación de paginación **offset-based** con metadata.

### Implementación
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}
```

### Parámetros
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 10, max: 100)

### Endpoints con paginación
- `GET /users?page=1&limit=10`
- `GET /prescriptions?page=1&limit=10`

## 5. Base de Datos: PostgreSQL en Docker

### Decisión
Uso de **PostgreSQL en contenedor Docker** para desarrollo.

### Razones

#### Facilidad de Setup
- **Un comando**: `docker run --name prescriptions-postgres -e POSTGRES_PASSWORD=mvp-init-pass -p 5432:5432 -d postgres:16-alpine`
- **Sin instalación local**: No requiere instalar PostgreSQL en la máquina
- **Portabilidad**: Mismo ambiente en todos los entornos de desarrollo
- **Versión específica**: Control total sobre la versión de PostgreSQL

#### Aislamiento
- **Sin conflictos**: No interfiere con otras instalaciones de PostgreSQL
- **Limpieza fácil**: `docker rm -f prescriptions-postgres` y listo
- **Reset rápido**: Recrear el contenedor en segundos

#### Producción
- **Misma tecnología**: Fácil transición a servicios managed (AWS RDS, Google Cloud SQL, etc.)
- **Alpine Linux**: Imagen ligera (menos de 80MB)

## 6. ORM: Prisma

### Decisión
Uso de **Prisma ORM** para interacción con la base de datos.

### Razones
- **Type-safety**: Generación automática de tipos TypeScript
- **Migrations**: Control de versiones del schema
- **Developer experience**: Excelente autocompletado y documentación
- **Prisma Studio**: UI visual para explorar datos

### Librerías
- `@prisma/client`: Cliente generado
- `@prisma/adapter-pg`: Adaptador para PostgreSQL
- `pg`: Driver de PostgreSQL

## 7. Corrección del Schema de Prisma

### Problema Original

El schema inicial proporcionado contenía **errores críticos de diseño**:

### Errores Identificados

1. **Relación circular problemática**:
   - User → Doctor → User creaba una dependencia circular incorrecta
   - Prisma lee el schema de arriba hacia abajo y se confundía

2. **Relación directa innecesaria**:
   - `prescriptionsAuthored` en User era redundante
   - La relación ya existe a través de Doctor
   - Violaba el principio de single source of truth

3. **Falta de eliminación en cascada**:
   - Al eliminar un User, los registros de Doctor/Patient quedaban huérfanos

### Solución Implementada

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String
  name          String
  role          Role
  createdAt     DateTime       @default(now())
  refreshTokens RefreshToken[]

  // Relaciones correctas: uno-a-uno opcionales
  doctor  Doctor?
  patient Patient?

  @@index([role])
}

model Doctor {
  id            String         @id @default(cuid())
  // Doctor es dueño de la relación con User
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String         @unique
  specialty     String?
  prescriptions Prescription[]

  @@index([specialty])
}

model Patient {
  id            String         @id @default(cuid())
  // Patient es dueño de la relación con User
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String         @unique
  birthDate     DateTime?
  prescriptions Prescription[]
}

model Prescription {
  id         String             @id @default(cuid())
  code       String             @unique
  status     PrescriptionStatus @default(pending)
  notes      String?
  createdAt  DateTime           @default(now())
  consumedAt DateTime?

  patient   Patient            @relation(fields: [patientId], references: [id])
  patientId String
  author    Doctor             @relation(fields: [authorId], references: [id])
  authorId  String
  items     PrescriptionItem[]

  // Índices compuestos para optimizar queries frecuentes
  @@index([patientId, status])
  @@index([authorId, status])
}

model PrescriptionItem {
  id             String       @id @default(cuid())
  prescription   Prescription @relation(fields: [prescriptionId], references: [id])
  prescriptionId String
  name           String
  dosage         String?
  quantity       Int?
  instructions   String?

  @@index([name])
}
```

### Mejoras Adicionales

#### 1. Índices de Base de Datos
Se agregaron índices estratégicos para optimizar queries frecuentes:

```prisma
// RefreshToken
@@index([userId])      // Buscar tokens por usuario
@@index([token])       // Validación de tokens

// User
@@index([role])        // Filtrar usuarios por rol

// Doctor
@@index([specialty])   // Buscar doctores por especialidad

// Prescription
@@index([patientId, status])  // Prescripciones por paciente y estado
@@index([authorId, status])   // Prescripciones por doctor y estado

// PrescriptionItem
@@index([name])        // Buscar medicamentos por nombre
```

#### 2. Eliminación en Cascada
```prisma
onDelete: Cascade
```
- Al eliminar un User, se eliminan automáticamente Doctor/Patient
- Al eliminar una Prescription, se eliminan sus PrescriptionItems
- Mantiene integridad referencial

### Ventajas del Schema Correcto

1. **Claridad conceptual**: Un User ES un Doctor O un Patient, no tiene referencias a ellos
2. **Integridad referencial**: Las foreign keys están en el lugar correcto
3. **Performance**: Índices en columnas usadas frecuentemente
4. **Mantenibilidad**: Estructura clara y predecible
5. **Extensibilidad**: Fácil agregar campos sin romper relaciones

## 8. Visualización de Datos

### Decisión
Uso de **Chart.js** con **react-chartjs-2** para gráficos en el dashboard.

### Librerías
- `chart.js`: Motor de gráficos
- `react-chartjs-2`: Wrapper de React

### Tipos de gráficos implementados
- **Doughnut**: Distribución de prescripciones por estado
- **Bar**: Top doctores por número de prescripciones
- **Line**: Series de tiempo de prescripciones diarias

## 9. Estado Global

### Decisión
Uso de **Zustand** para manejo de estado global.

### Razones
- **Simplicidad**: API minimal y fácil de entender
- **TypeScript**: Excelente soporte de tipos
- **Performance**: Actualizaciones granulares
- **Persistencia**: Middleware de persist integrado
- **Sin boilerplate**: No requiere providers ni reducers complejos


## 10. Testing

### Backend
- **Framework**: Jest + Supertest
- **Tests e2e**: Validación de endpoints completos
- **Coverage**: Configurado para reportes de cobertura

### Frontend
- **Framework**: Jest + React Testing Library
- **Componentes críticos testeados**:
  - `useAuthStore`: Hook de autenticación (10 tests)
  - `AuthGuard`: Protección de rutas (10 tests)
- **Cobertura**: 19 tests pasando

### Librerías de Testing
- `jest`: Framework de testing
- `@testing-library/react`: Testing de componentes
- `@testing-library/jest-dom`: Matchers adicionales
- `@testing-library/user-event`: Simulación de interacciones

## 11. Seguridad

### Medidas Implementadas

1. **Helmet**: Headers de seguridad HTTP
2. **Throttling**: Límite de requests por IP
3. **CORS**: Configuración restrictiva
4. **Validation**: `class-validator` en todos los DTOs
5. **Password hashing**: Bcrypt con salt rounds
6. **JWT secrets**: Variables de entorno configurables

### Librerías
- `helmet`: Headers de seguridad
- `@nestjs/throttler`: Rate limiting
- `class-validator`: Validación de datos
- `class-transformer`: Transformación segura de objetos

### Actualización de Dependencias por Vulnerabilidades

#### React 19.2.3
Se actualizó React y React-DOM a la versión **19.2.3** para mitigar vulnerabilidades críticas en React Server Components descubiertas en diciembre de 2025:

**Vulnerabilidades corregidas:**
- **CVE-2025-55184** (High Severity - CVSS 7.5): Denial of Service
- **CVE-2025-67779** (High Severity - CVSS 7.5): Denial of Service
- **CVE-2025-55183** (Medium Severity - CVSS 5.3): Source Code Exposure

**Impacto:**
- Las vulnerabilidades permitían ataques de Denial of Service en aplicaciones usando React Server Components
- Exposición potencial de código fuente en ciertos escenarios
- La actualización a 19.2.3 incluye parches de seguridad que mitigan estos vectores de ataque

**Dependencias actualizadas:**
```json
"react": "^19.2.3",
"react-dom": "^19.2.3"
```

Esta actualización es crítica para mantener la seguridad de la aplicación y proteger contra ataques conocidos.

## 12. Documentación API

### Decisión
Uso de **Swagger/OpenAPI** para documentación automática.

### Librerías
- `@nestjs/swagger`: Integración de Swagger con NestJS

### Ventajas
- **Auto-generada**: A partir de decoradores en el código
- **Interactiva**: Probar endpoints desde el navegador
- **Tipos**: Documentación de schemas y DTOs
- **Ejemplos**: Requests y responses de ejemplo

### Acceso
```
http://localhost:4000/docs
```

## 13. Estilo y UI

### Frontend
- **Framework CSS**: TailwindCSS
- **Iconos**: React Icons
- **Notificaciones**: React Toastify

### Colores Corporativos
```css
--primary: #361951    /* Morado principal */
--secondary: #bc862d  /* Dorado */
--background: #fffefe /* Fondo claro */
```
