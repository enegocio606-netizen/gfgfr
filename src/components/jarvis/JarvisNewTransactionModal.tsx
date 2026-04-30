import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, DollarSign, Tag, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { createFocoFlowTransaction } from '../../../services/focoFlowService';
import { auth } from '../../../firebase';
import { toast } from 'sonner';

interface JarvisNewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'income' | 'expense';
  onSuccess?: () => void;
}

const JarvisNewTransactionModal: React.FC<JarvisNewTransactionModalProps> = ({ isOpen, onClose, type = 'expense', onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      await createFocoFlowTransaction(user.uid, {
        ...formData,
        amount: parseFloat(formData.amount),
        type,
        date: new Date(formData.date).getTime()
      });
      
      setSuccess(true);
      toast.success(`${type === 'income' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          description: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          observations: ''
        });
        onClose();
        if (onSuccess) onSuccess();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('focoflow_refresh'));
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao registrar transação.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg jarvis-glass border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl"
        >
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 animate-scanline z-20" />
          
          <div className="p-8 flex flex-col gap-8 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${type === 'income' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} jarvis-glow`}>
                  {type === 'income' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">
                    Manual_Sync // {type === 'income' ? 'Entrada' : 'Saída'}
                  </h2>
                  <span className="text-[9px] font-mono text-cyan-400/40 uppercase tracking-[0.4em]">Protocolo_Registro_v4</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                  <CheckCircle2 size={40} className="animate-pulse" />
                </div>
                <span className="text-cyan-400 font-mono text-xs tracking-[0.5em] uppercase">Registrado_Com_Sucesso</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Valor_Monetário</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
                        <DollarSign size={16} />
                      </div>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 px-10 py-4 rounded-2xl text-white outline-none transition-all font-bold placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Data_Operacional</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                        <Calendar size={16} />
                      </div>
                      <input 
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 px-11 py-4 rounded-2xl text-white outline-none transition-all font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Identificação_Fluxo</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <FileText size={16} />
                    </div>
                    <input 
                      required
                      placeholder="Ex: Pagamento Consultoria"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 px-11 py-4 rounded-2xl text-white outline-none transition-all font-bold placeholder:text-white/10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono text-white/40 uppercase tracking-widest ml-1">Classificação_Sistêmica</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <Tag size={16} />
                    </div>
                    <input 
                      placeholder="Ex: Trabalho, Aluguel, Etc"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 px-11 py-4 rounded-2xl text-white outline-none transition-all font-bold placeholder:text-white/10"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 242, 255, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="mt-4 w-full py-5 bg-cyan-400/5 border border-cyan-400/20 text-cyan-400 font-black tracking-[0.4em] uppercase rounded-2xl hover:border-cyan-400 transition-all flex items-center justify-center gap-3 jarvis-glow"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                  ) : (
                    <>CONFIRMAR_REGISTRO <CheckCircle2 size={18} /></>
                  )}
                </motion.button>
              </form>
            )}
          </div>

          {/* HUD Corner Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l border-t border-cyan-400/30 rounded-tl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r border-b border-cyan-400/30 rounded-br-3xl pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JarvisNewTransactionModal;
