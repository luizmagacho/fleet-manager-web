'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DatePicker } from '@/app/components/date-picker';

export default function NewRentalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vehicleId: '', driverId: '', startDate: '', expectedEndDate: '', durationMonths: '',
    rentalAmount: 0, paymentFrequency: 'MONTHLY', securityDeposit: 0, notes: '',
  });

  useEffect(() => {
    if (form.startDate?.length === 10 && form.durationMonths) {
      const months = Number(form.durationMonths);
      if (!isNaN(months) && months > 0) {
        const parts = form.startDate.split('/');
        if (parts.length === 3) {
          const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          date.setMonth(date.getMonth() + months);
          date.setDate(date.getDate() - 1);
          setForm(prev => ({
            ...prev,
            expectedEndDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          }));
        }
      }
    }
  }, [form.startDate, form.durationMonths]);

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () => api.get<any>('/vehicles', { limit: 100 }),
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: () => api.get<any>('/drivers', { limit: 100 }),
  });

  const vehicles = vehiclesData?.data?.data || vehiclesData?.data || [];
  const drivers = driversData?.data?.data || driversData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/rentals', data),
    onSuccess: () => {
      toast.success('Contrato de aluguel criado com sucesso!');
      router.push('/alugueis');
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) return toast.error('Selecione um veículo');
    if (!form.driverId) return toast.error('Selecione um motorista');
    
    if (form.startDate.length !== 10) return toast.error('Digite a data de início completa (DD/MM/AAAA)');
    if (form.expectedEndDate.length !== 10) return toast.error('Digite a data de término completa (DD/MM/AAAA)');

    const convertToISO = (ptDate: string) => {
      const parts = ptDate.split('/');
      if (parts.length !== 3) return ptDate;
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    };

    const { durationMonths, ...restForm } = form;

    const payload = {
      ...restForm,
      startDate: convertToISO(form.startDate),
      expectedEndDate: convertToISO(form.expectedEndDate),
    };

    mutation.mutate(payload as any);
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/alugueis" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Novo Aluguel</h1>
          <p className="text-sm text-slate-500">Cadastre um novo contrato de locação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Veículo */}
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
                  {v.brand} {v.model} - {v.licensePlate || v.plate || 'Sem placa'} ({v.color})
                </option>
              ))}
            </select>
          </div>

          {/* Motorista */}
          <div>
            <label className={labelClass}>Motorista *</label>
            <select
              className={inputClass}
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              required
            >
              <option value="">Selecione o motorista...</option>
              {drivers.map((d: any) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.cpf})
                </option>
              ))}
            </select>
          </div>

          {/* Data de Início */}
          <DatePicker
            label="Data de Início *"
            value={form.startDate}
            onChange={(val) => setForm({ ...form, startDate: val })}
            required
          />

          {/* Duração (Meses) */}
          <div>
            <label className={labelClass}>Duração (Meses)</label>
            <input
              type="number"
              className={inputClass}
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              placeholder="Ex: 3"
              min="1"
            />
            <p className="mt-1 text-xs text-slate-500">Calcula o término exato (Ex: 01/07 a 30/09)</p>
          </div>

          {/* Data Fim Prevista */}
          <DatePicker
            label="Vencimento / Término do Contrato *"
            value={form.expectedEndDate}
            onChange={(val) => setForm({ ...form, expectedEndDate: val })}
            required
          />

          {/* Valor de Locação */}
          <div>
            <label className={labelClass}>Valor de Locação (R$ por ciclo) *</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.rentalAmount}
              onChange={(e) => setForm({ ...form, rentalAmount: +e.target.value })}
              required
            >
            </input>
          </div>

          {/* Frequência */}
          <div>
            <label className={labelClass}>Frequência de Pagamento *</label>
            <select
              className={inputClass}
              value={form.paymentFrequency}
              onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quinzenal</option>
              <option value="MONTHLY">Mensal</option>
            </select>
          </div>

          {/* Caução */}
          <div>
            <label className={labelClass}>Depósito Caução (R$)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.securityDeposit}
              onChange={(e) => setForm({ ...form, securityDeposit: +e.target.value })}
            >
            </input>
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <label className={labelClass}>Observações / Termos do Contrato</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: Condições extras, regras de uso do veículo..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Link href="/alugueis" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Salvando...' : 'Criar Contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}
