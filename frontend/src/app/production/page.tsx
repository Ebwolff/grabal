'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  Wheat, Pencil, Check, X, TrendingUp, TrendingDown,
  ArrowRight, BarChart3, Sprout, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface ProducaoItem {
  id: string;
  safra: string;
  cultura: string;
  areaPlantada: number;
  produtividade: number;
  producaoTotal: number;
  fazenda: string;
  produtor: string;
  status: 'colhido' | 'em_campo' | 'planejado';
}

const mockData: ProducaoItem[] = [
  { id: '1', safra: '2024/25', cultura: 'Soja', areaPlantada: 800, produtividade: 62, producaoTotal: 49600, fazenda: 'Fazenda São João', produtor: 'João Silva', status: 'em_campo' },
  { id: '2', safra: '2024/25', cultura: 'Milho', areaPlantada: 400, produtividade: 180, producaoTotal: 72000, fazenda: 'Fazenda São João', produtor: 'João Silva', status: 'em_campo' },
  { id: '3', safra: '2024/25', cultura: 'Algodão', areaPlantada: 1200, produtividade: 280, producaoTotal: 336000, fazenda: 'Fazenda Rio Doce', produtor: 'Fazenda Rio Doce S/A', status: 'planejado' },
  { id: '4', safra: '2024/25', cultura: 'Soja', areaPlantada: 2100, produtividade: 58, producaoTotal: 121800, fazenda: 'Fazenda Rio Doce', produtor: 'Fazenda Rio Doce S/A', status: 'em_campo' },
  { id: '5', safra: '2023/24', cultura: 'Soja', areaPlantada: 750, produtividade: 65, producaoTotal: 48750, fazenda: 'Fazenda São João', produtor: 'João Silva', status: 'colhido' },
  { id: '6', safra: '2023/24', cultura: 'Milho', areaPlantada: 350, produtividade: 175, producaoTotal: 61250, fazenda: 'Fazenda São João', produtor: 'João Silva', status: 'colhido' },
  { id: '7', safra: '2023/24', cultura: 'Café', areaPlantada: 200, produtividade: 40, producaoTotal: 8000, fazenda: 'Fazenda Boa Vista', produtor: 'Carlos Agronegócios', status: 'colhido' },
  { id: '8', safra: '2023/24', cultura: 'Soja', areaPlantada: 2000, produtividade: 60, producaoTotal: 120000, fazenda: 'Fazenda Rio Doce', produtor: 'Fazenda Rio Doce S/A', status: 'colhido' },
  { id: '9', safra: '2024/25', cultura: 'Café', areaPlantada: 220, produtividade: 42, producaoTotal: 9240, fazenda: 'Fazenda Boa Vista', produtor: 'Carlos Agronegócios', status: 'em_campo' },
  { id: '10', safra: '2024/25', cultura: 'Trigo', areaPlantada: 300, produtividade: 48, producaoTotal: 14400, fazenda: 'Fazenda Santa Maria', produtor: 'Ana Pereira', status: 'planejado' },
];

