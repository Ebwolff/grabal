'use client';

import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { Truck, Calculator, DollarSign, Shield, Wrench, Coins } from 'lucide-react';

interface TruckPreset {
  name: string;
  capacity: number; // Ton
  consumption: number; // km/L
}

const TRUCK_PRESETS: TruckPreset[] = [
  { name: 'Caminhão Truck (3 eixos) — 14 Ton', capacity: 14, consumption: 3.5 },
  { name: 'Carreta Simples — 27 Ton', capacity: 27, consumption: 2.8 },
  { name: 'Bitrem (Padrão) — 45 Ton', capacity: 45, consumption: 2.2 },
  { name: 'Rodotrem — 60 Ton', capacity: 60, consumption: 1.8 },
  { name: 'Customizado...', capacity: 45, consumption: 2.5 }
];

export default function FreightPage() {
  const [distance, setDistance] = useState(140);
  const [dieselPrice, setDieselPrice] = useState(5.70);
  const [volumeTon, setVolumeTon] = useState(6480);
  const [thirdPartyCostTon, setThirdPartyCostTon] = useState(132.70);

  // Desmembramento do Pacote Próprio
  const [driverSalary, setDriverSalary] = useState(3500); // R$/mês
  const [insuranceIpva, setInsuranceIpva] = useState(1200); // R$/mês
  const [maintenanceTrip, setMaintenanceTrip] = useState(400); // R$/viagem
  const [tollTrip, setTollTrip] = useState(150); // R$/viagem

  // Caminhão
  const [presetIndex, setPresetIndex] = useState(2); // Bitrem padrão
  const [customCapacity, setCustomCapacity] = useState(45);
  const [customConsumption, setCustomConsumption] = useState(2.2);

  const isCustom = presetIndex === TRUCK_PRESETS.length - 1;
  const capacity = isCustom ? customCapacity : TRUCK_PRESETS[presetIndex].capacity;
  const consumption = isCustom ? customConsumption : TRUCK_PRESETS[presetIndex].consumption;

  const estimatedTrips = Math.ceil(volumeTon / capacity);
  const dieselPerTrip = (distance * 2) / consumption;
  const costDieselTrip = dieselPerTrip * dieselPrice;
  const totalDieselCost = costDieselTrip * estimatedTrips;

  // Custo operacional fixo calculado de forma realista
  const calculatedFixedCost = driverSalary + insuranceIpva + (maintenanceTrip + tollTrip) * estimatedTrips;
  const totalOwnCost = totalDieselCost + calculatedFixedCost;
  
  const totalThirdPartyCost = volumeTon * thirdPartyCostTon;

  const handlePresetChange = (index: number) => {
    setPresetIndex(index);
    if (index !== TRUCK_PRESETS.length - 1) {
      setCustomCapacity(TRUCK_PRESETS[index].capacity);
      setCustomConsumption(TRUCK_PRESETS[index].consumption);
    }
  };

  const formatCost = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(2)}M`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <MainContent>
      <PageHeader
        title="Logística e Frete"
        description="Comparativo de viabilidade: Frota Própria vs Terceirizada (CIF)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Geral */}
          <div className="glass p-6 rounded-xl border border-industrial-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2 border-b border-industrial-border pb-2">
              <Calculator className="w-4 h-4 text-primary-light" /> Variáveis Gerais de Carga
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Volume a Transportar (Ton)</label>
                <input type="number" value={volumeTon} onChange={e => setVolumeTon(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Distância até o Porto (km)</label>
                <input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Preço do Diesel (R$/L)</label>
                <input type="number" step="0.01" value={dieselPrice} onChange={e => setDieselPrice(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Frete Terceirizado (R$/Ton)</label>
                <input type="number" step="0.1" value={thirdPartyCostTon} onChange={e => setThirdPartyCostTon(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Section 2: Configuração de Veículo */}
          <div className="glass p-6 rounded-xl border border-industrial-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2 border-b border-industrial-border pb-2">
              <Truck className="w-4 h-4 text-primary-light" /> Configuração do Veículo (Frota Própria)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Tipo de Caminhão</label>
                <select 
                  value={presetIndex} 
                  onChange={e => handlePresetChange(Number(e.target.value))} 
                  className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary"
                >
                  {TRUCK_PRESETS.map((preset, i) => (
                    <option key={i} value={i}>{preset.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Capacidade por Viagem (Ton)</label>
                  <input 
                    type="number" 
                    value={capacity} 
                    onChange={e => {
                      setPresetIndex(TRUCK_PRESETS.length - 1);
                      setCustomCapacity(Number(e.target.value));
                    }} 
                    className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Consumo de Combustível (km/L)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={consumption} 
                    onChange={e => {
                      setPresetIndex(TRUCK_PRESETS.length - 1);
                      setCustomConsumption(Number(e.target.value));
                    }} 
                    className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Desmembramento dos Custos da Frota */}
          <div className="glass p-6 rounded-xl border border-industrial-border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2 border-b border-industrial-border pb-2">
              <Coins className="w-4 h-4 text-primary-light" /> Detalhamento de Custos (Frota Própria)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Salário Motorista (R$/Mês)</label>
                <input type="number" value={driverSalary} onChange={e => setDriverSalary(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Seguro & IPVA Mensal (R$/Mês)</label>
                <input type="number" value={insuranceIpva} onChange={e => setInsuranceIpva(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> Manutenção & Pneus (R$ / Viagem)</span>
                </label>
                <input type="number" value={maintenanceTrip} onChange={e => setMaintenanceTrip(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Pedágio Estimado (R$ / Viagem)</span>
                </label>
                <input type="number" value={tollTrip} onChange={e => setTollTrip(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="bg-industrial-dark/50 p-4 rounded-lg border border-industrial-border mt-4 text-xs flex justify-between text-slate-400">
              <span>Total Custos Operacionais Fixos Calculados:</span>
              <span className="font-bold text-white font-mono">R$ {calculatedFixedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 rounded-xl border border-industrial-border flex flex-col justify-center gap-6 sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white border-b border-industrial-border pb-2">
              Resultados Comparativos
            </h3>

            <div className="bg-industrial-dark p-6 rounded-lg border border-industrial-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Custo Frota Própria (Estimado)</h4>
              <div className="text-3xl font-black text-white font-mono">{formatCost(totalOwnCost)}</div>
              <div className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-industrial-border/50 font-mono">
                <span>{estimatedTrips} viagens estimadas</span>
                <span>Diesel: {formatCost(totalDieselCost)}</span>
              </div>
            </div>
            
            <div className="bg-industrial-dark p-6 rounded-lg border border-industrial-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">Custo Terceirizado (CIF)</h4>
              <div className="text-3xl font-black text-white font-mono">{formatCost(totalThirdPartyCost)}</div>
              <div className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-industrial-border/50 font-mono">
                <span>Valor por Tonelada</span>
                <span>R$ {thirdPartyCostTon.toFixed(2)}/t</span>
              </div>
            </div>

            <div className="p-5 bg-industrial-accent/10 border border-industrial-accent/20 rounded-lg flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Vantagem da Frota Própria:</span>
              <span className={`text-2xl font-black font-mono ${totalThirdPartyCost > totalOwnCost ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalThirdPartyCost > totalOwnCost ? '' : '-'} {formatCost(Math.abs(totalThirdPartyCost - totalOwnCost))}
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                {totalThirdPartyCost > totalOwnCost 
                  ? 'A frota própria apresenta maior viabilidade financeira para este volume e distância.' 
                  : 'A terceirização (frete CIF) é mais vantajosa economicamente para este cenário.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
