'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/shared-utils';

const statusColors: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-700', ENCERRADO: 'bg-slate-100 text-slate-700',
  PENDENTE: 'bg-yellow-100 text-yellow-700', CANCELADO: 'bg-red-100 text-red-700',
};

export default function RentalsPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rentals', statusFilter],
    queryFn: () => api.get<any>('/rentals', { status: statusFilter || undefined, limit: 50 }),
  });

  const rentals = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aluguéis</h1>
          <p className="text-sm text-slate-500">Gerencie os contratos de aluguel</p>
        </div>
        <Link href="/alugueis/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Novo Aluguel
        </Link>
      </div>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Todos</option>
        <option value="ATIVO">Ativos</option><option value="ENCERRADO">Encerrados</option>
        <option value="PENDENTE">Pendentes</option><option value="CANCELADO">Cancelados</option>
      </select>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />)}</div>
      ) : rentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <FileText className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum aluguel encontrado</h3>
          <Link href="/alugueis/novo" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Novo Aluguel</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental: any) => (
            <Link key={rental._id} href={`/alugueis/${rental._id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {rental.vehicleId?.plate || 'Veículo'} - {rental.vehicleId?.brand} {rental.vehicleId?.model}
                  </p>
                  <p className="text-sm text-slate-500">{rental.driverId?.name || 'Motorista'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(rental.monthlyValue)}/mês</p>
                  <p className="text-xs text-slate-500">Início: {formatDate(rental.startDate)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[rental.status] || ''}`}>
                  {rental.status}
                </span>
                <Eye className="h-5 w-5 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
