'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Receipt } from 'lucide-react';
import { formatCurrency } from '@fleet/shared';

export default function IpvaPage() {
  const { data, isLoading } = useQuery({ queryKey: ['ipva'], queryFn: () => api.get<any>('/ipva', { limit: 50 }) });
  const ipvas = data?.data?.data || data?.data || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">IPVA</h1><p className="text-sm text-slate-500">Controle de IPVA dos veículos</p></div>
        <Link href="/ipva/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Novo IPVA</Link>
      </div>
      {isLoading ? <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /> :
        ipvas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
            <Receipt className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum IPVA registrado</h3>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800"><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Veículo</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Ano</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Valor</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Parcelas</th></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{ipvas.map((i: any) => (<tr key={i._id}><td className="px-4 py-3 text-sm">{i.vehicleId?.plate || '-'}</td><td className="px-4 py-3 text-sm">{i.year}</td><td className="px-4 py-3 text-sm font-medium">{formatCurrency(i.totalValue)}</td><td className="px-4 py-3 text-sm">{i.installments?.length || 0}x</td></tr>))}</tbody>
            </table>
          </div>
        )}
    </div>
  );
}
