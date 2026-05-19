'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Recuperar Senha</h1>
        <p className="mt-2 text-sm text-slate-400">Enviaremos um link para redefinir sua senha</p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="mb-4 rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
            Se o email existir em nossa base, um link de recuperação será enviado.
          </div>
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="seu@email.com" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
          <p className="text-center text-sm text-slate-400">
            <Link href="/login" className="text-blue-400 hover:text-blue-300">Voltar para o login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
