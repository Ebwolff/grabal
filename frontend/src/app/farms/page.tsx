'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { Plus, MapPin, Sprout, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const farms = [
  { id: 1, name: 'Fazenda São João', location: 'Sorriso - MT', totalArea: 2400, agriArea: 1800, producer: 'João Silva', safras: ['2023/24', '2024/25'], cultures: ['Soja', 'Milho'] },
  { id: 2, name: 'Fazenda Rio Doce', location: 'Rio Verde - GO', totalArea: 5200, agriArea: 4100, producer: 'Fazenda Rio Doce S/A', safras: ['2023/24'], cultures: ['Soja', 'Algodão', 'Milho'] },
  { id: 3, name: 'Fazenda Boa Vista', location: 'Uberlândia - MG', totalArea: 1200, agriArea: 950, producer: 'Carlos Agronegócios', safras: ['2023/24', '2024/25'], cultures: ['Café', 'Milho'] },
  { id: 4, name: 'Fazenda Santa Maria', location: 'Cascavel - PR', totalArea: 800, agriArea: 620, producer: 'Ana Pereira', safras: ['2024/25'], cultures: ['Soja', 'Trigo'] },
];

export default function FarmsPage() {
  const { isPrivate } = usePrivacy();

  return (
    <MainContent>
        <PageHeader
        title="Fazendas"
        accent="e Safras"
        description="Gestão de fazendas, áreas cultiváveis e safras."
        badge={<button className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} />
            Nova Fazenda
          </button>}
      />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Fazendas', value: '4' },
            { label: 'Área Total', value: '9.600 ha' },
            { label: 'Área Agrícola', value: '7.470 ha' },
            { label: 'Safras Ativas', value: '2' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">{s.label}</p>
              <p className={cn("text-2xl font-bold tracking-tight privacy-mask", isPrivate && "privacy-hidden")}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Farm Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {farms.map((farm, index) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="card p-6 hover:border-primary/40 transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary-light transition-colors">{farm.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                    <MapPin size={12} />
                    {farm.location}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-primary-light group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Área Total</p>
                  <p className={cn("text-sm font-bold mt-1 privacy-mask", isPrivate && "privacy-hidden")}>{farm.totalArea.toLocaleString()} ha</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Área Agrícola</p>
                  <p className={cn("text-sm font-bold mt-1 privacy-mask", isPrivate && "privacy-hidden")}>{farm.agriArea.toLocaleString()} ha</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Produtor</p>
                  <p className="text-sm font-bold mt-1 text-slate-300 truncate">{farm.producer}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-industrial-border">
                <div className="flex gap-2">
                  {farm.cultures.map((c) => (
                    <span key={c} className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 font-bold uppercase tracking-wider">{c}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {farm.safras.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-1 bg-emerald-950/50 border border-emerald-800 text-emerald-400 font-bold">
                      <Sprout size={10} className="inline mr-1" />{s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
    </MainContent>
  );
}
