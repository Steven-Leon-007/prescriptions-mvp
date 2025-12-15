import { Controller, Post, Body, Get, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtRefreshAuthGuard } from '../common/guards/jwt-refresh-auth.guard';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario. Dependiendo del rol, se crean registros adicionales (Doctor o Patient).',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente. Los tokens se envían en cookies HttpOnly.',
    schema: {
      example: {
        user: {
          id: 'clg1h2j3k4l5m6n7o8p9',
          email: 'doctor@example.com',
          name: 'Dr. Juan Pérez',
          role: 'doctor',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, res);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve tokens JWT. El refresh token se envía en una cookie HttpOnly.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'doctor@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso. Los tokens se envían en cookies HttpOnly.',
    schema: {
      example: {
        user: {
          id: 'clg1h2j3k4l5m6n7o8p9',
          email: 'doctor@example.com',
          name: 'Dr. Juan Pérez',
          role: 'doctor',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(body.email, body.password, res);
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refrescar access token',
    description: 'Genera un nuevo access token usando el refresh token almacenado en cookie.',
  })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente. Los nuevos tokens se envían en cookies HttpOnly.',
    schema: {
      example: {
        user: {
          id: 'clg1h2j3k4l5m6n7o8p9',
          email: 'doctor@example.com',
          name: 'Dr. Juan Pérez',
          role: 'doctor',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    return this.authService.refresh(user.id, refreshToken, res);
  }

  @Get('profile')
  @ApiCookieAuth('cookie-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Devuelve la información del usuario actual basándose en el JWT almacenado en cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    schema: {
      example: {
        user: {
          id: 'clg1h2j3k4l5m6n7o8p9',
          email: 'doctor@example.com',
          name: 'Dr. Juan Pérez',
          role: 'doctor',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getProfile(@CurrentUser() user: any) {
    return { user };
  }

  @Post('logout')
  @ApiCookieAuth('cookie-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token y limpia las cookies.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    return this.authService.logout(user.id, refreshToken, res);
  }
}