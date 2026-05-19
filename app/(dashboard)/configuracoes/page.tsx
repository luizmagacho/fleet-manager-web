'use client';
import { Settings } from 'lucide-react';
export default function SettingsPage() {
  return (<div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1><p className="text-sm text-slate-500">Configurações da empresa</p></div><div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700"><Settings className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Configurações</h3><p className="mt-1 text-sm text-slate-500">Dados da empresa e preferências</p></div></div>);
}
