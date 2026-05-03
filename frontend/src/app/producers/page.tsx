'use client';

import React, { useState, useEffect } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ToastProvider';
import { getProducers, createProducer, updateProducer, deleteProducer, type Producer as DBProducer } from '@/lib/supabase/database';

interface Producer extends DBProducer {
  farms?: any[];
}

export default function ProducersPage() {
  const { isPrivate } = usePrivacy();
  const { success, error } = useToast();

  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cpfCnpj: '',
    email: '',
    phone: ''
  });

  // Hardcoded group id based on the database state
  const DEFAULT_ECONOMIC_GROUP = 'f190fb71-62dc-47e2-afd7-2a48abbaef70';

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    setLoading(true);
    try {
      const data = await getProducers();
      setProducers(data);
    } catch (err: any) {
      error('Erro ao buscar produtores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpfCnpj) {
      error('Nome e CPF/CNPJ são obrigatórios!');
      return;
    }

    try {
      if (formData.id) {
        // Update
        await updateProducer(formData.id, {
          name: formData.name,
          cpfCnpj: formData.cpfCnpj,
          email: formData.email,
          phone: formData.phone
        });
        success('Produtor atualizado com sucesso!');
      } else {
        // Insert
        await createProducer({
          name: formData.name,
          cpfCnpj: formData.cpfCnpj,
          email: formData.email,
          phone: formData.phone,
          economicGroupId: DEFAULT_ECONOMIC_GROUP
        });
        success('Produtor cadastrado com sucesso!');
      }
      setShowModal(false);
      fetchProducers();
    } catch (err: any) {
      error('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produtor?')) return;
    
    try {
      await deleteProducer(id);
      success('Produtor excluído!');
      fetchProducers();
    } catch (err: any) {
      if (err.message?.includes('Farm_producerId_fkey')) {
        error('Erro: Este cliente possui fazendas cadastradas. Por favor, exclua as fazendas dele primeiro.');
      } else {
        error('Erro ao excluir: ' + err.message);
      }
    }
  };

  const openModal = (producer?: Producer) => {
    if (producer) {
      setFormData({
        id: producer.id,
        name: producer.name,
        cpfCnpj: producer.cpfCnpj,
        email: producer.email || '',
        phone: producer.phone || ''
      });
    } else {
      setFormData({ id: '', name: '', cpfCnpj: '', email: '', phone: '' });
    }
    setShowModal(true);
  };

  return (
    <MainContent>
        {/* Page Header */}
        <PageHeader
        title="Produtores"
        accent="e Grupos"
        description="Cadastro de produtores rurais e grupos econômicos."
        badge={
          <button onClick={() => openModal()} className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} />
            Novo Produtor
          </button>
        }
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
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Contato</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Fazendas</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-center">Rating</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando...</td></tr>
              )}
              {!loading && producers.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum produtor cadastrado.</td></tr>
              )}
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
                      {producer.cpfCnpj}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300">{producer.email || '—'}</div>
                    <div className="text-[10px] text-slate-500">{producer.phone || '—'}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-slate-500">{producer.farms?.length || 0} un.</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 text-[10px] font-black border bg-emerald-950/50 border-emerald-500 text-emerald-400">
                      A+
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(producer)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(producer.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 bg-slate-900/30 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Mostrando {producers.length} produtores</span>
            <div className="flex gap-4">
              <button className="hover:text-primary-light transition-colors disabled:opacity-30" disabled>Anterior</button>
              <button className="hover:text-primary-light transition-colors" disabled>Próxima</button>
            </div>
          </div>
        </div>

        {/* Modal Formulário */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
                className="card w-full max-w-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">{formData.id ? 'Editar Produtor' : 'Novo Produtor'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Nome Completo / Razão Social</label>
                    <input 
                      type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-900 border border-industrial-border px-4 py-2.5 text-sm focus:border-primary-light focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">CPF ou CNPJ</label>
                    <input 
                      type="text" required value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})}
                      className="w-full bg-slate-900 border border-industrial-border px-4 py-2.5 text-sm focus:border-primary-light focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">E-mail</label>
                      <input 
                        type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-900 border border-industrial-border px-4 py-2.5 text-sm focus:border-primary-light focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Telefone</label>
                      <input 
                        type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-900 border border-industrial-border px-4 py-2.5 text-sm focus:border-primary-light focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary-light transition-colors">
                      Salvar
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </MainContent>
  );
}
