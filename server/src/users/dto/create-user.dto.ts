import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(Role)
    role: Role;

    @IsOptional()
    @IsString()
    specialty?: string;

    @IsOptional()
    @IsDateString()
    birthDate?: string;
}