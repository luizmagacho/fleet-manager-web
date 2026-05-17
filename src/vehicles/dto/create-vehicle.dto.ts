import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, TransmissionType } from '../schemas/vehicle.schema';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Placa do veículo', example: 'ABC1D23' })
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  licensePlate: string;

  @ApiProperty({ description: 'Marca', example: 'Toyota' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'Modelo', example: 'Corolla' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Ano de fabricação', example: 2022 })
  @IsNumber()
  @Min(1990)
  year: number;

  @ApiProperty({ description: 'Ano do modelo', example: 2023 })
  @IsNumber()
  modelYear: number;

  @ApiPropertyOptional({ description: 'Cor', example: 'Branco' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'RENAVAM (11 dígitos)', example: '12345678901' })
  @IsString()
  @MinLength(9)
  @MaxLength(11)
  renavam: string;

  @ApiProperty({ description: 'Chassi (17 caracteres)', example: '9BWZZZ377VT004251' })
  @IsString()
  @MinLength(17)
  @MaxLength(17)
  chassis: string;

  @ApiPropertyOptional({ enum: FuelType, description: 'Tipo de combustível' })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ enum: TransmissionType, description: 'Tipo de câmbio' })
  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @ApiPropertyOptional({ description: 'Quilometragem atual' })
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiPropertyOptional({ description: 'Data de vencimento do IPVA' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  ipvaDueDate?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento do licenciamento' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  licensingDueDate?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento do seguro' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  insuranceExpiration?: Date;

  @ApiPropertyOptional({ description: 'Valor de compra' })
  @IsOptional()
  @IsNumber()
  purchaseValue?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
