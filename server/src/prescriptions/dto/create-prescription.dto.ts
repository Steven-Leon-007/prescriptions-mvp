import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionItemDto {
  @ApiProperty({
    description: 'Nombre del medicamento',
    example: 'Ibuprofeno',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Dosis del medicamento',
    example: '400mg',
  })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de unidades',
    example: 20,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Instrucciones de uso',
    example: 'Tomar cada 8 horas después de las comidas',
  })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({
    description: 'ID del paciente para quien se prescribe',
    example: 'clg1h2j3k4l5m6n7o8p9',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales del doctor',
    example: 'Paciente con alergia a la penicilina',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Lista de medicamentos prescritos',
    type: [CreatePrescriptionItemDto],
    example: [
      {
        name: 'Ibuprofeno',
        dosage: '400mg',
        quantity: 20,
        instructions: 'Cada 8 horas',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
