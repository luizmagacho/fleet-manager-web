import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export enum FuelType {
  FLEX = 'FLEX',
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
}

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  licensePlate: string;

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  modelYear: number;

  @Prop({ trim: true })
  color: string;

  @Prop({ required: true, unique: true, trim: true })
  renavam: string;

  @Prop({ required: true, unique: true, trim: true })
  chassis: string;

  @Prop({ enum: FuelType, default: FuelType.FLEX })
  fuelType: FuelType;

  @Prop({ enum: TransmissionType, default: TransmissionType.MANUAL })
  transmission: TransmissionType;

  @Prop()
  mileage: number;

  @Prop({ type: String, enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @Prop({ type: Types.ObjectId, ref: 'Driver', default: null })
  currentDriverId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ trim: true })
  crlvDocument: string;

  @Prop({ trim: true })
  insuranceDocument: string;

  @Prop()
  insuranceExpiration: Date;

  @Prop()
  ipvaDueDate: Date;

  @Prop()
  licensingDueDate: Date;

  @Prop()
  nextMaintenanceDate: Date;

  @Prop()
  nextMaintenanceMileage: number;

  @Prop()
  purchaseValue: number;

  @Prop()
  currentValue: number;

  @Prop({ trim: true })
  notes: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ licensePlate: 1 });
VehicleSchema.index({ renavam: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ brand: 'text', model: 'text', licensePlate: 'text' });
