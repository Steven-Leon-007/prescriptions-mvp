# Cliente - Sistema de Gestión de Prescripciones Médicas

Frontend de la aplicación de gestión de prescripciones médicas construido con Next.js 15, React 19 y TypeScript.

## Instalación

```bash
npm install
```

## Variables de Entorno

El proyecto incluye un archivo `.example` que puedes copiar y configurar:

```bash
cp .env.local.example .env.local
```

Contenido de `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Build para Producción

```bash
npm run build
npm run start
```

## Linting

```bash
npm run lint
```

## Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con cobertura
npm run test:coverage
```

El proyecto incluye pruebas para:
- Hook `useAuthStore`: Gestión de autenticación y estado global
- Componente `AuthGuard`: Protección de rutas por autenticación y roles


## Estructura del Proyecto

```
client/
├── app/                   # Rutas de la aplicación (App Router)
│   ├── admin/            # Panel de administrador
│   │   ├── page.tsx      # Dashboard con métricas
│   │   └── users/        # Gestión de usuarios
│   ├── doctor/           # Panel de doctor
│   │   └── prescriptions/ # Gestión de prescripciones
│   ├── patient/          # Panel de paciente
│   │   └── prescriptions/ # Ver prescripciones
│   ├── login/            # Página de login
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página de inicio
│
├── components/           # Componentes reutilizables
│   ├── AuthProvider.tsx  # Proveedor de autenticación
│   ├── Button.tsx        # Componente de botón
│   ├── Card.tsx          # Componente de tarjeta
│   ├── ConfirmDialog.tsx # Diálogo de confirmación
│   ├── ConditionalLayout.tsx # Layout condicional
│   ├── Footer.tsx        # Footer
│   ├── Input.tsx         # Componente de input
│   ├── Navbar.tsx        # Barra de navegación
│   └── index.ts          # Barrel export
│
├── lib/                  # Servicios y utilidades
│   ├── auth.ts          # Servicio de autenticación
│   ├── fetcher.ts       # Cliente HTTP con cookies
│   ├── guards.tsx       # Guards de protección de rutas
│   ├── prescriptions.ts # Servicio de prescripciones
│   └── admin.ts         # Servicio de administrador
│
├── store/               # Estado global (Zustand)
│   ├── auth.store.ts   # Store de autenticación
│   └── index.ts        # Barrel export
│
└── types/              # Tipos TypeScript
    └── index.ts        # Tipos compartidos
```

## Tecnologías

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS
- **Gráficos**: Chart.js con react-chartjs-2
- **Estado**: Zustand
- **Notificaciones**: React Toastify
- **HTTP**: Fetch API con manejo de cookies

## Roles y Permisos

La aplicación maneja tres tipos de usuarios:

### Administrador
- Gestión completa de usuarios
- Visualización de métricas del sistema
- Acceso a reportes y estadísticas

### Doctor
- Crear prescripciones para pacientes
- Ver y gestionar prescripciones
- Acceder a lista de pacientes

### Paciente
- Ver prescripciones propias
- Marcar prescripciones como consumidas
- Descargar prescripciones en PDF

## Autenticación

La aplicación usa autenticación basada en cookies httpOnly con JWT:

- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 7 días
- **Guardas de Ruta**: Protección automática por rol

## Tema de Colores

```css
--primary: #361951    /* Morado principal */
--secondary: #bc862d  /* Dorado */
--background: #fffefe /* Fondo claro */
```

## Componentes Principales

### AuthGuard
Protege rutas según el rol del usuario:
```tsx
<AuthGuard requiredRole="admin">
  {/* Contenido protegido */}
</AuthGuard>
```

### Button
Botón con variantes:
```tsx
<Button variant="primary" size="lg">
  Click me
</Button>
```

Variantes: `primary`, `secondary`, `filter`, `danger`

### Card
Tarjeta contenedora:
```tsx
<Card className="p-4">
  {/* Contenido */}
</Card>
```

### ConfirmDialog
Diálogo de confirmación:
```tsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Confirmar acción"
  message="¿Estás seguro?"
/>
```

## Servicios API

### authService
```typescript
await authService.login(email, password)
await authService.register(data)
await authService.logout()
await authService.getCurrentUser()
```

### prescriptionService
```typescript
await prescriptionService.getMyPrescriptions()
await prescriptionService.getDoctorPrescriptions(params)
await prescriptionService.createPrescription(data)
await prescriptionService.consumePrescription(id)
await prescriptionService.downloadPDF(id)
```

### adminService
```typescript
await adminService.getMetrics(from?, to?)
await adminService.createUser(data)
await adminService.getUsers(params)
```

## Estado Global

El estado de autenticación se maneja con Zustand:

```typescript
const { user, setUser, clearUser } = useAuthStore()
```

## Navegación

La aplicación usa Next.js App Router:

- `/` - Página de inicio (redirige según rol)
- `/login` - Inicio de sesión
- `/admin` - Panel de administrador
- `/admin/users` - Lista de usuarios
- `/admin/users/new` - Crear usuario
- `/doctor/prescriptions` - Lista de prescripciones (doctor)
- `/doctor/prescriptions/new` - Nueva prescripción
- `/doctor/prescriptions/[id]` - Detalle de prescripción
- `/patient/prescriptions` - Mis prescripciones
- `/patient/prescriptions/[id]` - Detalle de prescripción

## Notas

- El cliente se conecta al backend en `http://localhost:4000` por defecto
- Las cookies se manejan automáticamente con `credentials: 'include'`
- Los errores se muestran con toast notifications
- La autenticación persiste entre recargas de página

## Enlaces

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de React](https://react.dev)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)
- [Ver README principal del proyecto](../README.md)
