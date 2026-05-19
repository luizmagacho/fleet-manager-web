'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    plate: '', renavam: '', chassis: '', brand: '', model: '',
    year: new Date().getFullYear(), modelYear: new Date().getFullYear(),
    color: '', fuelType: 'FLEX', transmission: 'AUTOMATICO', seats: 5,
    purchasePrice: 0, notes: '', status: 'DISPONIVEL', mileage: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => api.get<any>(`/vehicles/${id}`),
  });

  const vehicle = data?.data || data;

  useEffect(() => {
    if (vehicle) {
      setForm({
        plate: vehicle.plate || '',
        renavam: vehicle.renavam || '',
        chassis: vehicle.chassis || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        modelYear: vehicle.modelYear || new Date().getFullYear(),
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || 'FLEX',
        transmission: vehicle.transmission || 'AUTOMATICO',
        seats: vehicle.seats || 5,
        purchasePrice: vehicle.purchasePrice || 0,
        notes: vehicle.notes || '',
        status: vehicle.status || 'DISPONIVEL',
        mileage: vehicle.mileage || vehicle.currentMileage || 0,
      });
    }
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: (updatedData: typeof form) => api.put(`/vehicles/${id}`, updatedData),
    onSuccess: () => {
      toast.success('Veículo atualizado com sucesso!');
      router.push('/veiculos');
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/veiculos" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Veículo</h1>
          <p className="text-sm text-slate-500">Atualize as informações do veículo na frota</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Placa *</label>
            <input className={inputClass} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="ABC1D23" required />
          </div>
          <div>
            <label className={labelClass}>RENAVAM *</label>
            <input className={inputClass} value={form.renavam} onChange={(e) => setForm({ ...form, renavam: e.target.value })} placeholder="11 dígitos" required />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Chassi *</label>
            <input className={inputClass} value={form.chassis} onChange={(e) => setForm({ ...form, chassis: e.target.value.toUpperCase() })} placeholder="17 caracteres" required />
          </div>
          <div>
            <label className={labelClass}>Marca *</label>
            <input className={inputClass} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Volkswagen" required />
          </div>
          <div>
            <label className={labelClass}>Modelo *</label>
            <input className={inputClass} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Ex: Virtus" required />
          </div>
          <div>
            <label className={labelClass}>Ano Fabricação *</label>
            <input type="number" className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Ano Modelo *</label>
            <input type="number" className={inputClass} value={form.modelYear} onChange={(e) => setForm({ ...form, modelYear: +e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Cor *</label>
            <input className={inputClass} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex: Branco" required />
          </div>
          <div>
            <label className={labelClass}>Combustível *</label>
            <select className={inputClass} value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
              <option value="FLEX">Flex</option>
              <option value="GASOLINA">Gasolina</option>
              <option value="ETANOL">Etanol</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELETRICO">Elétrico</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Câmbio *</label>
            <select className={inputClass} value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
              <option value="AUTOMATICO">Automático</option>
              <option value="MANUAL">Manual</option>
              <option value="CVT">CVT</option>
              <option value="AUTOMATIZADO">Automatizado</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status *</label>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DISPONIVEL">Disponível</option>
              <option value="ALUGADO">Alugado</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="INATIVO">Inativo</option>
              <option value="VENDIDO">Vendido</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Lugares</label>
            <input type="number" className={inputClass} value={form.seats} onChange={(e) => setForm({ ...form, seats: +e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Valor de Compra (R$)</label>
            <input type="number" step="0.01" className={inputClass} value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Quilometragem Atual (km) *</label>
            <input type="number" className={inputClass} value={form.mileage} onChange={(e) => setForm({ ...form, mileage: +e.target.value })} placeholder="Ex: 15000" required />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/veiculos" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Cancelar
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
