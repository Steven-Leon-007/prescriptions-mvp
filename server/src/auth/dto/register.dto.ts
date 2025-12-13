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

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  // Para doctores
  @IsString()
  @IsOptional()
  specialty?: string;

  // Para pacientes
  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
