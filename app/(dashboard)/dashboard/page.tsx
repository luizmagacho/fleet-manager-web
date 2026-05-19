'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Car, Users, FileText, AlertTriangle, Wrench, TrendingUp,
  TrendingDown, DollarSign, Wallet, Activity,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/shared-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({
  title, value, subtitle, icon: Icon, trend, color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.get<any>('/dashboard/kpis'),
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => api.get<any>('/dashboard/charts?months=12'),
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => api.get<any>('/dashboard/alerts'),
  });

  const { data: rentalsData } = useQuery({
    queryKey: ['rentals', 'dashboard'],
    queryFn: () => api.get<any>('/rentals', { limit: 100 }),
  });

  const queryClient = useQueryClient();

  const { data: pendingPaymentsData, refetch: refetchPending } = useQuery({
    queryKey: ['rentals', 'pending-payments'],
    queryFn: () => api.get<any>('/rentals/payments/pending'),
  });

  const payMutation = useMutation({
    mutationFn: ({ rentalId, paymentId }: { rentalId: string; paymentId: string }) =>
      api.put(`/rentals/${rentalId}/payment`, {
        paymentId,
        paidAt: new Date().toISOString(),
        paymentMethod: 'Dinheiro',
        notes: 'Pago via dashboard'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      refetchPending();
      toast.success('Parcela quitada com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pendingPayments = pendingPaymentsData?.data || pendingPaymentsData || [];

  const kpiData = kpis?.data || kpis;
  const chartData = charts?.data || charts;
  const alertData = alerts?.data || alerts;
  const rentals = rentalsData?.data?.data || rentalsData?.data || [];

  // Calculate rental financial summary on the fly
  let totalContracted = 0;
  let totalCollected = 0;
  let totalReceivable = 0;
  let paidCount = 0;
  let totalCount = 0;

  rentals.forEach((r: any) => {
    const payments = r.payments || [];
    payments.forEach((p: any) => {
      totalCount++;
      if (p.status === 'PAID') {
        totalCollected += p.amount;
        paidCount++;
      } else if (p.status === 'PENDING' || p.status === 'OVERDUE') {
        totalReceivable += p.amount;
      }
    });
  });

  totalContracted = totalCollected + totalReceivable;
  const adimplenciaRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 100;

  const vehicleStatusData = kpiData?.vehicles?.byStatus
    ? Object.entries(kpiData.vehicles.byStatus).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value: value as number,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visão geral da sua frota
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Veículos"
          value={kpiData?.vehicles?.total ?? '-'}
          subtitle={`${kpiData?.rentals?.idleVehicles ?? 0} disponíveis`}
          icon={Car}
          color="blue"
        />
        <StatCard
          title="Aluguéis Ativos"
          value={kpiData?.rentals?.active ?? '-'}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Multas Pendentes"
          value={kpiData?.fines?.count ?? '-'}
          subtitle={kpiData?.fines?.total ? `R$ ${kpiData.fines.total.toLocaleString('pt-BR')}` : undefined}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Alertas"
          value={
            (kpiData?.alerts?.ipva ?? 0) +
            (kpiData?.alerts?.licensing ?? 0) +
            (kpiData?.alerts?.maintenance ?? 0) +
            (kpiData?.alerts?.cnh ?? 0)
          }
          subtitle="Próximos 30 dias"
          icon={Wrench}
          color="yellow"
        />
      </div>

      {/* Resumo Financeiro de Locação */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" /> Caixa & Finanças de Aluguel
            </h3>
            <p className="text-sm text-slate-500">Métricas financeiras consolidadas de contratos ativos</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <Activity className="h-4 w-4" /> Taxa de Adimplência: {adimplenciaRate}%
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Receita Contratada */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Receita Total Contratada</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(totalContracted)}</span>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Receita Recebida */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Recebido (Pago)</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatCurrency(totalCollected)}</span>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${adimplenciaRate}%` }}></div>
            </div>
          </div>

          {/* Receita Pendente */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total a Receber (Pendente)</span>
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{formatCurrency(totalReceivable)}</span>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: `${100 - adimplenciaRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Listagem de Parcelas Pendentes e Atrasadas */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" /> Contas a Receber (Próximas Parcelas)
            </h3>
            <p className="text-sm text-slate-500">Acompanhamento e quitação rápida de parcelas ativas</p>
          </div>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            {pendingPayments.length} pendentes
          </span>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Nenhuma parcela pendente ou atrasada no momento! 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 dark:border-slate-800">
                  <th className="py-3 px-4">Motorista / Veículo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingPayments.slice(0, 5).map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.driverName}</div>
                      <div className="text-xs text-slate-500">{p.vehicleModel} • {p.vehiclePlate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === 'OVERDUE' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {p.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          toast(`Confirmar recebimento de ${formatCurrency(p.amount)}?`, {
                            description: `Motorista: ${p.driverName}`,
                            action: {
                              label: 'Confirmar',
                              onClick: () => payMutation.mutate({ rentalId: p.rentalId, paymentId: p.paymentId }),
                            },
                          });
                        }}
                        disabled={payMutation.isPending}
                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {payMutation.isPending ? 'Gravando...' : 'Quitar Parcela'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingPayments.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/alugueis"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Ver todos os aluguéis para acessar as {pendingPayments.length} parcelas pendentes
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Receita vs Despesas
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="_id" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Status Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Status dos Veículos
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {vehicleStatusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Alertas Recentes
        </h3>
        <div className="space-y-3">
          {alertData?.ipva?.map((item: any, i: number) => (
            <div key={`ipva-${i}`} className="flex items-center gap-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/30">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                IPVA vencendo - {item.vehicleId?.plate || 'Veículo'}
              </span>
            </div>
          ))}
          {alertData?.licensing?.map((item: any, i: number) => (
            <div key={`lic-${i}`} className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Licenciamento vencendo - {item.vehicleId?.plate || 'Veículo'}
              </span>
            </div>
          ))}
          {alertData?.maintenance?.map((item: any, i: number) => (
            <div key={`maint-${i}`} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Manutenção agendada - {item.vehicleId?.plate || 'Veículo'}
              </span>
            </div>
          ))}
          {alertData?.cnh?.map((item: any, i: number) => (
            <div key={`cnh-${i}`} className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
              <Users className="h-5 w-5 text-red-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                CNH vencendo - {item.name || 'Motorista'}
              </span>
            </div>
          ))}
          {!alertData && !kpisLoading && (
            <p className="text-sm text-slate-500">Nenhum alerta no momento</p>
          )}
        </div>
      </div>
    </div>
  );
}
