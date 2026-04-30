'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { User, Shield, Bell, Database, Key, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { isPrivate, togglePrivacy } = usePrivacy();

  const sections = [
    {
      title: 'Perfil do Usuário',
      icon: User,
      fields: [
        { label: 'Nome Completo', value: 'Administrador Grambal', type: 'text' },
        { label: 'Email Corporativo', value: 'admin@grambal.com.br', type: 'email' },
        { label: 'Cargo', value: 'Analista Financeiro Sênior', type: 'text' },
        { label: 'Grupo Econômico', value: 'Grambal Holdings', type: 'text', disabled: true },
      ],
    },
    {
      title: 'Segurança',
      icon: Shield,
      fields: [
        { label: 'Autenticação 2FA', value: '', type: 'toggle', enabled: true },
        { label: 'Sessão Ativa Máxima', value: '8 horas', type: 'select' },
        { label: 'Última Troca de Senha', value: '14/02/2026', type: 'text', disabled: true },
      ],
    },
  ];

  return (
    <MainContent>
        <PageHeader
        title="Configurações"
        accent="do Sistema"
        description="Preferências e configurações do sistema."
      />

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {sections.map((section, si) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.1 }}
                className="card"
              >
                <div className="p-6 border-b border-industrial-border flex items-center gap-3">
                  <section.icon size={18} className="text-primary-light" />
                  <h4 className="font-bold uppercase tracking-tight">{section.title}</h4>
                </div>
                <div className="p-6 space-y-5">
                  {section.fields.map((field) => (
                    <div key={field.label} className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-black w-48">{field.label}</label>
                      {field.type === 'toggle' ? (
                        <button
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-colors",
                            field.enabled ? "bg-primary" : "bg-slate-700"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all",
                            field.enabled ? "left-6" : "left-0.5"
                          )} />
                        </button>
                      ) : (
                        <input
                          type={field.type}
                          defaultValue={field.value}
                          disabled={field.disabled}
                          className={cn(
                            "flex-1 bg-slate-900 border border-industrial-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all ml-4",
                            field.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-3 transition-all duration-300">
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Privacy Mode Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Modo de Privacidade</h4>
              <p className="text-xs text-slate-500 mb-4">
                Oculta valores financeiros sensíveis com efeito blur em todas as telas do sistema.
              </p>
              <button
                onClick={togglePrivacy}
                className={cn(
                  "w-full py-3 font-semibold text-xs transition-all",
                  isPrivate 
                    ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30"
                    : "bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"
                )}
              >
                {isPrivate ? 'Desativar Privacy Mode' : 'Ativar Privacy Mode'}
              </button>
            </motion.div>

            {/* System Info */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Informações do Sistema</h4>
              <div className="space-y-3">
                {[
                  { icon: Globe, label: 'Versão', value: 'v1.0.0-beta' },
                  { icon: Database, label: 'Banco de Dados', value: 'PostgreSQL 16' },
                  { icon: Key, label: 'API', value: 'NestJS v11' },
                  { icon: Bell, label: 'Notificações', value: '3 pendentes' },
                ].map((info) => (
                  <div key={info.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <info.icon size={12} />
                      {info.label}
                    </div>
                    <span className="font-bold text-slate-300">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
