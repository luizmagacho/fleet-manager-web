'use client';
import { Shield } from 'lucide-react';
export default function InsurancePage() {
  return (<div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Seguros</h1><p className="text-sm text-slate-500">Gestão de seguros da frota</p></div><div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700"><Shield className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Gestão de seguros</h3><p className="mt-1 text-sm text-slate-500">Apólices, sinistros e vencimentos</p></div></div>);
}
