'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, User, Car, FileText, CheckCircle2, Clock, Edit2, Trash2, RefreshCw, X, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/shared-utils';
import { toast } from 'sonner';
import { DatePicker } from '@/app/components/date-picker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewDate, setRenewDate] = useState('');
  const [renewAmount, setRenewAmount] = useState(0);

  const [mileageOpen, setMileageOpen] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [newMileageDate, setNewMileageDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rentals', id],
    queryFn: () => api.get<any>(`/rentals/${id}`),
  });

  const rental = data?.data || data;

  const payMutation = useMutation({
    mutationFn: ({ paymentId }: { paymentId: string }) =>
      api.put(`/rentals/${id}/payment`, {
        paymentId,
        paidAt: new Date().toISOString(),
        paymentMethod: 'Dinheiro',
        notes: 'Pago via botão rápido'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', id] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/rentals/${id}`),
    onSuccess: () => {
      toast.success('Contrato de aluguel excluído com sucesso!');
      router.push('/alugueis');
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const renewMutation = useMutation({
    mutationFn: (payload: { expectedEndDate: string; rentalAmount: number }) =>
      api.put(`/rentals/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', id] });
      toast.success('Contrato de aluguel renovado com sucesso!');
      setRenewOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mileageMutation = useMutation({
    mutationFn: (payload: { newMileage: number, date?: string }) =>
      api.post(`/rentals/${id}/mileage`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', id] });
      toast.success('Quilometragem atualizada com sucesso!');
      setMileageOpen(false);
      setNewMileage('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mileageNum = +newMileage.replace(/\D/g, '');
    if (!mileageNum) return toast.error('Digite uma quilometragem válida');
    mileageMutation.mutate({ newMileage: mileageNum, date: newMileageDate || undefined });
  };

  const handleOpenRenew = () => {
    if (!rental) return;
    const d = new Date(rental.expectedEndDate || rental.endDate || new Date());
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    setRenewDate(`${day}/${month}/${year}`);
    setRenewAmount(rental.rentalAmount || 0);
    setRenewOpen(true);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renewDate.length !== 10) return toast.error('Digite a data de término completa (DD/MM/AAAA)');
    
    const parts = renewDate.split('/');
    const expectedEndDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

    renewMutation.mutate({
      expectedEndDate,
      rentalAmount: renewAmount,
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!rental) return <div className="py-20 text-center text-slate-500">Contrato de aluguel não encontrado</div>;

  // Dynamic Contract Calculations
  const startDate = new Date(rental.startDate);
  const expectedEndDate = new Date(rental.expectedEndDate || rental.endDate || new Date());
  const currentDate = new Date();
  
  // Calculate total months
  const diffTime = Math.abs(expectedEndDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalMonths = Math.max(1, Math.round(diffDays / 30));

  // Calculate elapsed months
  const elapsedEndDate = currentDate < expectedEndDate ? currentDate : expectedEndDate;
  const elapsedDiffTime = Math.max(0, elapsedEndDate.getTime() - startDate.getTime());
  const elapsedDiffDays = Math.ceil(elapsedDiffTime / (1000 * 60 * 60 * 24));
  const elapsedMonths = Math.min(totalMonths, Math.round(elapsedDiffDays / 30) || 0);

  // Payments array calculations
  const payments = rental.payments || [];
  const totalPaymentsCount = payments.length;
  const paidPayments = payments.filter((p: any) => p.status === 'PAID');
  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE');
  
  const totalPaidAmount = paidPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const totalPendingAmount = pendingPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const totalContractValue = payments.reduce((acc: number, p: any) => acc + p.amount, 0) || (totalMonths * rental.rentalAmount);

  // Status mapping
  const statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo', OVERDUE: 'Em Atraso', COMPLETED: 'Encerrado', CANCELLED: 'Cancelado',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    COMPLETED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const paymentStatusColors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const paymentStatusLabels: Record<string, string> = {
    PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Atrasado',
  };

  const frequencyLabels: Record<string, string> = {
    WEEKLY: 'semanal',
    BIWEEKLY: 'quinzenal',
    MONTHLY: 'mensal',
  };

  const mileageLogs = rental.mileageLogs || [];
  const chartData = mileageLogs.map((log: any) => ({
    name: new Date(log.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    km: log.kmDriven
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/alugueis" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Contrato: {rental.vehicleId?.plate || 'Veículo'}
            </h1>
            <p className="text-sm text-slate-500">
              {rental.vehicleId?.brand} {rental.vehicleId?.model} • {rental.driverId?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[rental.status] || ''}`}>
            {statusLabels[rental.status] || rental.status}
          </span>
          <button
            onClick={handleOpenRenew}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Renovar
          </button>
          <Link
            href={`/alugueis/${id}/editar`}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" /> Editar
          </Link>
          <button
            onClick={() => {
              toast('Excluir este contrato de aluguel?', {
                description: 'Esta ação não poderá ser desfeita e liberará o veículo.',
                action: {
                  label: 'Excluir',
                  onClick: () => deleteMutation.mutate(),
                },
              });
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
        </div>
      </div>

      {/* Contract Financial & Period Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Meses Totais */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Duração do Contrato</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalMonths} meses</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(rental.startDate)} até {formatDate(rental.expectedEndDate)}</span>
          </div>
        </div>

        {/* Meses Pagos / Restantes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Parcelas Quitadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {paidPayments.length} <span className="text-lg font-normal text-slate-400">/ {totalPaymentsCount}</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{pendingPayments.length} parcelas a pagar</span>
          </div>
        </div>

        {/* Total Recebido */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pago</p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalPaidAmount)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span>Valor {frequencyLabels[rental.paymentFrequency] || 'mensal'}: {formatCurrency(rental.rentalAmount)}</span>
          </div>
        </div>

        {/* Total a Receber */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total a Pagar</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(totalPendingAmount)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <DollarSign className="h-4 w-4 text-yellow-500" />
            <span>Valor total contrato: {formatCurrency(totalContractValue)}</span>
          </div>
        </div>
      </div>

      {/* Grid containing Vehicle, Driver detail cards and Payments history */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Vehicle & Driver cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Driver Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> Motorista
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{rental.driverId?.name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">CPF</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{rental.driverId?.cpf || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Telefone</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{rental.driverId?.phone || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Vehicle Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" /> Veículo
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Marca/Modelo</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {rental.vehicleId?.brand || '-'} {rental.vehicleId?.model || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Placa</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{rental.vehicleId?.plate || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Cor</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{rental.vehicleId?.color || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Mileage tracking section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" /> Histórico de Quilometragem
              </h3>
              <button
                onClick={() => setMileageOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Informar
              </button>
            </div>

            {mileageLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-500">Nenhum registro de quilometragem.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <Line type="monotone" dataKey="km" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}km`} />
                    <Tooltip 
                      formatter={(value) => [`${value} km`, 'Rodados']} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payments table list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Fluxo de Parcelas do Contrato
            </h3>
            
            {payments.length === 0 ? (
              <div className="py-10 text-center text-slate-500">Nenhuma parcela gerada para este contrato.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                      <th className="px-4 py-3 text-left">Vencimento</th>
                      <th className="px-4 py-3 text-left">Valor</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payments.map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {formatDate(p.dueDate)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentStatusColors[p.status] || ''}`}>
                            {paymentStatusLabels[p.status] || p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                toast('Confirmar recebimento desta parcela?', {
                                  description: `Valor: ${formatCurrency(p.amount)}`,
                                  action: {
                                    label: 'Confirmar',
                                    onClick: () => payMutation.mutate({ paymentId: p._id }),
                                  },
                                });
                              }}
                              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                            >
                              Baixar Parcela
                            </button>
                          )}
                          {p.status === 'PAID' && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 font-medium">
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> Pago
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Renovação */}
      {renewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-600" /> Renovar Contrato
              </h3>
              <button onClick={() => setRenewOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="mt-4 space-y-4">
              <DatePicker
                label="Nova Data de Vencimento / Término *"
                value={renewDate}
                onChange={(val) => setRenewDate(val)}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Novo Valor da Locação (R$ por ciclo) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(+e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renewMutation.isPending}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {renewMutation.isPending ? 'Salvando...' : 'Confirmar Renovação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Quilometragem */}
      {mileageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" /> Informar Quilometragem
              </h3>
              <button onClick={() => setMileageOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMileageSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Data da Leitura (Opcional)
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white mb-3"
                  value={newMileageDate}
                  onChange={(e) => setNewMileageDate(e.target.value)}
                />
                
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Quilometragem do Veículo *
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 125000"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  O sistema calculará automaticamente o uso com base na última leitura. Limite: 7.000km/mês.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMileageOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mileageMutation.isPending}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {mileageMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
