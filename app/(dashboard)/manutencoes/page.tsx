'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Search, Wrench, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/shared-utils';

const typeLabels: Record<string, string> = {
  PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', REVISAO: 'Revisão', SINISTRO: 'Sinistro',
};
const statusColors: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700', EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700',
  CONCLUIDA: 'bg-green-100 text-green-700', CANCELADA: 'bg-red-100 text-red-700',
};

export default function MaintenancePage() {
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', typeFilter],
    queryFn: () => api.get<any>('/maintenance', { type: typeFilter || undefined, limit: 50 }),
  });

  const maintenances = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manutenções</h1>
          <p className="text-sm text-slate-500">Controle de manutenções da frota</p>
        </div>
        <Link href="/manutencoes/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nova Manutenção
        </Link>
      </div>

      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <option value="">Todos os tipos</option>
        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Veículo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Custo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Ações</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {maintenances.map((m: any) => (
                <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{m.vehicleId?.plate || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{typeLabels[m.type] || m.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{m.description}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(m.totalCost || 0)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[m.status] || ''}`}>{m.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/manutencoes/${m._id}`} className="rounded p-1 text-slate-400 hover:text-slate-600"><Eye className="h-4 w-4" /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
