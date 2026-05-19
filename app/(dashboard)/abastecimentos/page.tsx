'use client';
import { Fuel } from 'lucide-react';
export default function FuelPage() {
  return (<div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Combustível</h1><p className="text-sm text-slate-500">Controle de abastecimentos</p></div><div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700"><Fuel className="mb-4 h-12 w-12 text-slate-400" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">Controle de combustível</h3><p className="mt-1 text-sm text-slate-500">Abastecimentos e consumo médio</p></div></div>);
}
