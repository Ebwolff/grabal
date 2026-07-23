'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { Upload, Download, FileSpreadsheet, Database, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const recentImports = [
  { file: 'safra_2024_soja.xlsx', date: '16/03/2026 14:22', records: 1240, status: 'success' },
  { file: 'custos_operacionais_Q1.csv', date: '15/03/2026 09:15', records: 384, status: 'success' },
  { file: 'receitas_marco.xlsx', date: '14/03/2026 18:40', records: 96, status: 'warning' },
  { file: 'ativos_fazenda_rioDoce.csv', date: '12/03/2026 11:03', records: 52, status: 'success' },
];

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ToastProvider';

export default function DatabasePage() {
  const { info } = useToast();
  const [stats, setStats] = React.useState([
    { name: 'Produtores', records: 0, icon: '👤', table: 'Client' },
    { name: 'Fazendas', records: 0, icon: '🏡', table: 'Farm' },
    { name: 'Safras', records: 0, icon: '🌱', table: 'Safra' },
    { name: 'Culturas', records: 0, icon: '🌾', table: 'Cultura' },
    { name: 'Produção', records: 0, icon: '📊', table: 'Production' },
    { name: 'Custos', records: 0, icon: '💰', table: 'Cost' },
    { name: 'Receitas', records: 0, icon: '📈', table: 'Sale' },
    { name: 'Ativos', records: 0, icon: '🏗️', table: 'Asset' },
  ]);
  const [loading, setLoading] = React.useState(true);
  const [imports, setImports] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      setLoading(true);
      try {
        const newStats = [...stats];
        for (let i = 0; i < newStats.length; i++) {
          const { count } = await supabase.from(newStats[i].table).select('*', { count: 'exact', head: true });
          newStats[i].records = count || 0;
        }
        setStats(newStats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);
  return (
    <MainContent>
        <PageHeader
        title="Base de"
        accent="Dados"
        description="Dados base do sistema: produtores, fazendas, culturas."
      />

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => info('API de importação de planilhas ainda não implementada.')}
            className="bg-industrial-card border-2 border-dashed border-industrial-border hover:border-primary p-8 flex flex-col items-center justify-center cursor-pointer group transition-all"
          >
            <Upload size={32} className="text-slate-500 group-hover:text-primary-light transition-colors mb-4" />
            <p className="font-bold uppercase tracking-widest text-sm mb-1">Importar Dados</p>
            <p className="text-xs text-slate-500 text-center">Arraste arquivos .xlsx ou .csv para importar dados de produção</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => info('Serviço de geração de relatórios PDF/Excel pendente.')}
            className="card hover:border-primary p-8 flex flex-col items-center justify-center cursor-pointer group transition-all"
          >
            <Download size={32} className="text-slate-500 group-hover:text-primary-light transition-colors mb-4" />
            <p className="font-bold uppercase tracking-widest text-sm mb-1">Exportar Relatório</p>
            <p className="text-xs text-slate-500 text-center">Gerar relatório financeiro completo em PDF ou Excel</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => info('O banco de dados já opera em tempo real.')}
            className="card hover:border-primary p-8 flex flex-col items-center justify-center cursor-pointer group transition-all"
          >
            <Database size={32} className="text-slate-500 group-hover:text-primary-light transition-colors mb-4" />
            <p className="font-bold uppercase tracking-widest text-sm mb-1">Sincronizar</p>
            <p className="text-xs text-slate-500 text-center">Recalcular todos os indicadores e atualizar ratings</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Data Models Grid */}
          <div className="col-span-2">
            <h4 className="font-bold uppercase tracking-tight mb-4 text-sm">Modelos de Dados</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((model, i) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4 hover:border-primary/40 transition-all cursor-pointer group"
                >
                  <div className="text-2xl mb-2">{model.icon}</div>
                  <p className="font-bold text-sm group-hover:text-primary-light transition-colors">{model.name}</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {loading ? <span className="animate-pulse text-slate-500">...</span> : model.records.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                    <Clock size={8} /> Hoje
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Imports */}
          <div>
            <h4 className="font-bold uppercase tracking-tight mb-4 text-sm">Importações Recentes</h4>
            <div className="card overflow-hidden">
              {imports.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhuma importação recente encontrada.
                </div>
              ) : (
                imports.map((imp, i) => (
                  <motion.div
                    key={imp.file}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 border-b border-industrial-border/50 last:border-b-0 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold truncate max-w-[160px]">{imp.file}</span>
                      </div>
                      {imp.status === 'success' ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={14} className="text-orange-400" />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{imp.date}</span>
                      <span>{imp.records} registros</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
    </MainContent>
  );
}
