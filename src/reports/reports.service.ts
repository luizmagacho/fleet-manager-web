import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance, MaintenanceDocument, MaintenanceStatus } from '../maintenances/schemas/maintenance.schema';
import { DriversService } from '../drivers/drivers.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { RentalsService } from '../rentals/rentals.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Maintenance.name)
    private maintenanceModel: Model<MaintenanceDocument>,
    private driversService: DriversService,
    private vehiclesService: VehiclesService,
    private rentalsService: RentalsService,
  ) {}

  async getDashboardKpis(): Promise<any> {
    const [
      vehicleStats,
      driverStats,
      financialSummary,
    ] = await Promise.all([
      this.vehiclesService.countByStatus(),
      this.driversService.countByStatus(),
      this.rentalsService.getFinancialSummary(),
    ]);

    const maintenancePending = await this.maintenanceModel.countDocuments({
      status: MaintenanceStatus.SCHEDULED,
    });

    return {
      vehicles: {
        total: Object.values(vehicleStats).reduce((a: number, b: number) => a + b, 0),
        available: vehicleStats['AVAILABLE'] ?? 0,
        rented: vehicleStats['RENTED'] ?? 0,
        maintenance: vehicleStats['MAINTENANCE'] ?? 0,
        inactive: vehicleStats['INACTIVE'] ?? 0,
      },
      drivers: {
        total: Object.values(driverStats).reduce((a: number, b: number) => a + b, 0),
        active: driverStats['ACTIVE'] ?? 0,
        inactive: driverStats['INACTIVE'] ?? 0,
        suspended: driverStats['SUSPENDED'] ?? 0,
      },
      financial: financialSummary,
      maintenancePending,
    };
  }

  async getMonthlyRevenue(months = 6): Promise<any[]> {
    const result = await this.rentalsService['rentalModel']?.aggregate?.([
      { $unwind: '$payments' },
      { $match: { 'payments.status': 'PAID' } },
      {
        $group: {
          _id: {
            year: { $year: '$payments.paidAt' },
            month: { $month: '$payments.paidAt' },
          },
          total: { $sum: '$payments.amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: months },
    ]) ?? [];

    return result;
  }

  async getFinancialPerVehicle(): Promise<any[]> {
    const vehicles = await this.vehiclesService['vehicleModel'].find().select('_id licensePlate brand model').lean();
    
    const results = await Promise.all(vehicles.map(async (v) => {
      // Receita total de alugueis
      const rentals = await this.rentalsService['rentalModel'].find({ vehicleId: v._id }).lean();
      const revenue = rentals.reduce((sum, r) => {
        return sum + (r.payments?.filter(p => p.status === 'PAID').reduce((pSum, p) => pSum + p.amount, 0) || 0);
      }, 0);

      // Custo total de manutenção
      const maintenances = await this.maintenanceModel.find({ vehicleId: v._id }).lean();
      const maintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

      return {
        vehicleId: v._id,
        licensePlate: v.licensePlate,
        name: `${v.brand} ${v.model}`,
        revenue,
        maintenanceCost,
        finesCost: 0, // Mock for now unless tracked in DB
        profit: revenue - maintenanceCost
      };
    }));

    return results.sort((a, b) => b.profit - a.profit);
  }

  async getMileagePerVehicle(): Promise<any[]> {
    const vehicles = await this.vehiclesService['vehicleModel'].find().select('_id licensePlate brand model mileage').lean();
    
    return vehicles.map(v => ({
      vehicleId: v._id,
      licensePlate: v.licensePlate,
      name: `${v.brand} ${v.model}`,
      mileage: v.mileage || 0
    })).sort((a, b) => b.mileage - a.mileage);
  }
}
