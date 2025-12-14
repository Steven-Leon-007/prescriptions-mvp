import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new patient successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'patient' as any,
        birthDate: '1990-01-01',
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: registerDto.role,
        createdAt: new Date(),
        patient: { id: 'patient-id', birthDate: new Date('1990-01-01') },
        doctor: null,
      };

      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: '',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        token: 'refresh-token',
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.register(registerDto, mockResponse);

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'patient' as any,
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.register(registerDto, mockResponse)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 'user-id',
        email,
        password: hashedPassword,
        name: 'Test User',
        role: 'patient',
      };

      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: '',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        token: 'refresh-token',
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(email, password, mockResponse);

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('invalid@example.com', 'password', mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        name: 'Test User',
        role: 'patient',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login('test@example.com', 'wrongpassword', mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = 'user-id';
      const refreshToken = 'refresh-token';

      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(userId, refreshToken, mockResponse);

      expect(result.message).toBe('Sesión cerrada exitosamente');
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId, token: refreshToken },
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
