import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HistoryEvent, HistoryEventDocument, EventType, EventSource } from './schemas/history-event.schema';

export interface RecordEventDto {
  vehicleId: string;
  driverId?: string;
  type: EventType;
  source?: EventSource;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdBy?: string;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(HistoryEvent.name)
    private historyEventModel: Model<HistoryEventDocument>,
  ) {}

  async record(dto: RecordEventDto): Promise<HistoryEvent> {
    const event = new this.historyEventModel({
      ...dto,
      vehicleId: new Types.ObjectId(dto.vehicleId),
      driverId: dto.driverId ? new Types.ObjectId(dto.driverId) : null,
    });
    return event.save();
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.historyEventModel
        .find()
        .populate('vehicleId', 'licensePlate brand model')
        .populate('driverId', 'name phone cpf')
        .skip(skip)
        .limit(limit)
        .sort({ occurredAt: -1 }),
      this.historyEventModel.countDocuments(),
    ]);

    return { data, total, page, limit };
  }

  async findByVehicle(
    vehicleId: string,
    page = 1,
    limit = 20,
    type?: EventType,
  ) {
    const filter: any = { vehicleId: new Types.ObjectId(vehicleId) };
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.historyEventModel
        .find(filter)
        .populate('driverId', 'name phone cpf')
        .skip(skip)
        .limit(limit)
        .sort({ occurredAt: -1 }),
      this.historyEventModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findByDriver(driverId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = { driverId: new Types.ObjectId(driverId) };

    const [data, total] = await Promise.all([
      this.historyEventModel
        .find(filter)
        .populate('vehicleId', 'licensePlate brand model')
        .skip(skip)
        .limit(limit)
        .sort({ occurredAt: -1 }),
      this.historyEventModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }
}
