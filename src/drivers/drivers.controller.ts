import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverStatus } from './schemas/driver.schema';

@ApiTags('Motoristas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo motorista' })
  @ApiResponse({ status: 201, description: 'Motorista cadastrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'CPF ou CNH já cadastrado.' })
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os motoristas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DriverStatus })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: DriverStatus,
  ) {
    return this.driversService.findAll(page, limit, search, status);
  }

  @Get('alerts/expiring-license')
  @ApiOperation({ summary: 'Motoristas com CNH próxima ao vencimento' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  findExpiringLicenses(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.driversService.findWithExpiringLicense(days);
  }

  @Get('stats/by-status')
  @ApiOperation({ summary: 'Estatísticas de motoristas por status' })
  countByStatus() {
    return this.driversService.countByStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar motorista por ID' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados do motorista' })
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload da foto do motorista' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/drivers',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Apenas imagens são permitidas!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.driversService.updatePhoto(id, `/uploads/drivers/${file.filename}`);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover motorista' })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}
