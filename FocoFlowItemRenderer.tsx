import React, { useState } from 'react';
import { motion } from 'motion/react';
import FinancialReportCard from './components/FinancialReportCard';
import { extractYouTubeVideoId } from './services/youtubeUtils';
import { Bell, Video as Youtube, Link as LinkIcon, TrendingUp, TrendingDown, Copy, Check, FileText, ClipboardList, AlertCircle, Clock, ExternalLink, CheckCircle } from 'lucide-react';

interface FocoFlowItemRendererProps {
  data: any;
}

const FocoFlowItemRenderer: React.FC<FocoFlowItemRendererProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const wrapInJarvis = (content: React.ReactNode, accent: string = "cyan-400") => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative jarvis-glass p-5 my-3 rounded-2xl border border-${accent}/20 overflow-hidden group shadow-2xl backdrop-blur-xl`}
    >
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-${accent}/30 to-transparent`} />
      <div className={`absolute top-0 left-0 w-3 h-3 border-l border-t border-${accent}/40`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b border-${accent}/40`} />
      
      <div className="relative z-10">
        {content}
      </div>
      
      <div className={`absolute right-0 top-0 bottom-0 w-[2px] bg-${accent}/5 group-hover:bg-${accent}/40 transition-all`} />
    </motion.div>
  );

  if (data.category === 'reminder') {
    const date = new Date(data.reminderTime);
    return wrapInJarvis(
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-400/10 border border-orange-400/30 rounded-xl text-orange-400">
              <Bell size={20} className="animate-swing" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">PROTOCOLO_LEMBRETE</span>
          </div>
          <div className="flex gap-1">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{date.toLocaleDateString()}</span>
            <span className="text-[9px] font-mono text-orange-400 font-bold">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <h4 className="text-xl font-bold text-white jarvis-text-glow mb-2">{data.title}</h4>
        {data.description && <p className="text-sm text-white/60 font-light leading-relaxed">{data.description}</p>}
        <div className="mt-4 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[7px] font-mono text-orange-400/30 uppercase tracking-[0.3em]">NOTIFICAÇÃO_AGENDADA_NÚCLEO</span>
        </div>
      </>,
      "orange-400"
    );
  }

  if (data.category === 'youtube') {
    const videoId = extractYouTubeVideoId(data.url);
    return wrapInJarvis(
      <>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
            <Youtube size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">MIDIA_VISUAL_STREAM</span>
        </div>
        <h4 className="text-lg font-bold text-white mb-4 tracking-tight">{data.title || 'Fluxo de Vídeo'}</h4>
        {videoId ? (
          <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 shadow-inner group/video relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&enablejsapi=1`}
              title={data.title || "YouTube Video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="p-4 bg-red-500/5 border border-dashed border-red-500/20 rounded-xl mb-4 text-center">
            <p className="text-[10px] font-mono text-red-500/40 uppercase tracking-widest">Link de vídeo não disponível para incorporação direta.</p>
          </div>
        )}
        <motion.a 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-3 px-4 bg-red-600/20 border border-red-600/40 text-red-400 font-black uppercase text-[10px] tracking-[0.3em] rounded-xl transition-all hover:bg-red-600/30 group"
        >
          <span>Abrir_No_YouTube</span>
          <ExternalLink size={14} className="ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </motion.a>
      </>,
      "red-500"
    );
  }

  if (data.category === 'link') {
    return wrapInJarvis(
      <>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400">
            <LinkIcon size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">DIRETÓRIO_DE_CONEXÃO</span>
        </div>
        <h4 className="text-lg font-bold text-white mb-4 tracking-tight truncate">{data.title || 'Ponto de Acesso'}</h4>
        <div className="flex flex-col gap-3">
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-4 px-4 bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 font-black uppercase text-[10px] tracking-[0.3em] rounded-xl transition-all hover:bg-cyan-400/20 group"
            >
              <span>Ativar_Conexão</span>
              <ExternalLink size={14} className="ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </motion.a>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCopy(data.url)}
              className={`flex items-center justify-center w-full py-3 px-4 font-mono text-[9px] uppercase tracking-widest rounded-xl transition-all border ${copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              {copied ? (
                <>
                  <Check size={14} className="mr-2" />
                  <span>URL_COPIADA_BUFFER</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-2" />
                  <span>Copiar_URL_Acesso</span>
                </>
              )}
            </motion.button>
        </div>
      </>,
      "cyan-400"
    );
  }

  if (data.category === 'transaction') {
    const isIncome = data.type === 'income';
    const date = data.date && typeof data.date.toDate === 'function' 
        ? data.date.toDate() 
        : new Date(data.date);
    const accent = isIncome ? "green-400" : "red-500";
    
    return wrapInJarvis(
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${accent}/10 border border-${accent}/30 rounded-xl text-${accent}`}>
              {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-${accent}`}>
              {isIncome ? 'FLUXO_ENTRADA' : 'FLUXO_SAÍDA'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/30 tracking-widest">
            {date.toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between items-end gap-4">
            <div className="overflow-hidden">
                <h4 className="text-xl font-bold text-white mb-2 truncate">{data.description}</h4>
                <div className="flex flex-wrap gap-2">
                    {data.category_name && <span className="text-[8px] font-mono text-cyan-400/60 uppercase tracking-widest bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">CAT: {data.category_name}</span>}
                    {data.paymentMethod && <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">MODO: {data.paymentMethod}</span>}
                </div>
            </div>
            <div className={`text-2xl font-black jarvis-text-glow shrink-0 ${isIncome ? 'text-green-400' : 'text-red-400'}`} style={{ textShadow: `0 0 15px currentColor` }}>
                {isIncome ? '+' : '-'} R$ {Number(data.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
        </div>
        {/* HUD progress sub-bar simulation */}
        <div className="mt-4 h-[1px] bg-white/5 relative overflow-hidden">
             <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-${accent} to-transparent opacity-20`}
             />
        </div>
      </>,
      accent
    );
  }

  if (data.category === 'copy' || data.category === 'email') {
    return wrapInJarvis(
      <>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ClipboardList size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">{data.category === 'email' ? 'COMUNICAÇÃO_EXTERNA' : 'DATA_EXTRACT_BLOCK'}</span>
        </div>
        <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-4 font-mono text-xs break-all text-emerald-400/80 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
          {data.content}
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCopy(data.content)}
          className={`flex items-center justify-center w-full py-3 px-4 font-black uppercase text-[10px] tracking-[0.3em] rounded-xl transition-all border ${copied ? 'bg-emerald-600/30 border-emerald-400/50 text-white' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
        >
          {copied ? (
            <>
              <Check size={16} className="mr-2" />
              <span>DADOS_EM_MEMÓRIA</span>
            </>
          ) : (
            <>
              <Copy size={16} className="mr-2" />
              <span>Sincronizar_Buffer</span>
            </>
          )}
        </motion.button>
      </>,
      "emerald-400"
    );
  }

  if (data.category === 'note') {
    return wrapInJarvis(
      <>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
            <FileText size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">NÚCLEO_DE_ANOTAÇÃO</span>
        </div>
        <div className="bg-amber-400/5 p-4 rounded-xl border border-amber-400/10 mb-4 text-sm whitespace-pre-wrap text-white/80 font-light italic leading-relaxed">
          {data.text}
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCopy(data.text)}
          className={`flex items-center justify-center w-full py-3 px-4 font-black uppercase text-[10px] tracking-[0.3em] rounded-xl transition-all border ${copied ? 'bg-amber-600/30 border-amber-400/50 text-white' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}
        >
          {copied ? (
            <>
              <Check size={16} className="mr-2" />
              <span>NOTA_ENVIADA_BUFFER</span>
            </>
          ) : (
            <>
              <Copy size={16} className="mr-2" />
              <span>Copiar_Anotação</span>
            </>
          )}
        </motion.button>
      </>,
      "amber-400"
    );
  }

  if (data.category === 'task' || data.categoria === 'task' || data.categoria === 'tarefas') {
    const isDone = data.status === 'done';
    const isHigh = data.prioridade === 'high' || data.priority === 'high';
    const accent = isDone ? "green-400" : "cyan-400";
    
    return wrapInJarvis(
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${accent}/10 border border-${accent}/30 rounded-xl text-${accent}`}>
                {isDone ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-${accent}`}>
              {isDone ? 'SISTEMA_COMPLETADO' : 'AGENDAMENTO_ATIVO'}
            </span>
          </div>
          <div className="flex gap-2">
            {data.prioridade && <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
              data.prioridade === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
              data.prioridade === 'medium' ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' :
              'bg-blue-500/20 text-blue-500 border-blue-500/40'
            }`}>Prioridade: {data.prioridade}</span>}
          </div>
        </div>
        <h4 className={`text-xl font-bold tracking-tight mb-2 ${isDone ? 'text-white/20 line-through' : 'text-white'}`}>
          {data.titulo || data.title}
        </h4>
        {(data.descricao || data.description) && (
            <p className="text-sm text-white/40 mb-4 font-light italic leading-relaxed">
                {data.descricao || data.description}
            </p>
        )}
        {data.reminder_time && (
            <div className="flex items-center gap-2 mt-4 text-[9px] text-orange-400/80 font-mono uppercase tracking-[0.2em]">
                <Bell size={12} />
                <span>LEMBRETE: {new Date(data.reminder_time).toLocaleString()}</span>
            </div>
        )}
        {data.dueDate && (
            <div className="flex items-center gap-2 mt-4 text-[9px] text-amber-400/80 font-mono uppercase tracking-[0.2em]">
                <Clock size={12} />
                <span>LIMITE_EXECUÇÃO: {new Date(data.dueDate).toLocaleDateString()}</span>
            </div>
        )}
      </>,
      accent
    );
  }

  if (data.category === 'financial_report') {
    return <FinancialReportCard data={data} />;
  }

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/40 italic text-xs">
        Registro Desconhecido: {JSON.stringify(data.category)}
    </div>
  );
};

export default FocoFlowItemRenderer;
