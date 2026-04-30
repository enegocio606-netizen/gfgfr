import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisable: () => void;
  reminderData: {
    titulo: string;
    descricao: string;
  };
}

const AlarmModal: React.FC<AlarmModalProps> = ({ isOpen, onClose, onDisable, reminderData }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#050811] border border-cyan-500/30 p-8 rounded-none w-full max-w-md shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bell className="text-cyan-400 animate-pulse" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">ALARME FOCOFLOW</h2>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-white">{reminderData.titulo}</h3>
            <p className="text-sm text-white/60">{reminderData.descricao}</p>
          </div>

          <button
            onClick={() => {
              onDisable();
              onClose();
            }}
            className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-all"
          >
            DESATIVAR ALARME
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlarmModal;
