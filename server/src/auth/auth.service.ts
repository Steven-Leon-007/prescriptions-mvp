import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          role: registerDto.role,
          ...(registerDto.role === 'doctor' && {
            doctor: {
              create: { specialty: registerDto.specialty },
            },
          }),
          ...(registerDto.role === 'patient' && {
            patient: {
              create: {
                birthDate: registerDto.birthDate
                  ? new Date(registerDto.birthDate)
                  : null,
              },
            },
          }),
        },
        include: { doctor: true, patient: true },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('El email ya está registrado');
        }
      }
      throw error;
    }
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    this.setTokensCookies(res, accessToken, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(userId: string, oldRefreshToken: string, res: Response) {
    await this.prisma.refreshToken.delete({
      where: { token: oldRefreshToken },
    });

    const { accessToken, refreshToken } = await this.generateTokens(userId);

    this.setTokensCookies(res, accessToken, refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return { user };
  }

  async logout(userId: string, refreshToken: string, res: Response) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt,
      },
    });

    const refreshTokenPayload = {
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return { accessToken, refreshToken };
  }

  private setTokensCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}