const statusConfig = {
  colhido: { label: 'Colhido', color: 'text-success', bg: 'bg-success/10 border-success/30' },
  em_campo: { label: 'Em Campo', color: 'text-primary-light', bg: 'bg-primary/10 border-primary-light/30' },
  planejado: { label: 'Planejado', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
};

const cultureColors: Record<string, string> = {
  'Soja': '#10b981', 'Milho': '#3B82F6', 'Algodão': '#F59E0B',
  'Café': '#a855f7', 'Trigo': '#06b6d4', 'Cana-de-Açúcar': '#22c55e',
};

export default function ProductionPage() {
  const { isPrivate } = usePrivacy();
  const { safra, fazenda, cultura } = useGlobalFilter();
  const [data, setData] = useState(mockData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ areaPlantada: '', produtividade: '' });

  const filtered = useMemo(() => {
    return data.filter(d =>
      (!safra || d.safra === safra) &&
      (!fazenda || d.fazenda.includes(fazenda)) &&
      (!cultura || d.cultura === cultura)
    );
  }, [data, safra, fazenda, cultura]);

  const totals = useMemo(() => ({
    area: filtered.reduce((s, d) => s + d.areaPlantada, 0),
    producao: filtered.reduce((s, d) => s + d.producaoTotal, 0),
    prodMedia: filtered.length > 0
      ? filtered.reduce((s, d) => s + d.produtividade, 0) / filtered.length
      : 0,
    culturas: new Set(filtered.map(d => d.cultura)).size,
  }), [filtered]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filtered.forEach(d => {
      grouped[d.cultura] = (grouped[d.cultura] || 0) + d.producaoTotal;
    });
    return Object.entries(grouped)
      .map(([cult, total]) => ({ cultura: cult, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const startEdit = (item: ProducaoItem) => {
    setEditingId(item.id);
    setEditValues({ areaPlantada: item.areaPlantada.toString(), produtividade: item.produtividade.toString() });
  };
  const cancelEdit = () => { setEditingId(null); setEditValues({ areaPlantada: '', produtividade: '' }); };
  const saveEdit = (id: string) => {
    const area = parseFloat(editValues.areaPlantada);
    const prod = parseFloat(editValues.produtividade);
    if (isNaN(area) || isNaN(prod) || area <= 0 || prod <= 0) return;
    setData(prev => prev.map(d => d.id === id ? { ...d, areaPlantada: area, produtividade: prod, producaoTotal: area * prod } : d));
    setEditingId(null);
  };

  return (
    <MainContent>
      <PageHeader
        title="Produção"
        accent="Agrícola"
        description={`Gestão de produção por cultura e safra — Safra ${safra}`}
        badge={
          <button className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs flex items-center gap-2 transition-all rounded-lg">
            Exportar Dados <ArrowRight size={14} />
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Área Total" value={`${totals.area.toLocaleString('pt-BR')} ha`} icon={MapPin} accentColor="#3B82F6" />
        <MetricCard title="Produção Total" value={`${(totals.producao / 1000).toFixed(1)}K sc`} change={11.8} icon={Wheat} accentColor="#10B981" changeLabel="vs safra anterior" />
        <MetricCard title="Produtividade Média" value={`${totals.prodMedia.toFixed(1)} sc/ha`} change={3.2} icon={Sprout} accentColor="#F59E0B" />
        <MetricCard title="Culturas Ativas" value={totals.culturas.toString()} icon={BarChart3} accentColor="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-industrial-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wheat size={16} className="text-primary-light" />
              <h4 className="text-sm font-semibold text-white">Dados de Produção</h4>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{filtered.length} registros</span>
          </div>
          <table className="w-full table-striped">
            <thead>
              <tr>
                {['Cultura', 'Fazenda', 'Safra', 'Área (ha)', 'Prod. (sc/ha)', 'Total (sc)', 'Status', ''].map(h => (
                  <th key={h} className="text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item, i) => {
                  const isEditing = editingId === item.id;
                  const st = statusConfig[item.status];
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className={isEditing ? 'bg-primary/5' : ''}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cultureColors[item.cultura] || '#64748b' }} />
                          <span className="font-semibold text-white">{item.cultura}</span>
                        </div>
                      </td>
                      <td className="text-slate-400">{item.fazenda}</td>
                      <td className="text-slate-400">{item.safra}</td>
                      <td>
                        {isEditing ? (
                          <input type="number" value={editValues.areaPlantada}
                            onChange={(e) => setEditValues(p => ({ ...p, areaPlantada: e.target.value }))}
                            className="w-20 bg-industrial-bg border border-primary-light/50 px-2 py-1 text-xs font-mono rounded focus:outline-none focus-ring" />
                        ) : (
                          <span className={cn('font-mono privacy-mask', isPrivate && 'privacy-hidden')}>{item.areaPlantada.toLocaleString('pt-BR')}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" value={editValues.produtividade}
                            onChange={(e) => setEditValues(p => ({ ...p, produtividade: e.target.value }))}
                            className="w-20 bg-industrial-bg border border-primary-light/50 px-2 py-1 text-xs font-mono rounded focus:outline-none focus-ring" />
                        ) : (
                          <span className={cn('font-mono privacy-mask', isPrivate && 'privacy-hidden')}>{item.produtividade}</span>
                        )}
                      </td>
                      <td>
                        <span className={cn('font-semibold font-mono text-success privacy-mask', isPrivate && 'privacy-hidden')}>
                          {isEditing
                            ? ((parseFloat(editValues.areaPlantada) || 0) * (parseFloat(editValues.produtividade) || 0)).toLocaleString('pt-BR')
                            : item.producaoTotal.toLocaleString('pt-BR')
                          }
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-[9px] px-2 py-1 font-semibold uppercase border rounded', st.bg, st.color)}>{st.label}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(item.id)} className="p-1 text-success hover:text-success/80"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-1 text-danger hover:text-danger/80"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(item)} className="p-1 text-slate-600 hover:text-primary-light transition-colors">
                            <Pencil size={14} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-primary-light" />
              <h4 className="text-sm font-semibold text-white">Produção por Cultura</h4>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="cultura" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} width={65} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [`${Number(value).toLocaleString('pt-BR')} sc`, 'Produção']} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.cultura} fill={cultureColors[entry.cultura] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Comparison */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Variação vs Safra Anterior</h4>
            <div className="space-y-3">
              {[
                { cultura: 'Soja', atual: 60, anterior: 65, unit: 'sc/ha' },
                { cultura: 'Milho', atual: 180, anterior: 175, unit: 'sc/ha' },
                { cultura: 'Café', atual: 42, anterior: 40, unit: 'sc/ha' },
              ].map((comp) => {
                const diff = ((comp.atual - comp.anterior) / comp.anterior * 100);
                const positive = diff >= 0;
                return (
                  <div key={comp.cultura} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cultureColors[comp.cultura] || '#64748b' }} />
                      <span className="text-xs font-semibold text-white">{comp.cultura}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-mono privacy-mask', isPrivate && 'privacy-hidden')}>
                        {comp.atual} {comp.unit}
                      </span>
                      <span className={cn('text-[10px] font-semibold flex items-center gap-0.5', positive ? 'text-success' : 'text-danger')}>
                        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {positive ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Integration Info */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Integração Financeira</h4>
            <p className="text-[10px] text-slate-500 mb-3">Os dados de produção alimentam automaticamente:</p>
            <div className="space-y-2">
              {['Cálculo de Receita Bruta', 'DRE — Linha de Faturamento', 'Indicadores de Produtividade', 'Rating de Performance'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
