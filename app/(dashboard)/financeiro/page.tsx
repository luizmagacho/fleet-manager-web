'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export default function FinancialPage() {
  const { data } = useQuery({ queryKey: ['financial', 'dre'], queryFn: () => api.get<any>('/financial/dre') });
  const dre = data?.data || data;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1><p className="text-sm text-slate-500">Relatórios financeiros da frota</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Receita Mensal</h3>
        <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dre?.revenue || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}
