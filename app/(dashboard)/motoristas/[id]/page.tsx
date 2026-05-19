'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, User } from 'lucide-react';
import { formatCPF, formatDate } from '@/lib/shared-utils';

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', id],
    queryFn: () => api.get<any>(`/drivers/${id}`),
  });

  const driver = data?.data || data;

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!driver) return <div className="py-20 text-center text-slate-500">Motorista não encontrado</div>;

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo', INACTIVE: 'Inativo', SUSPENDED: 'Suspenso',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    INACTIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/motoristas" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{driver.name}</h1>
            <p className="text-sm text-slate-500">{formatCPF(driver.cpf)} • {driver.email}</p>
          </div>
        </div>
        <Link href={`/motoristas/${id}/editar`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
          <Edit className="h-4 w-4" /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Informações Pessoais</h3>
          <dl className="space-y-3">
            {[
              ['Nome', driver.name], ['CPF', formatCPF(driver.cpf)], ['E-mail', driver.email],
              ['Telefone', driver.phone], ['Endereço', driver.address || '-'], ['Cidade', driver.city || '-'],
              ['CEP', driver.zipCode || '-'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Habilitação & Status</h3>
          <dl className="space-y-3">
            {[
              ['Número da CNH', driver.licenseNumber],
              ['Categoria CNH', driver.licenseCategory],
              ['Vencimento CNH', driver.licenseExpiration ? formatDate(driver.licenseExpiration) : '-'],
              ['Pontuação (Score)', driver.score ?? 100],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <dt className="text-sm text-slate-500">Status</dt>
              <dd className="text-sm font-medium">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[driver.status] || ''}`}>
                  {statusLabels[driver.status] || driver.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        {driver.notes && (
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Observações</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{driver.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
