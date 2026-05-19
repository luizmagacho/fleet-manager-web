'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Search, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCPF } from '@/lib/shared-utils';

export default function DriversPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', search],
    queryFn: () => api.get<any>('/drivers', { search: search || undefined, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); toast.success('Motorista removido'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const drivers = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Motoristas</h1>
          <p className="text-sm text-slate-500">Gerencie os motoristas da frota</p>
        </div>
        <Link href="/motoristas/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Novo Motorista
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar por nome, CPF, telefone..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />)}</div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <Users className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum motorista encontrado</h3>
          <Link href="/motoristas/novo" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Adicionar Motorista</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">CPF</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Ações</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {drivers.map((driver: any) => (
                <tr key={driver._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{driver.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatCPF(driver.cpf)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{driver.phone}</td>
                  <td className="px-4 py-3 text-sm"><span className={`font-medium ${driver.score >= 80 ? 'text-green-600' : driver.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{driver.score}</span></td>
                  <td className="px-4 py-3 text-sm"><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">{driver.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/motoristas/${driver._id}`} className="rounded p-1 text-slate-400 hover:text-slate-600"><Eye className="h-4 w-4" /></Link>
                      <Link href={`/motoristas/${driver._id}/editar`} className="rounded p-1 text-slate-400 hover:text-slate-600"><Edit className="h-4 w-4" /></Link>
                      <button onClick={() => {
                        toast(`Remover motorista ${driver.name}?`, {
                          description: 'Esta ação não poderá ser desfeita.',
                          action: {
                            label: 'Remover',
                            onClick: () => deleteMutation.mutate(driver._id),
                          },
                        });
                      }}
                        className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
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
