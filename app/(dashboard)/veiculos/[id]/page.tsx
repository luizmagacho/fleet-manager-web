'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Car } from 'lucide-react';
import { formatCurrency } from '@fleet/shared';

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Informações Gerais</h3>
          <dl className="space-y-3">
            {[
              ['Placa', vehicle.plate], ['RENAVAM', vehicle.renavam], ['Chassi', vehicle.chassis],
              ['Cor', vehicle.color], ['Combustível', vehicle.fuelType], ['Câmbio', vehicle.transmission],
              ['Lugares', vehicle.seats], ['Km Atual', `${vehicle.currentMileage?.toLocaleString('pt-BR')} km`],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Financeiro</h3>
          <dl className="space-y-3">
            {[
              ['Valor de Compra', vehicle.purchasePrice ? formatCurrency(vehicle.purchasePrice) : '-'],
              ['Valor FIPE', vehicle.fipeValue ? formatCurrency(vehicle.fipeValue) : '-'],
              ['Status', vehicle.status],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
