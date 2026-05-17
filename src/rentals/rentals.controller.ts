import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto, RecordPaymentDto, UpdateRentalDto } from './dto/create-rental.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RentalStatus } from './schemas/rental.schema';

@ApiTags('Aluguéis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo aluguel' })
  create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os aluguéis' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: RentalStatus })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: RentalStatus,
  ) {
    return this.rentalsService.findAll(page, limit, status);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Listar aluguéis com pagamentos atrasados' })
  findOverdue() {
    return this.rentalsService.findOverduePayments();
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Resumo financeiro dos aluguéis' })
  getFinancialSummary() {
    return this.rentalsService.getFinancialSummary();
  }

  @Get('payments/pending')
  @ApiOperation({ summary: 'Listar todos os pagamentos pendentes e atrasados' })
  getPendingPayments() {
    return this.rentalsService.getPendingPayments();
  }

  @Get('by-driver/:driverId')
  @ApiOperation({ summary: 'Aluguéis de um motorista específico' })
  findByDriver(@Param('driverId') driverId: string) {
    return this.rentalsService.findByDriver(driverId);
  }

  @Get('by-vehicle/:vehicleId')
  @ApiOperation({ summary: 'Aluguéis de um veículo específico' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.rentalsService.findByVehicle(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aluguel por ID' })
  findOne(@Param('id') id: string) {
    return this.rentalsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar aluguel' })
  update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
    return this.rentalsService.update(id, updateRentalDto);
  }

  @Put(':id/payment')
  @ApiOperation({ summary: 'Registrar pagamento de parcela' })
  recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.rentalsService.recordPayment(id, recordPaymentDto);
  }

  @Put(':id/terminate')
  @ApiOperation({ summary: 'Encerrar aluguel' })
  terminate(@Param('id') id: string) {
    return this.rentalsService.terminate(id);
  }
}
