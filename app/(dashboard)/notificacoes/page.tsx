'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Bell } from 'lucide-react';
export default function NotificationsPage() {
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<any>('/notifications', { limit: 50 }) });
  const notifications = data?.data?.data || data?.data || [];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificações</h1><p className="text-sm text-slate-500">Central de alertas</p></div>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700"><Bell className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma notificação</h3></div>
      ) : (
        <div className="space-y-2">{notifications.map((n: any) => (
          <div key={n._id} className={`rounded-lg border p-4 ${n.read ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'}`}>
            <h4 className="font-medium text-slate-900 dark:text-white">{n.title}</h4>
            <p className="text-sm text-slate-500">{n.message}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
}
