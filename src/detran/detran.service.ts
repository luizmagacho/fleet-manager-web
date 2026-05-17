import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DetranFine {
  id: string;
  date: string;
  description: string;
  amount: number;
  points: number;
  status: 'PENDING' | 'PAID' | 'APPEALED';
  location: string;
  agent: string;
}

export interface DetranIpva {
  year: number;
  totalAmount: number;
  paidInstallments: number;
  totalInstallments: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
  dueDate: string;
}

export interface DetranLicensing {
  year: number;
  status: 'VALID' | 'PENDING' | 'EXPIRED';
  expirationDate: string;
  restrictions: string[];
}

export interface DetranVehicleInfo {
  licensePlate: string;
  renavam: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fines: DetranFine[];
  ipva: DetranIpva;
  licensing: DetranLicensing;
  queriedAt: Date;
}

@Injectable()
export class DetranService {
  private readonly logger = new Logger(DetranService.name);
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  
  private readonly DETRAN_API_URL: string;
  private readonly AUTH_URL: string;

  constructor(private configService: ConfigService) {
    this.DETRAN_API_URL = this.configService.get<string>(
      'DETRAN_API_URL',
      'https://apigateway.paas.pr.gov.br/detran/frotista/api/v1',
    );
    this.AUTH_URL = this.configService.get<string>(
      'DETRAN_AUTH_URL',
      'https://auth-cs.identidadedigital.pr.gov.br/centralautenticacao/api/v1/token/jwt',
    );
  }

  private async getAuthToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const clientId = this.configService.get<string>('DETRAN_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DETRAN_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('Credenciais do Detran (Client ID/Secret) não configuradas. Retornando mock de token.');
      return 'mock_token';
    }

    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch(this.AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'frotista.api',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na autenticação: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Expira 1 min antes
      return this.token as string;
    } catch (error) {
      this.logger.error('Falha ao obter token do Detran', error);
      throw new HttpException('Falha na autenticação com Detran', HttpStatus.UNAUTHORIZED);
    }
  }

  private async requestApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    // Fallback para mock se não houver credenciais reais
    if (token === 'mock_token') {
      return null;
    }

    const url = `${this.DETRAN_API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'consumerId': 'DETRANFROTISTAAPI',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new HttpException('Limite de requisições excedido', HttpStatus.TOO_MANY_REQUESTS);
        }
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Erro ao consultar endpoint ${endpoint}:`, error);
      throw new HttpException('Erro na consulta ao Detran', HttpStatus.BAD_GATEWAY);
    }
  }

  async queryVehicle(licensePlate: string, renavam: string): Promise<DetranVehicleInfo> {
    this.logger.log(`Consultando Detran PR para placa: ${licensePlate}`);

    const data = await this.requestApi(`/veiculos/${renavam}?placa=${licensePlate}`);
    
    if (!data) {
      this.logger.log('Usando dados simulados pois a API real não está configurada');
      return this.mockVehicleQuery(licensePlate, renavam);
    }

    // Mapeia a resposta real para a interface (Estrutura baseada na documentação Swagger)
    const vehicleInfo: DetranVehicleInfo = {
      licensePlate: licensePlate,
      renavam: renavam,
      brand: data.marcaModelo?.split('/')[0] || 'Desconhecida',
      model: data.marcaModelo?.split('/')[1] || 'Desconhecido',
      year: data.anoFabricacao || new Date().getFullYear(),
      color: data.cor || 'Desconhecida',
      fines: await this.queryFines(licensePlate),
      ipva: await this.queryIpva(renavam),
      licensing: await this.queryLicensing(renavam),
      queriedAt: new Date(),
    };

    return vehicleInfo;
  }

  async queryFines(licensePlate: string): Promise<DetranFine[]> {
    this.logger.log(`Consultando multas para placa: ${licensePlate}`);
    const data = await this.requestApi(`/veiculos/placa/${licensePlate}/multas`);
    
    if (!data) {
      const mockResult = this.mockVehicleQuery(licensePlate, '');
      return mockResult.fines;
    }

    // Mapping API response to our interface
    return (data.multas || []).map((m: any) => ({
      id: m.codAuto || `FINE-${Date.now()}`,
      date: `${m.dataInfracao} ${m.horaInfracao}`,
      description: m.descrInfracao || 'Multa de Trânsito',
      amount: m.valorOriginal || 0,
      points: 0, // A ser buscado
      status: 'PENDING',
      location: m.localInfracao || 'Não especificado',
      agent: m.nomeOrgaoAutuador || 'Detran/PR',
    }));
  }

  async queryIpva(renavam: string): Promise<DetranIpva> {
    this.logger.log(`Consultando IPVA para RENAVAM: ${renavam}`);
    const data = await this.requestApi(`/veiculos/${renavam}/ipva`);
    
    if (!data) {
      const mockResult = this.mockVehicleQuery('', renavam);
      return mockResult.ipva;
    }

    const totalAmount = data.totalDebitos || 0;
    return {
      year: new Date().getFullYear(),
      totalAmount,
      paidInstallments: 0,
      totalInstallments: 3, // Padrão PR
      status: totalAmount > 0 ? 'PENDING' : 'PAID',
      dueDate: data.ipva?.dueDate || new Date().toISOString(),
    };
  }

  async queryLicensing(renavam: string): Promise<DetranLicensing> {
    this.logger.log(`Consultando licenciamento para RENAVAM: ${renavam}`);
    const data = await this.requestApi(`/veiculos/${renavam}/licenciamento`);
    
    if (!data) {
      const mockResult = this.mockVehicleQuery('', renavam);
      return mockResult.licensing;
    }

    return {
      year: new Date().getFullYear(),
      status: data.totalDebitos > 0 ? 'PENDING' : 'VALID',
      expirationDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
      restrictions: [],
    };
  }

  /**
   * Mock implementation
   */
  private mockVehicleQuery(licensePlate: string, renavam: string): DetranVehicleInfo {
    const seed = licensePlate.charCodeAt(0) + licensePlate.charCodeAt(1) || 123;
    const hasFines = seed % 3 === 0;
    const ipvaStatus = seed % 4 === 0 ? 'OVERDUE' : seed % 2 === 0 ? 'PARTIAL' : 'PAID';

    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), 15);

    return {
      licensePlate: licensePlate.toUpperCase(),
      renavam: renavam || '12345678901',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2021,
      color: 'Branco',
      fines: hasFines
        ? [
            {
              id: `FINE-${Date.now()}`,
              date: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString(),
              description: 'Excesso de velocidade (até 20% acima do limite)',
              amount: 130.16,
              points: 4,
              status: 'PENDING',
              location: 'BR-277, km 123 - Curitiba/PR',
              agent: 'PRF',
            },
          ]
        : [],
      ipva: {
        year: now.getFullYear(),
        totalAmount: 1850.0,
        paidInstallments: ipvaStatus === 'PAID' ? 3 : ipvaStatus === 'PARTIAL' ? 1 : 0,
        totalInstallments: 3,
        status: ipvaStatus as any,
        dueDate: new Date(now.getFullYear(), 2, 31).toISOString(),
      },
      licensing: {
        year: now.getFullYear(),
        status: seed % 5 === 0 ? 'EXPIRED' : 'VALID',
        expirationDate: nextYear.toISOString(),
        restrictions: [],
      },
      queriedAt: new Date(),
    };
  }
}
