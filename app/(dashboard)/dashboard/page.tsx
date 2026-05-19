'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Car, Users, FileText, AlertTriangle, Wrench, TrendingUp,
  TrendingDown, DollarSign,
} from 'lucide-react';
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

  const kpiData = kpis?.data || kpis;
  const chartData = charts?.data || charts;
  const alertData = alerts?.data || alerts;

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
