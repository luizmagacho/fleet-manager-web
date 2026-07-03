'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Car } from 'lucide-react';
import { formatCurrency } from '@/lib/shared-utils';

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => api.get<any>(`/vehicles/${id}`),
  });

  const vehicle = data?.data || data;

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!vehicle) return <div className="py-20 text-center text-slate-500">Veículo não encontrado</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Disponível</span>;
      case 'RENTED': return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Alugado</span>;
      case 'MAINTENANCE': return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">Em Manutenção</span>;
      case 'INACTIVE': return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inativo</span>;
      default: return <span className="text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/veiculos" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</h1>
            <p className="text-sm text-slate-500">{vehicle.plate} • {vehicle.year}/{vehicle.modelYear}</p>
          </div>
        </div>
        <Link href={`/veiculos/${id}/editar`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
          <Edit className="h-4 w-4" /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Informações Gerais</h3>
          <dl className="space-y-3">
            {[
              ['Placa', vehicle.plate], ['RENAVAM', vehicle.renavam], ['Chassi', vehicle.chassis],
              ['Cor', vehicle.color], ['Combustível', vehicle.fuelType], ['Câmbio', vehicle.transmission],
              ['Lugares', vehicle.seats], ['Km Atual', `${(vehicle.mileage ?? vehicle.currentMileage ?? 0).toLocaleString('pt-BR')} km`],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Financeiro</h3>
          <dl className="space-y-3">
            {[
              ['Valor de Compra', vehicle.purchasePrice ? formatCurrency(vehicle.purchasePrice) : '-'],
              ['Valor FIPE', vehicle.fipeValue ? formatCurrency(vehicle.fipeValue) : '-'],
              ['Status', getStatusBadge(vehicle.status)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
