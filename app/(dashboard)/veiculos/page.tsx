'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, Search, Car, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  DISPONIVEL: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ALUGADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  EM_MANUTENCAO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  INATIVO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  VENDIDO: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  ALUGADO: 'Alugado',
  EM_MANUTENCAO: 'Em Manutenção',
  INATIVO: 'Inativo',
  VENDIDO: 'Vendido',
};

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter],
    queryFn: () => api.get<any>('/vehicles', { search: search || undefined, status: statusFilter || undefined, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo removido');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const vehicles = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Veículos</h1>
          <p className="text-sm text-slate-500">Gerencie os veículos da sua frota</p>
        </div>
        <Link href="/veiculos/novo" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Novo Veículo
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por placa, marca, modelo..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <Car className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum veículo encontrado</h3>
          <p className="mt-1 text-sm text-slate-500">Adicione o primeiro veículo da sua frota</p>
          <Link href="/veiculos/novo" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Adicionar Veículo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle: any) => (
            <div key={vehicle._id} className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[vehicle.status] || ''}`}>
                  {statusLabels[vehicle.status] || vehicle.status}
                </span>
                <div className="flex gap-1">
                  <Link href={`/veiculos/${vehicle._id}`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link href={`/veiculos/${vehicle._id}/editar`} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button onClick={() => {
                    toast(`Remover veículo ${vehicle.brand} ${vehicle.model}?`, {
                      description: `Placa: ${vehicle.plate}`,
                      action: {
                        label: 'Remover',
                        onClick: () => deleteMutation.mutate(vehicle._id),
                      },
                    });
                  }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-slate-500">{vehicle.plate} • {vehicle.year}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{vehicle.color}</span>
                <span>{(vehicle.mileage ?? vehicle.currentMileage ?? 0).toLocaleString('pt-BR')} km</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
