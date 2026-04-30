'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const producers = [
  { id: 1, name: 'João Silva', doc: '123.456.789-00', city: 'Sorriso', state: 'MT', rating: 'A+', farms: 3 },
  { id: 2, name: 'Fazenda Rio Doce S/A', doc: '00.123.456/0001-99', city: 'Rio Verde', state: 'GO', rating: 'B-', farms: 12 },
  { id: 3, name: 'Carlos Agronegócios', doc: '321.654.987-11', city: 'Uberlândia', state: 'MG', rating: 'A', farms: 5 },
  { id: 4, name: 'Ana Pereira', doc: '987.654.321-22', city: 'Cascavel', state: 'PR', rating: 'C', farms: 2 },
];

export default function ProducersPage() {
  const { isPrivate } = usePrivacy();

  return (
    <MainContent>
        {/* Page Header */}
        <PageHeader
        title="Produtores"
        accent="e Grupos"
        description="Cadastro de produtores rurais e grupos econômicos."
        badge={<button className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} />
            Novo Produtor
          </button>}
      />

        {/* Filters Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, CPF ou CNPJ..." 
              className="w-full card pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button className="card px-6 py-3 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/50">
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Nome / Razão Social</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Documento</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Localização</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Fazendas</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-center">Rating</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {producers.map((producer, index) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={producer.id} 
                  className="border-b border-industrial-border hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-4">
                    <div className="font-bold text-sm tracking-tight group-hover:text-primary-light transition-colors">
                      {producer.name}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-xs text-slate-400 font-mono privacy-mask",
                      isPrivate && "privacy-hidden"
                    )}>
                      {producer.doc}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300">{producer.city} - {producer.state}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-slate-500">{producer.farms} un.</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black border",
                      producer.rating === 'A+' ? "bg-emerald-950/50 border-emerald-500 text-emerald-400" :
                      producer.rating === 'A' ? "bg-emerald-950/30 border-emerald-600 text-emerald-500" :
                      producer.rating === 'B-' ? "bg-orange-950/50 border-orange-500 text-orange-400" :
                      "bg-red-950/50 border-red-500 text-red-400"
                    )}>
                      {producer.rating}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all">
                        <Trash2 size={14} />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-white">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="p-4 bg-slate-900/30 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Mostrando 4 de 1.240 produtores</span>
            <div className="flex gap-4">
              <button className="hover:text-primary-light transition-colors disabled:opacity-30" disabled>Anterior</button>
              <button className="hover:text-primary-light transition-colors">Próxima</button>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
