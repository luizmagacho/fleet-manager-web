import {
  IsString,
  IsEmail,
  IsEnum,
  IsDate,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenseCategory } from '../schemas/driver.schema';

export class CreateDriverDto {
  @ApiProperty({ description: 'Nome completo do motorista' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'CPF (somente números)', example: '12345678901' })
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  cpf: string;

  @ApiProperty({ description: 'Número da CNH', example: '01234567891' })
  @IsString()
  @MinLength(9)
  @MaxLength(11)
  licenseNumber: string;

  @ApiProperty({ description: 'Categoria da CNH', enum: LicenseCategory })
  @IsEnum(LicenseCategory)
  licenseCategory: LicenseCategory;

  @ApiProperty({ description: 'Data de validade da CNH' })
  @Type(() => Date)
  @IsDate()
  licenseExpiration: Date;

  @ApiProperty({ description: 'Telefone', example: '41999997210' })
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @ApiProperty({ description: 'E-mail' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Endereço completo' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Plataformas de transporte (Uber, 99, InDriver...)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
