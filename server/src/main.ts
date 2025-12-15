import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.APP_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Prescriptions MVP API')
    .setDescription(
      `API para sistema de gestión de prescripciones médicas con autenticación JWT, 
control de acceso basado en roles (RBAC) y generación de PDFs con códigos QR.

## Características principales:
- **Autenticación**: JWT con access y refresh tokens en cookies HttpOnly
- **RBAC**: Tres roles (admin, doctor, patient) con permisos específicos
- **Prescripciones**: CRUD completo con items anidados
- **PDF**: Generación de prescripciones en PDF con código QR
- **Paginación**: Endpoints con soporte de paginación y filtros
- **Métricas**: Dashboard administrativo con estadísticas

## Sistema de autenticación:
Esta API utiliza **cookies HttpOnly** para almacenar los tokens JWT, proporcionando mayor seguridad:

- **access_token**: Cookie HttpOnly con duración de 15 minutos
- **refresh_token**: Cookie HttpOnly con duración de 7 días

### Importante para probar en Swagger:
Swagger UI tiene limitaciones con cookies HttpOnly. Para probar los endpoints:

1. Usar Postman, Insomnia o Thunder Client
2. Usar el navegador directamente con fetch/axios desde la consola
3. En caso de decidir usar Swagger, abrir las herramientas de desarrollador y extraer las cookies manualmente.

## Roles y permisos:
- **Admin**: Gestión completa de usuarios y acceso a métricas
- **Doctor**: Crear y ver prescripciones
- **Patient**: Ver y consumir sus propias prescripciones, descargar PDFs

## Diseñado con ❤️ por Steven León para Nutrabiotics
`

    )
    .setVersion('1.0')
    .addCookieAuth(
      'access_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'JWT Access Token almacenado en cookie HttpOnly',
      },
      'cookie-auth',
    )
    .addTag('Auth', 'Endpoints de autenticación y gestión de sesiones')
    .addTag('Users', 'Gestión de usuarios (solo admin)')
    .addTag('Prescriptions', 'Gestión de prescripciones médicas')
    .addTag('Metrics', 'Métricas y estadísticas (solo admin)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Prescriptions MVP API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/docs`);
}
bootstrap();
