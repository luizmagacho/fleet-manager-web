'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Car, Users, FileText, Wrench, AlertTriangle,
  Receipt, Shield, Fuel, BarChart3, Bell, Settings, Menu, X,
  LogOut, ChevronDown, Gauge, FileCheck, DollarSign, Sun, Moon,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Veículos', href: '/veiculos', icon: Car },
  { name: 'Motoristas', href: '/motoristas', icon: Users },
  { name: 'Aluguéis', href: '/alugueis', icon: FileText },
  { name: 'Manutenções', href: '/manutencoes', icon: Wrench },
  { name: 'Multas', href: '/multas', icon: AlertTriangle },
  { name: 'IPVA', href: '/ipva', icon: Receipt },
  { name: 'Licenciamento', href: '/licenciamento', icon: FileCheck },
  { name: 'Quilometragem', href: '/quilometragem', icon: Gauge },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Seguros', href: '/seguros', icon: Shield },
  { name: 'Combustível', href: '/abastecimentos', icon: Fuel },
  { name: 'Notificações', href: '/notificacoes', icon: Bell },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-50/80 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/images/logo-icon.jpeg" alt="Roger Logo" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Roger Frota
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {session?.user?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Alternar Tema"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <Link
              href="/notificacoes"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
