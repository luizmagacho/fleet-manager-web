'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DatePicker } from '@/app/components/date-picker';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'PREVENTIVE',
    scheduledDate: '',
    description: '',
    workshopName: '',
    workshopPhone: '',
    services: '',
    cost: '',
    mileageAtService: '',
    nextServiceMileage: '',
    nextServiceDate: '',
    notes: '',
  });

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<any>('/vehicles', { limit: 100 }),
  });

  const vehicles = vehiclesData?.data?.data || vehiclesData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/maintenances', data),
    onSuccess: () => {
      toast.success('Manutenção cadastrada com sucesso!');
      router.push('/manutencoes');
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCurrencyChange = (value: string, field: 'cost') => {
    const numericValue = value.replace(/\D/g, '');
    const decimalValue = (Number(numericValue) / 100).toFixed(2);
    
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(decimalValue));
    
    setForm({ ...form, [field]: numericValue === '' ? '' : formattedValue });
  };

  const parseCurrencyToNumber = (value: string | number) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return Number(value.replace(/\D/g, '')) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) return toast.error('Selecione um veículo');
    if (!form.type) return toast.error('Selecione o tipo de manutenção');
    if (form.scheduledDate.length !== 10) return toast.error('Digite a data agendada completa (DD/MM/AAAA)');

    const convertToISO = (ptDate: string) => {
      if (!ptDate) return undefined;
      const parts = ptDate.split('/');
      if (parts.length !== 3) return ptDate;
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    };

    const payload: any = {
      vehicleId: form.vehicleId,
      type: form.type,
      scheduledDate: convertToISO(form.scheduledDate),
      description: form.description,
    };

    if (form.workshopName) payload.workshopName = form.workshopName;
    if (form.workshopPhone) payload.workshopPhone = form.workshopPhone;
    if (form.services) payload.services = form.services.split(',').map(s => s.trim());
    if (form.cost) payload.cost = parseCurrencyToNumber(form.cost);
    if (form.mileageAtService) payload.mileageAtService = Number(form.mileageAtService);
    if (form.nextServiceMileage) payload.nextServiceMileage = Number(form.nextServiceMileage);
    if (form.nextServiceDate) payload.nextServiceDate = convertToISO(form.nextServiceDate);
    if (form.notes) payload.notes = form.notes;

    mutation.mutate(payload);
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/manutencoes" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nova Manutenção</h1>
          <p className="text-sm text-slate-500">Agendar ou registrar uma nova manutenção de veículo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Identificação Básica */}
        <div className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Identificação</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Veículo *</label>
              <select
                className={inputClass}
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                required
              >
                <option value="">Selecione o veículo...</option>
                {vehicles.map((v: any) => (
                  <option key={v._id} value={v._id}>
                    {v.brand} {v.model} - {v.licensePlate || v.plate || 'Sem placa'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tipo de Manutenção *</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="PREVENTIVE">Preventiva (Revisão, Óleo, Pneus)</option>
                <option value="CORRECTIVE">Corretiva (Quebra, Defeito)</option>
                <option value="AESTHETIC">Estética / Funilaria</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Descrição do Problema / Serviço *</label>
              <input
                type="text"
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Troca de óleo e filtro"
                required
              />
            </div>
          </div>
        </div>

        {/* Agendamento e Valores */}
        <div className="mb-6 border-b border-slate-200 pb-6 dark:border-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Agendamento & Oficina</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <DatePicker
              label="Data Agendada / Realizada *"
              value={form.scheduledDate}
              onChange={(val) => setForm({ ...form, scheduledDate: val })}
              required
            />

            <div>
              <label className={labelClass}>Custo Estimado / Real (R$)</label>
              <input
                type="text"
                className={inputClass}
                value={form.cost}
                onChange={(e) => handleCurrencyChange(e.target.value, 'cost')}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className={labelClass}>Nome da Oficina (Opcional)</label>
              <input
                type="text"
                className={inputClass}
                value={form.workshopName}
                onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                placeholder="Ex: Centro Automotivo Roger"
              />
            </div>

            <div>
              <label className={labelClass}>Telefone da Oficina (Opcional)</label>
              <input
                type="text"
                className={inputClass}
                value={form.workshopPhone}
                onChange={(e) => setForm({ ...form, workshopPhone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Quilometragem */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Quilometragem</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>KM Atual do Veículo</label>
              <input
                type="number"
                className={inputClass}
                value={form.mileageAtService}
                onChange={(e) => setForm({ ...form, mileageAtService: e.target.value })}
                placeholder="Ex: 50000"
              />
            </div>

            <div>
              <label className={labelClass}>KM para Próxima Revisão</label>
              <input
                type="number"
                className={inputClass}
                value={form.nextServiceMileage}
                onChange={(e) => setForm({ ...form, nextServiceMileage: e.target.value })}
                placeholder="Ex: 60000"
              />
            </div>

            <DatePicker
              label="Data da Próxima Revisão (Opcional)"
              value={form.nextServiceDate}
              onChange={(val) => setForm({ ...form, nextServiceDate: val })}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Link href="/manutencoes" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Salvando...' : 'Agendar Manutenção'}
          </button>
        </div>
      </form>
    </div>
  );
}
