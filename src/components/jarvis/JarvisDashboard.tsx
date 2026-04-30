import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisSidebar from './JarvisSidebar';
import JarvisTopbar from './JarvisTopbar';
import { FocoFlowFuturisticFinance } from '../dashboard/FocoFlowFuturisticFinance';
import DigitalParticles from './DigitalParticles';
import { FocoFlowTabContent } from '../../../services/FocoFlowTabContent';
import { auth } from '../../../firebase-singleton';

interface JarvisDashboardProps {
  onClose?: () => void;
  initialTab?: string;
  userId?: string;
  onSettingsClick?: () => void;
}

const JarvisDashboard: React.FC<JarvisDashboardProps> = ({ onClose, initialTab = 'finances', userId: propUserId, onSettingsClick }) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'monitoring' ? 'operational' : initialTab === 'notes' ? 'memory' : initialTab);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    if (initialTab) {
       const tab = initialTab === 'monitoring' ? 'operational' : initialTab === 'notes' ? 'memory' : initialTab;
       setActiveTab(tab);
       if (tab === 'finances') {
         setIsSidebarOpen(false);
       }
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'finances') {
       setIsSidebarOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!userId) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUserId(user?.uid || null);
      });
      return () => unsubscribe();
    }
  }, [userId]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[1000] bg-black text-white flex flex-col overflow-hidden"
    >
      {/* Immersive Background */}
      <div className="absolute inset-0 bg-[#00050a] pointer-events-none" />
      <div className="absolute inset-0 jarvis-hex-grid opacity-[0.03] pointer-events-none" />
      <DigitalParticles />
      
      {/* HUD Ornaments (Movie-like) */}
      <div className="absolute top-10 left-10 w-48 h-48 border border-cyan-500/10 rounded-full animate-jarvis-spin-slow pointer-events-none hidden lg:block">
         <div className="absolute inset-4 border-t-2 border-cyan-400/20 rounded-full animate-jarvis-spin-fast" />
         <div className="absolute inset-8 border-b border-cyan-300/10 rounded-full" />
         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/5 rotate-45" />
         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/5 -rotate-45" />
      </div>

      <div className="absolute bottom-10 right-10 w-64 h-64 border border-cyan-500/5 rounded-full animate-jarvis-spin-slow pointer-events-none hidden lg:block" style={{ animationDirection: 'reverse' }}>
         <div className="absolute inset-10 jarvis-circle-gauge opacity-10 animate-jarvis-spin-fast" />
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
         </div>
      </div>

      <div className="absolute top-40 right-20 space-y-4 pointer-events-none hidden lg:block">
         {[78, 42, 91].map((v, i) => (
            <div key={i} className="flex flex-col items-end gap-1">
               <div className="flex gap-1">
                  {[...Array(10)].map((_, j) => (
                     <div key={j} className={`w-1 h-3 ${j < v/10 ? 'bg-cyan-400/40' : 'bg-white/5'}`} />
                  ))}
               </div>
               <span className="text-[8px] font-mono text-cyan-400/30 uppercase tracking-[0.2em]">SYNC_CHANNEL_{i+1}</span>
            </div>
         ))}
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Header */}
        <JarvisTopbar 
          onClose={onClose} 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSettingsClick={onSettingsClick}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Side Menu */}
          <div className={`
             ${isSidebarOpen ? 'translate-x-0 w-72 h-full' : '-translate-x-full w-0 overflow-hidden'} 
             fixed md:relative inset-y-0 left-0 z-50 transition-all duration-300 ease-out
          `}>
             <JarvisSidebar 
               activeId={activeTab} 
               onSelect={(id) => {
                 setActiveTab(id);
                 if (window.innerWidth <= 768) setIsSidebarOpen(false);
               }} 
             />
          </div>

          {/* Mobile Overlay */}
          <AnimatePresence>
            {isSidebarOpen && window.innerWidth <= 768 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
            )}
          </AnimatePresence>
          
          {/* Main Visualizer Area */}
          <main className="flex-1 relative flex flex-col overflow-hidden">
            {/* HUD Scan Line for main area */}
            <div className="jarvis-scan-line opacity-20" />
            
            <AnimatePresence mode="wait">
              {activeTab === 'finances' || activeTab === 'goals' ? (
                <motion.div
                  key="finances"
                  className="flex-1 flex flex-col overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <FocoFlowFuturisticFinance 
                    userId={userId || ''} 
                    initialView={activeTab === 'goals' ? 'goals' : 'performance'} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="other"
                  className="flex-1 flex flex-col p-4 md:p-10 overflow-hidden relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="jarvis-glass p-4 md:p-8 flex-1 overflow-hidden relative">
                     {/* HUD Frame Lines */}
                     <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-cyan-400/50" />
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-cyan-400/50" />
                     
                     {userId ? (
                        <FocoFlowTabContent 
                           userId={userId} 
                           activeTab={activeTab === 'operational' ? 'monitoring' : activeTab === 'memory' ? 'notes' : activeTab} 
                        />
                     ) : (
                        <div className="h-full flex items-center justify-center text-cyan-400/50 uppercase tracking-widest text-[10px] md:text-xs font-mono">
                           Aguardando Verificação de Identidade...
                        </div>
                     )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
      
      {/* HUD Frame Borders (Global) */}
      <div className="absolute top-4 left-4 right-4 h-[1px] bg-cyan-400/10" />
      <div className="absolute bottom-4 left-4 right-4 h-[1px] bg-cyan-400/10" />
      <div className="absolute left-4 top-4 bottom-4 w-[1px] bg-cyan-400/10" />
      <div className="absolute right-4 top-4 bottom-4 w-[1px] bg-cyan-400/10" />
    </motion.div>
  );
};

export default JarvisDashboard;
