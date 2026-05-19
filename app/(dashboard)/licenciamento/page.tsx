'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Plus, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/shared-utils';

export default function LicensingPage() {
  const { data, isLoading } = useQuery({ queryKey: ['licensing'], queryFn: () => api.get<any>('/licensing', { limit: 50 }) });
  const items = data?.data?.data || data?.data || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Licenciamento</h1><p className="text-sm text-slate-500">Controle de licenciamento anual</p></div>
        <Link href="/licenciamento/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Novo</Link>
      </div>
      {isLoading ? <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /> :
        items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700"><FileCheck className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum licenciamento</h3></div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800"><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Veículo</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Ano</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Valor</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((l: any) => (<tr key={l._id}><td className="px-4 py-3 text-sm">{l.vehicleId?.plate || '-'}</td><td className="px-4 py-3 text-sm">{l.year}</td><td className="px-4 py-3 text-sm font-medium">{formatCurrency(l.value)}</td><td className="px-4 py-3 text-sm">{l.status}</td></tr>))}</tbody>
            </table>
          </div>
        )}
    </div>
  );
}
