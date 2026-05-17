/**
 * seed-data.js — GestorFrota PR
 * Cria 15 motoristas, 20 veículos, múltiplos contratos com pagamentos
 * pendentes, atrasados (com multa 2% + juros 1%/mês) e pagos.
 * Multas conforme mercado BR: 2% sobre valor + 1% a.m. de juros moratórios.
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestor-frota-pr';

const DAY = 1000 * 60 * 60 * 24;
const now = new Date();
const daysAgo = (n) => new Date(Date.now() - DAY * n);
const daysFrom = (n) => new Date(Date.now() + DAY * n);

/** Calcula multa+juros BR: 2% flat + 1%/mês pro-rata */
function calcFine(amount, daysLate) {
  const fine = amount * 0.02;
  const interest = amount * (0.01 / 30) * daysLate;
  return Math.round((fine + interest) * 100) / 100;
}

function makePayments(startDate, amount, frequency, periods) {
  const freq = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };
  const step = freq[frequency] || 7;
  const payments = [];
  let date = new Date(startDate);
  for (let i = 0; i < periods; i++) {
    const dueDate = new Date(date);
    const daysLate = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / DAY));
    let status = 'PENDING';
    let paidAt = undefined;
    let fine = 0;
    if (dueDate < now && daysLate > 0) {
      // first payment of overdue contracts: paid; rest: overdue
      status = 'PENDING'; // will be overridden per contract
    }
    payments.push({ _id: new ObjectId(), dueDate, amount, status, fine, paidAt, paymentMethod: undefined, notes: undefined });
    date.setDate(date.getDate() + step);
  }
  return payments;
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();

    await db.collection('drivers').deleteMany({});
    await db.collection('vehicles').deleteMany({});
    await db.collection('rentals').deleteMany({});
    await db.collection('maintenances').deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ─── DRIVERS (15) ───────────────────────────────────────────
    const driverIds = Array.from({ length: 15 }, () => new ObjectId());
    const driversData = [
      { name: 'João Silva',         cpf: '111.111.111-11', licenseNumber: '12345678901', licenseCategory: 'B',  licenseExpiration: daysFrom(365),  phone: '41999991111', email: 'joao.silva@email.com',       city: 'Curitiba',          status: 'ACTIVE',    rating: 4.8 },
      { name: 'Maria Oliveira',     cpf: '222.222.222-22', licenseNumber: '23456789012', licenseCategory: 'AB', licenseExpiration: daysFrom(180),  phone: '41988882222', email: 'maria.oliveira@email.com',   city: 'Londrina',          status: 'ACTIVE',    rating: 5.0 },
      { name: 'Carlos Souza',       cpf: '333.333.333-33', licenseNumber: '34567890123', licenseCategory: 'D',  licenseExpiration: daysAgo(10),    phone: '41977773333', email: 'carlos.souza@email.com',     city: 'Maringá',           status: 'SUSPENDED', rating: 3.5, notes: 'CNH Vencida' },
      { name: 'Ana Costa',          cpf: '444.444.444-44', licenseNumber: '45678901234', licenseCategory: 'B',  licenseExpiration: daysFrom(200),  phone: '41966664444', email: 'ana.costa@email.com',        city: 'Ponta Grossa',      status: 'ACTIVE',    rating: 4.9 },
      { name: 'Pedro Alves',        cpf: '555.555.555-55', licenseNumber: '56789012345', licenseCategory: 'B',  licenseExpiration: daysFrom(90),   phone: '41955555555', email: 'pedro.alves@email.com',      city: 'Cascavel',          status: 'ACTIVE',    rating: 4.6 },
      { name: 'Fernanda Lima',      cpf: '666.666.666-66', licenseNumber: '67890123456', licenseCategory: 'AB', licenseExpiration: daysFrom(400),  phone: '41944446666', email: 'fernanda.lima@email.com',    city: 'Foz do Iguaçu',    status: 'ACTIVE',    rating: 4.7 },
      { name: 'Roberto Gomes',      cpf: '777.777.777-77', licenseNumber: '78901234567', licenseCategory: 'B',  licenseExpiration: daysFrom(25),   phone: '41933337777', email: 'roberto.gomes@email.com',    city: 'São José dos Pinhais', status: 'ACTIVE', rating: 4.3 },
      { name: 'Patrícia Santos',    cpf: '888.888.888-88', licenseNumber: '89012345678', licenseCategory: 'B',  licenseExpiration: daysFrom(500),  phone: '41922228888', email: 'patricia.santos@email.com',  city: 'Guarapuava',        status: 'ACTIVE',    rating: 4.8 },
      { name: 'Lucas Ferreira',     cpf: '999.999.999-99', licenseNumber: '90123456789', licenseCategory: 'D',  licenseExpiration: daysFrom(300),  phone: '41911119999', email: 'lucas.ferreira@email.com',   city: 'Apucarana',         status: 'ACTIVE',    rating: 4.5 },
      { name: 'Camila Rodrigues',   cpf: '101.010.101-01', licenseNumber: '01234567890', licenseCategory: 'AB', licenseExpiration: daysFrom(100),  phone: '41900001010', email: 'camila.rodrigues@email.com', city: 'Curitiba',          status: 'ACTIVE',    rating: 5.0 },
      { name: 'Marcos Pereira',     cpf: '121.212.121-21', licenseNumber: '11234567891', licenseCategory: 'B',  licenseExpiration: daysFrom(20),   phone: '41988771212', email: 'marcos.pereira@email.com',   city: 'Paranaguá',         status: 'ACTIVE',    rating: 4.2 },
      { name: 'Juliana Martins',    cpf: '131.313.131-31', licenseNumber: '21234567892', licenseCategory: 'B',  licenseExpiration: daysAgo(5),     phone: '41977661313', email: 'juliana.martins@email.com',  city: 'Toledo',            status: 'INACTIVE',  rating: 3.8, notes: 'CNH expirada' },
      { name: 'André Nascimento',   cpf: '141.414.141-41', licenseNumber: '31234567893', licenseCategory: 'C',  licenseExpiration: daysFrom(600),  phone: '41966551414', email: 'andre.nascimento@email.com', city: 'Umuarama',          status: 'ACTIVE',    rating: 4.6 },
      { name: 'Beatriz Carvalho',   cpf: '151.515.151-51', licenseNumber: '41234567894', licenseCategory: 'B',  licenseExpiration: daysFrom(250),  phone: '41955441515', email: 'beatriz.carvalho@email.com', city: 'Curitiba',          status: 'ACTIVE',    rating: 4.9 },
      { name: 'Rafael Moreira',     cpf: '161.616.161-61', licenseNumber: '51234567895', licenseCategory: 'AB', licenseExpiration: daysFrom(45),   phone: '41944331616', email: 'rafael.moreira@email.com',   city: 'Campo Mourão',      status: 'ACTIVE',    rating: 4.4 },
    ];

    const drivers = driversData.map((d, i) => ({
      _id: driverIds[i], ...d,
      address: `Rua ${['das Flores', 'do Comércio', 'Brasil', 'XV de Novembro', 'Sete de Setembro'][i % 5]}, ${(i + 1) * 100}`,
      zipCode: `8${String(i).padStart(4, '0')}-000`,
      createdAt: daysAgo(180 - i * 10), updatedAt: new Date(),
    }));

    await db.collection('drivers').insertMany(drivers);
    console.log(`👤 Created ${drivers.length} drivers`);

    // ─── VEHICLES (20) ──────────────────────────────────────────
    const vehicleIds = Array.from({ length: 20 }, () => new ObjectId());
    const vehiclesRaw = [
      { plate: 'ABC-1234', brand: 'Volkswagen',  model: 'Gol',         year: 2021, color: 'Branco',  renavam: '11111111111', fuel: 'FLEX',     trans: 'MANUAL',    mileage: 45000  },
      { plate: 'XYZ-9876', brand: 'Chevrolet',   model: 'Onix',        year: 2023, color: 'Prata',   renavam: '22222222222', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 15000  },
      { plate: 'QWE-4321', brand: 'Hyundai',     model: 'HB20',        year: 2020, color: 'Preto',   renavam: '33333333333', fuel: 'FLEX',     trans: 'MANUAL',    mileage: 85000  },
      { plate: 'RTY-5678', brand: 'Fiat',        model: 'Argo',        year: 2022, color: 'Vermelho', renavam: '44444444444', fuel: 'FLEX',    trans: 'MANUAL',    mileage: 32000  },
      { plate: 'UIO-2345', brand: 'Renault',     model: 'Kwid',        year: 2022, color: 'Azul',    renavam: '55555555555', fuel: 'FLEX',     trans: 'MANUAL',    mileage: 28000  },
      { plate: 'PAS-6789', brand: 'Toyota',      model: 'Etios',       year: 2019, color: 'Branco',  renavam: '66666666666', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 72000  },
      { plate: 'DFG-3456', brand: 'Ford',        model: 'Ka',          year: 2020, color: 'Cinza',   renavam: '77777777777', fuel: 'FLEX',     trans: 'MANUAL',    mileage: 58000  },
      { plate: 'HJK-7890', brand: 'Volkswagen',  model: 'Polo',        year: 2023, color: 'Branco',  renavam: '88888888888', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 8000   },
      { plate: 'LZX-1122', brand: 'Chevrolet',   model: 'Tracker',     year: 2022, color: 'Preto',   renavam: '99999999999', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 25000  },
      { plate: 'CVB-3344', brand: 'Hyundai',     model: 'Creta',       year: 2023, color: 'Prata',   renavam: '10101010101', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 12000  },
      { plate: 'NMQ-5566', brand: 'Fiat',        model: 'Pulse',       year: 2022, color: 'Azul',    renavam: '20202020202', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 19000  },
      { plate: 'WER-7788', brand: 'Toyota',      model: 'Corolla',     year: 2021, color: 'Branco',  renavam: '30303030303', fuel: 'HYBRID',   trans: 'AUTOMATIC', mileage: 38000  },
      { plate: 'TYU-9900', brand: 'Jeep',        model: 'Renegade',    year: 2022, color: 'Verde',   renavam: '40404040404', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 22000  },
      { plate: 'IOP-1133', brand: 'Volkswagen',  model: 'T-Cross',     year: 2023, color: 'Cinza',   renavam: '50505050505', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 5000   },
      { plate: 'ASD-2244', brand: 'Renault',     model: 'Duster',      year: 2021, color: 'Vermelho', renavam: '60606060606', fuel: 'FLEX',   trans: 'MANUAL',    mileage: 47000  },
      { plate: 'FGH-3355', brand: 'Nissan',      model: 'Kicks',       year: 2022, color: 'Branco',  renavam: '70707070707', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 30000  },
      { plate: 'JKL-4466', brand: 'Honda',       model: 'HR-V',        year: 2023, color: 'Preto',   renavam: '80808080808', fuel: 'FLEX',     trans: 'AUTOMATIC', mileage: 7000   },
      { plate: 'ZXC-5577', brand: 'Fiat',        model: 'Strada',      year: 2021, color: 'Prata',   renavam: '90909090909', fuel: 'FLEX',     trans: 'MANUAL',    mileage: 62000  },
      { plate: 'VBN-6688', brand: 'Chevrolet',   model: 'S10',         year: 2020, color: 'Preto',   renavam: '11122233344', fuel: 'DIESEL',   trans: 'AUTOMATIC', mileage: 95000  },
      { plate: 'MNP-7799', brand: 'Ford',        model: 'Ranger',      year: 2022, color: 'Azul',    renavam: '22233344455', fuel: 'DIESEL',   trans: 'AUTOMATIC', mileage: 41000  },
    ];

    // Rentals will reference vehicles — define statuses now
    // Vehicles 0-11 will be RENTED, 12-14 AVAILABLE, 15-16 MAINTENANCE, 17-19 AVAILABLE
    const vehicleStatuses = [
      'RENTED','RENTED','RENTED','RENTED','RENTED','RENTED',
      'RENTED','RENTED','RENTED','RENTED','RENTED','RENTED',
      'AVAILABLE','AVAILABLE','AVAILABLE',
      'MAINTENANCE','MAINTENANCE',
      'AVAILABLE','AVAILABLE','AVAILABLE',
    ];

    const vehicles = vehiclesRaw.map((v, i) => ({
      _id: vehicleIds[i],
      licensePlate: v.plate, brand: v.brand, model: v.model,
      year: v.year, modelYear: v.year + 1, color: v.color,
      renavam: v.renavam, chassis: `9BR${v.renavam.slice(0,8)}`,
      fuelType: v.fuel, transmission: v.trans, mileage: v.mileage,
      status: vehicleStatuses[i],
      currentDriverId: vehicleStatuses[i] === 'RENTED' ? driverIds[i] : null,
      purchasePrice: 40000 + i * 3500,
      ipvaDueDate: daysFrom(30 + i * 15),
      licensingDueDate: daysFrom(60 + i * 10),
      insuranceExpiration: daysFrom(90 + i * 20),
      createdAt: daysAgo(365 - i * 15), updatedAt: new Date(),
    }));

    await db.collection('vehicles').insertMany(vehicles);
    console.log(`🚗 Created ${vehicles.length} vehicles`);

    // ─── RENTALS (12 active) ─────────────────────────────────────
    // Rental configs: [vehicleIdx, driverIdx, startDaysAgo, endDaysFrom, amount, freq, periods, scenario]
    // scenarios: 'healthy', 'overdue_1', 'overdue_2', 'overdue_30', 'overdue_60', 'completed_soon'
    const rentalConfigs = [
      // Healthy — pagamentos em dia
      { vi: 0,  di: 0,  startAgo: 30,  endFrom: 60,  amount: 600,  freq: 'WEEKLY',    periods: 12, scenario: 'healthy' },
      { vi: 1,  di: 1,  startAgo: 45,  endFrom: 45,  amount: 800,  freq: 'BIWEEKLY',  periods: 6,  scenario: 'mostly_paid' },
      { vi: 3,  di: 3,  startAgo: 10,  endFrom: 80,  amount: 1200, freq: 'MONTHLY',   periods: 3,  scenario: 'healthy' },
      // Atraso leve (1–7 dias)
      { vi: 4,  di: 4,  startAgo: 21,  endFrom: 42,  amount: 700,  freq: 'WEEKLY',    periods: 9,  scenario: 'overdue_3' },
      { vi: 5,  di: 5,  startAgo: 60,  endFrom: 30,  amount: 900,  freq: 'BIWEEKLY',  periods: 6,  scenario: 'overdue_5' },
      // Atraso médio (15–30 dias)
      { vi: 6,  di: 6,  startAgo: 75,  endFrom: 15,  amount: 550,  freq: 'WEEKLY',    periods: 13, scenario: 'overdue_20' },
      { vi: 7,  di: 7,  startAgo: 90,  endFrom: 30,  amount: 1500, freq: 'MONTHLY',   periods: 3,  scenario: 'overdue_28' },
      // Atraso grave (30–60 dias)
      { vi: 8,  di: 8,  startAgo: 120, endFrom: 0,   amount: 650,  freq: 'WEEKLY',    periods: 18, scenario: 'overdue_45' },
      { vi: 9,  di: 9,  startAgo: 150, endFrom: 30,  amount: 1800, freq: 'MONTHLY',   periods: 5,  scenario: 'overdue_60' },
      // Quase encerrado
      { vi: 10, di: 10, startAgo: 80,  endFrom: 7,   amount: 600,  freq: 'WEEKLY',    periods: 12, scenario: 'ending_soon' },
      // Pagamento parcial
      { vi: 11, di: 11, startAgo: 60,  endFrom: 60,  amount: 950,  freq: 'BIWEEKLY',  periods: 8,  scenario: 'partial' },
      // Vencimento próximo
      { vi: 2,  di: 13, startAgo: 20,  endFrom: 3,   amount: 750,  freq: 'WEEKLY',    periods: 4,  scenario: 'due_soon' },
    ];

    const rentals = rentalConfigs.map((cfg) => {
      const startDate = daysAgo(cfg.startAgo);
      const expectedEndDate = daysFrom(cfg.endFrom);
      const freq = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };
      const step = freq[cfg.freq];

      let payments = [];
      let cursor = new Date(startDate);

      for (let i = 0; i < cfg.periods; i++) {
        const dueDate = new Date(cursor);
        const msLate = Date.now() - dueDate.getTime();
        const daysLate = Math.floor(msLate / DAY);
        const fine = daysLate > 0 ? calcFine(cfg.amount, daysLate) : 0;

        let status = 'PENDING';
        let paidAt = undefined;

        if (cfg.scenario === 'healthy') {
          if (dueDate < now) { status = 'PAID'; paidAt = new Date(dueDate.getTime() + DAY); }
        } else if (cfg.scenario === 'mostly_paid') {
          if (i < cfg.periods - 2 && dueDate < now) { status = 'PAID'; paidAt = new Date(dueDate.getTime() + DAY); }
          else if (dueDate < now) status = 'OVERDUE';
        } else if (cfg.scenario.startsWith('overdue_')) {
          const overdueDays = parseInt(cfg.scenario.split('_')[1]);
          const cutoff = new Date(Date.now() - DAY * overdueDays);
          if (dueDate < cutoff) { status = 'PAID'; paidAt = new Date(dueDate.getTime() + DAY); }
          else if (dueDate < now) status = 'OVERDUE';
        } else if (cfg.scenario === 'ending_soon') {
          if (i < cfg.periods - 2 && dueDate < now) { status = 'PAID'; paidAt = new Date(dueDate.getTime() + 3600000); }
          else if (dueDate < now) status = 'OVERDUE';
        } else if (cfg.scenario === 'partial') {
          if (i % 2 === 0 && dueDate < now) { status = 'PAID'; paidAt = new Date(dueDate.getTime() + DAY * 2); }
          else if (dueDate < now) status = 'OVERDUE';
        } else if (cfg.scenario === 'due_soon') {
          if (dueDate < now) status = 'OVERDUE';
        }

        payments.push({
          _id: new ObjectId(),
          dueDate,
          amount: cfg.amount,
          fine: status === 'OVERDUE' ? fine : 0,
          status,
          paidAt,
          paymentMethod: status === 'PAID' ? ['PIX', 'CASH', 'BANK_TRANSFER'][i % 3] : undefined,
          notes: status === 'OVERDUE' && fine > 0 ? `Multa: R$ ${calcFine(cfg.amount, daysLate).toFixed(2)} (2% + juros 1%/mês)` : undefined,
        });

        cursor.setDate(cursor.getDate() + step);
      }

      const paidCount = payments.filter(p => p.status === 'PAID').length;
      const overdueCount = payments.filter(p => p.status === 'OVERDUE').length;
      const rentalStatus = overdueCount > 0 && paidCount === 0 ? 'OVERDUE' :
                           overdueCount > 2 ? 'OVERDUE' : 'ACTIVE';

      return {
        vehicleId: vehicleIds[cfg.vi],
        driverId: driverIds[cfg.di],
        startDate,
        expectedEndDate,
        rentalAmount: cfg.amount,
        paymentFrequency: cfg.freq,
        status: rentalStatus,
        securityDeposit: cfg.amount * 1.5,
        payments,
        notes: `Contrato ${cfg.scenario} — ${paidCount}/${cfg.periods} parcelas pagas`,
        createdAt: startDate, updatedAt: new Date(),
      };
    });

    await db.collection('rentals').insertMany(rentals);
    console.log(`📝 Created ${rentals.length} rentals`);

    // ─── MAINTENANCES (8) ─────────────────────────────────────────
    const maintenances = [
      { vehicleId: vehicleIds[15], description: 'Revisão 50.000km — troca óleo + filtros', type: 'PREVENTIVE', status: 'IN_PROGRESS', cost: 580, provider: 'Oficina Central Curitiba', date: daysAgo(2) },
      { vehicleId: vehicleIds[16], description: 'Reparo em embreagem', type: 'CORRECTIVE', status: 'IN_PROGRESS', cost: 1200, provider: 'Auto Center Rápido', date: daysAgo(1) },
      { vehicleId: vehicleIds[0],  description: 'Troca de pneus dianteiros', type: 'CORRECTIVE', status: 'COMPLETED', cost: 480, provider: 'Borracharia Boa Vista', date: daysAgo(15), completedAt: daysAgo(14) },
      { vehicleId: vehicleIds[2],  description: 'Revisão 85.000km', type: 'PREVENTIVE', status: 'COMPLETED', cost: 650, provider: 'Concessionária Hyundai PR', date: daysAgo(30), completedAt: daysAgo(29) },
      { vehicleId: vehicleIds[5],  description: 'Troca de bateria', type: 'CORRECTIVE', status: 'COMPLETED', cost: 280, provider: 'Elétrica do Bairro', date: daysAgo(10), completedAt: daysAgo(10) },
      { vehicleId: vehicleIds[18], description: 'Revisão 95.000km — motor + freios', type: 'PREVENTIVE', status: 'PENDING', cost: 2100, provider: 'Centro Automotivo GM', date: daysFrom(3) },
      { vehicleId: vehicleIds[11], description: 'Reparo no ar-condicionado', type: 'CORRECTIVE', status: 'COMPLETED', cost: 420, provider: 'Oficina Climática', date: daysAgo(7), completedAt: daysAgo(6) },
      { vehicleId: vehicleIds[14], description: 'Alinhamento e balanceamento', type: 'PREVENTIVE', status: 'COMPLETED', cost: 120, provider: 'Auto Point', date: daysAgo(5), completedAt: daysAgo(5) },
    ].map(m => ({ ...m, createdAt: m.date, updatedAt: m.completedAt || new Date() }));

    await db.collection('maintenances').insertMany(maintenances);
    console.log(`🔧 Created ${maintenances.length} maintenances`);

    // ─── SUMMARY ────────────────────────────────────────────────
    const totalPending = rentals.flatMap(r => r.payments).filter(p => p.status === 'PENDING').length;
    const totalOverdue = rentals.flatMap(r => r.payments).filter(p => p.status === 'OVERDUE').length;
    const totalPaid   = rentals.flatMap(r => r.payments).filter(p => p.status === 'PAID').length;
    const totalFines  = rentals.flatMap(r => r.payments).reduce((s, p) => s + (p.fine || 0), 0);

    console.log('\n📊 Summary:');
    console.log(`   Pagamentos PAID:    ${totalPaid}`);
    console.log(`   Pagamentos PENDING: ${totalPending}`);
    console.log(`   Pagamentos OVERDUE: ${totalOverdue}`);
    console.log(`   Total multas+juros: R$ ${totalFines.toFixed(2)}`);
    console.log('\n🎉 Seed data generated successfully!');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
