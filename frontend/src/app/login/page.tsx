'use client';

import React from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
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
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-light transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="nome@empresa.com"
                className="w-full bg-slate-900 border border-industrial-border px-11 py-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-700" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chave de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-light transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="********"
                className="w-full bg-slate-900 border border-industrial-border px-11 py-4 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-700" 
              />
            </div>
          </div>

          <Link href="/" className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-5 flex items-center justify-center gap-2 group transition-all duration-300">
            Acessar Terminal
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

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
