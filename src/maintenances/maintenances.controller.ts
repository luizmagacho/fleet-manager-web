import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenancesService, CreateMaintenanceDto } from './maintenances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceStatus } from './schemas/maintenance.schema';
import { IsNumber, IsOptional, IsString } from 'class-validator';

class CompleteMaintenanceDto {
  @IsNumber()
  cost: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Manutenções')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nova manutenção' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar manutenções' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: MaintenanceStatus,
  ) {
    return this.maintenancesService.findAll(page, limit, vehicleId, status);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Manutenções agendadas nos próximos dias' })
  findUpcoming(@Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number) {
    return this.maintenancesService.findUpcoming(days);
  }

  @Get('cost-by-vehicle')
  @ApiOperation({ summary: 'Custo total de manutenção por veículo' })
  getCostByVehicle() {
    return this.maintenancesService.getTotalCostByVehicle();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenancesService.findById(id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Marcar manutenção como concluída' })
  complete(@Param('id') id: string, @Body() dto: CompleteMaintenanceDto) {
    return this.maintenancesService.complete(id, dto.cost, dto.notes);
  }
}
