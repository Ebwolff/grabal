'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('error', 'Erro', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      addToast('success', 'Acesso Liberado', 'Autenticação bem-sucedida.');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      addToast('error', 'Falha no Acesso', error.message || 'Credenciais inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-industrial-bg text-white flex items-center justify-center p-4 font-industrial overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card relative z-10 p-10"
      >
        {/* Logo Area */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-emerald-900/30 border border-primary text-primary-light mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-semibolder">
            GRAM<span className="text-primary-light">BAL</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
            Plataforma de Crédito Rural & Rating
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-light transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full bg-slate-900 border border-industrial-border px-11 py-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-700" 
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chave de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-light transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-900 border border-industrial-border px-11 py-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-700" 
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-5 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                Acessar Terminal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-industrial-border text-center">
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
            Acesso Restrito a Analistas Certificados
          </p>
        </div>
      </motion.div>

      {/* Industrial Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20" />
    </div>
  );
}
