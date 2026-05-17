import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Maintenance, MaintenanceDocument, MaintenanceStatus } from './schemas/maintenance.schema';
import { VehiclesService } from '../vehicles/vehicles.service';
import { HistoryService } from '../history/history.service';
import { EventType } from '../history/schemas/history-event.schema';

export class CreateMaintenanceDto {
  vehicleId: string;
  type: string;
  scheduledDate: Date;
  description: string;
  workshopName?: string;
  workshopPhone?: string;
  services?: string[];
  cost?: number;
  mileageAtService?: number;
  nextServiceMileage?: number;
  nextServiceDate?: Date;
  notes?: string;
}

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectModel(Maintenance.name)
    private maintenanceModel: Model<MaintenanceDocument>,
    private vehiclesService: VehiclesService,
    private historyService: HistoryService,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const maintenance = new this.maintenanceModel({
      ...dto,
      vehicleId: new Types.ObjectId(dto.vehicleId),
    });

    const saved = await maintenance.save();

    await this.historyService.record({
      vehicleId: dto.vehicleId,
      type: EventType.MAINTENANCE_SCHEDULED,
      title: 'Manutenção agendada',
      description: `${dto.description} - ${dto.workshopName ?? 'Oficina não informada'}`,
      metadata: { maintenanceId: saved._id, type: dto.type, cost: dto.cost },
    });

    return saved;
  }

  async findAll(
    page = 1,
    limit = 10,
    vehicleId?: string,
    status?: MaintenanceStatus,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (vehicleId) filter.vehicleId = new Types.ObjectId(vehicleId);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.maintenanceModel
        .find(filter)
        .populate('vehicleId', 'licensePlate brand model color')
        .skip(skip)
        .limit(limit)
        .sort({ scheduledDate: -1 }),
      this.maintenanceModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceModel
      .findById(id)
      .populate('vehicleId', 'licensePlate brand model color year');
    if (!maintenance) throw new Error(`Manutenção ${id} não encontrada.`);
    return maintenance;
  }

  async complete(id: string, cost: number, notes?: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: MaintenanceStatus.COMPLETED,
          completedDate: new Date(),
          cost,
          notes,
        },
      },
      { new: true },
    );

    if (!maintenance) throw new Error(`Manutenção ${id} não encontrada.`);

    await this.historyService.record({
      vehicleId: maintenance.vehicleId.toString(),
      type: EventType.MAINTENANCE_COMPLETED,
      title: 'Manutenção concluída',
      description: maintenance.description,
      metadata: { maintenanceId: id, cost },
    });

    if (maintenance.nextServiceDate) {
      await this.vehiclesService.update(maintenance.vehicleId.toString(), {
        nextMaintenanceDate: maintenance.nextServiceDate,
        nextMaintenanceMileage: maintenance.nextServiceMileage,
      } as any);
    }

    return maintenance;
  }

  async findUpcoming(daysAhead = 7): Promise<Maintenance[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + daysAhead);

    return this.maintenanceModel
      .find({
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: { $lte: limit, $gte: new Date() },
      })
      .populate('vehicleId', 'licensePlate brand model');
  }

  async getTotalCostByVehicle(): Promise<any[]> {
    return this.maintenanceModel.aggregate([
      { $match: { status: MaintenanceStatus.COMPLETED } },
      {
        $group: {
          _id: '$vehicleId',
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          'vehicle.licensePlate': 1,
          'vehicle.brand': 1,
          'vehicle.model': 1,
          totalCost: 1,
          count: 1,
        },
      },
      { $sort: { totalCost: -1 } },
    ]);
  }
}
