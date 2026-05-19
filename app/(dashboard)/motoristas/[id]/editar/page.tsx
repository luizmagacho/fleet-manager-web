'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: '', cpf: '', licenseNumber: '', licenseCategory: 'B',
    licenseExpiration: '', phone: '', email: '', address: '',
    city: '', zipCode: '', notes: '', status: 'ACTIVE',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', id],
    queryFn: () => api.get<any>(`/drivers/${id}`),
  });

  const driver = data?.data || data;

  useEffect(() => {
    if (driver) {
      // Format expiration date to YYYY-MM-DD for date input
      let expDate = '';
      if (driver.licenseExpiration) {
        const dateObj = new Date(driver.licenseExpiration);
        expDate = dateObj.toISOString().split('T')[0];
      }

      setForm({
        name: driver.name || '',
        cpf: driver.cpf || '',
        licenseNumber: driver.licenseNumber || '',
        licenseCategory: driver.licenseCategory || 'B',
        licenseExpiration: expDate,
        phone: driver.phone || '',
        email: driver.email || '',
        address: driver.address || '',
        city: driver.city || '',
        zipCode: driver.zipCode || '',
        notes: driver.notes || '',
        status: driver.status || 'ACTIVE',
      });
    }
  }, [driver]);

  const mutation = useMutation({
    mutationFn: (updatedData: typeof form) => api.put(`/drivers/${id}`, updatedData),
    onSuccess: () => {
      toast.success('Motorista atualizado com sucesso!');
      router.push('/motoristas');
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
        <Link href="/motoristas" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Motorista</h1>
          <p className="text-sm text-slate-500">Atualize as informações do motorista na frota</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Nome Completo *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Luiz Fernando" required />
          </div>
          <div>
            <label className={labelClass}>CPF *</label>
            <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '') })} placeholder="Apenas números" required />
          </div>
          <div>
            <label className={labelClass}>Telefone *</label>
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex: (41) 99999-9999" required />
          </div>
          <div>
            <label className={labelClass}>E-mail *</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ex: motorista@email.com" required />
          </div>
          <div>
            <label className={labelClass}>Número da CNH *</label>
            <input className={inputClass} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="Número de registro da CNH" required />
          </div>
          <div>
            <label className={labelClass}>Categoria da CNH *</label>
            <select className={inputClass} value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Vencimento da CNH *</label>
            <input type="date" className={inputClass} value={form.licenseExpiration} onChange={(e) => setForm({ ...form, licenseExpiration: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Endereço</label>
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, Número, Bairro" />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex: Curitiba" />
          </div>
          <div>
            <label className={labelClass}>CEP</label>
            <input className={inputClass} value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, '') })} placeholder="Ex: 80000000" />
          </div>
          <div>
            <label className={labelClass}>Status *</label>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="SUSPENDED">Suspenso</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Alguma observação importante..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/motoristas" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
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
