import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'doctor@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Dr. Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: Role,
    example: Role.doctor,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiPropertyOptional({
    description: 'Especialidad médica (requerido para doctores)',
    example: 'Cardiología',
  })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (requerido para pacientes)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
