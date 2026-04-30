import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, 
    MicOff, 
    Camera, 
    CameraOff, 
    Monitor, 
    MonitorOff, 
    Settings,
    Power, 
    Brain,
    Eye,
    MessageSquare,
    Zap,
    Database,
    Shield,
    Layout,
    Maximize,
    BarChart3
} from 'lucide-react';
import AtlasAvatar from './AtlasAvatar';

interface ImmersiveHUDProps {
    assistantName: string;
    isMicActive: boolean;
    isCameraActive: boolean;
    isScreenSharing: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
    onMicToggle: () => void;
    onCameraToggle: () => void;
    onScreenToggle: () => void;
    onSettingsClick: () => void;
    onExit: () => void;
    sessionTime: number;
    lastAssistantMessage?: string;
    audioAnalyserRef?: React.RefObject<AnalyserNode | null>;
    inputAudioAnalyserRef?: React.RefObject<AnalyserNode | null>;
    onCardShowToggle?: () => void;
    onMenuClick?: () => void;
    activeAgentName?: string;
    activeAgentId?: string;
    isMicPermissionDenied?: boolean;
}

const DiagnosticStream: React.FC<{ label: string; color?: string }> = ({ label, color = 'cyan-400' }) => (
    <div className="flex flex-col gap-1 font-mono">
        <div className={`flex justify-between text-[8px] text-${color}/60 font-bold uppercase tracking-widest`}>
            <span>{label}</span>
            <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            >
                LIVE
            </motion.span>
        </div>
        <div className={`w-24 h-1 bg-${color.split('-')[0]}-900/30 rounded-full overflow-hidden`}>
            <motion.div 
                className={`h-full bg-${color}`}
                animate={{ width: ['20%', '80%', '40%', '90%', '30%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
        </div>
        <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
                <motion.div 
                    key={i}
                    className={`w-1 h-1 bg-${color}/40`}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.3, delay: i * 0.1, repeat: Infinity }}
                />
            ))}
        </div>
    </div>
);

const Panel: React.FC<{ label: string; children: React.ReactNode; color?: 'cyan' | 'pink' | 'purple' | 'green' | 'orange' }> = ({ label, children, color = 'cyan' }) => {
    const colorClasses: any = {
        cyan: 'text-cyan-400 border-cyan-500/30',
        pink: 'text-pink-400 border-pink-500/30',
        purple: 'text-purple-400 border-purple-500/30',
        green: 'text-green-400 border-green-500/30',
        orange: 'text-orange-500 border-orange-500/30',
    };
    return (
        <div className={`glass-morphism-vibrant p-5 rounded-3xl border ${colorClasses[color]} space-y-4`}>
            <div className="flex items-center gap-2">
                <div className={`w-1 h-3 rounded-full ${color === 'cyan' ? 'bg-cyan-400' : color === 'pink' ? 'bg-pink-400' : color === 'purple' ? 'bg-purple-400' : color === 'green' ? 'bg-green-400' : 'bg-orange-500'}`} />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">{label}</span>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};

const SmallStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center">
        <span className="text-[8px] text-white/30 uppercase tracking-widest mb-1">{label}</span>
        <span className="text-xs font-bold text-white tracking-wider">{value}</span>
    </div>
);

const ImmersiveHUD: React.FC<ImmersiveHUDProps> = ({
    assistantName,
    isMicActive,
    isCameraActive,
    isScreenSharing,
    isThinking,
    isSpeaking,
    onMicToggle,
    onCameraToggle,
    onScreenToggle,
    onSettingsClick,
    onExit,
    sessionTime,
    lastAssistantMessage,
    audioAnalyserRef,
    inputAudioAnalyserRef,
    onCardShowToggle,
    onMenuClick,
    activeAgentName,
    activeAgentId,
    isMicPermissionDenied
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMinimalist, setIsMinimalist] = useState(false);
    
    // JARVIS THEME logic
    const isJarvis = activeAgentId === 'jarvis';
    const accentColorClass = isJarvis ? 'orange-500' : 'cyan-400';
    const accentBorderClass = isJarvis ? 'border-orange-500/30' : 'border-cyan-500/30';
    const accentGlowClass = isJarvis ? 'shadow-[0_0_20px_rgba(249,115,22,0.25)]' : 'shadow-[0_0_20px_rgba(6,182,212,0.15)]';
    const accentTextClass = isJarvis ? 'text-orange-500' : 'text-cyan-400';
    const accentBgPulseClass = isJarvis ? 'bg-orange-500' : 'bg-cyan-400';
    const accentShadowIcon = isJarvis ? 'shadow-[0_0_8px_#f97316]' : 'shadow-[0_0_8px_#22d3ee]';

    return (
        <div id="hud-container" className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-hidden pointer-events-none">
            {/* Top Bar: Active Agent Indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none">
                <motion.div 
                    key={activeAgentName}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 px-5 py-1.5 rounded-full glass-morphism-vibrant border ${accentBorderClass} ${accentGlowClass}`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${accentBgPulseClass} animate-pulse ${accentShadowIcon}`} />
                        <span className={`text-[9px] font-bold tracking-[0.1em] ${accentTextClass}/80 uppercase`}>
                            {isJarvis ? 'JARVIS' : 'ATLAS'}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Advanced Visual Effects */}
            <div className={`absolute inset-0 grid-bg opacity-20 pointer-events-none ${isJarvis ? 'hue-rotate-[180deg] saturate-150' : ''}`} />
            
            {/* HUD Left: System Monitoring (Removed) */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 flex flex-col gap-6 pointer-events-auto z-20">
            </div>

            {/* HUD Right: Diagnostics (Removed) */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-72 flex flex-col gap-6 pointer-events-auto z-20">
            </div>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <span className="text-[25vw] font-black tracking-tighter text-white">{isJarvis ? 'JARVIS' : 'ATLAS'}</span>
            </div>

            {/* Dynamic Background Glow */}
            <AnimatePresence>
                {(isThinking || isSpeaking) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[-1]"
                        style={{
                            background: isJarvis
                                ? (isSpeaking 
                                    ? 'radial-gradient(circle at center, rgba(249, 115, 22, 0.25) 0%, transparent 70%)'
                                    : 'radial-gradient(circle at center, rgba(185, 28, 28, 0.2) 0%, transparent 70%)')
                                : (isSpeaking 
                                    ? 'radial-gradient(circle at center, rgba(0, 242, 255, 0.2) 0%, transparent 70%)'
                                    : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)')
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Avatar Interface */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <AtlasAvatar 
                    isThinking={isThinking} 
                    isSpeaking={isSpeaking}
                    isSleeping={!isMicActive}
                    isJarvis={isJarvis}
                />
            </div>

            {/* Bottom Center: Controls */}
            <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-auto">
                <div className="relative flex flex-col items-center">
                    {/* Horizontal Light Streak */}
                    <div className={`absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 w-[120vw] h-[2px] bg-gradient-to-r from-transparent via-${accentColorClass.split('-')[0]}-400 to-transparent opacity-40 blur-[1px] z-0`} />
                    <div className={`absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 w-[80vw] h-[1px] bg-${accentColorClass.split('-')[0]}-300 opacity-60 z-0`} />
                    
                    <div className="flex items-center gap-4 z-10">
                        <ActionButton 
                            icon={<span className="text-xl">💭</span>} 
                            label="MENU" 
                            onClick={onMenuClick || (() => {})}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={isMicActive ? <span className="text-xl">🎙️</span> : <span className="text-xl">🔇</span>} 
                            label={isMicPermissionDenied ? "BLOQUEADO" : "VOZ"} 
                            active={isMicActive}
                            onClick={onMicToggle}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={isCameraActive ? <span className="text-xl">📷</span> : <span className="text-xl">🚫</span>} 
                            label="CÂMERA" 
                            active={isCameraActive}
                            onClick={onCameraToggle}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={isScreenSharing ? <span className="text-xl">💻</span> : <span className="text-xl">🖥</span>} 
                            label="TELA" 
                            active={isScreenSharing}
                            onClick={onScreenToggle}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={<span className="text-xl">⚙️</span>} 
                            label="CONFIGURAÇÕES" 
                            onClick={onSettingsClick}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={<span className="text-xl">👥</span>} 
                            label="ESPECIALISTAS" 
                            onClick={onCardShowToggle || (() => {})}
                            isJarvis={isJarvis}
                        />
                        <ActionButton 
                            icon={<span className="text-xl">🚪</span>} 
                            label="SAIR" 
                            onClick={onExit}
                            isJarvis={isJarvis}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Right removed as requested */}
            <div />

            {/* Speech Output Overlay */}
            <AnimatePresence>
                {/* Speech Output Overlay Removed */}
            </AnimatePresence>
        </div>
    );
};

const StatusIndicator: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="status-indicator">
        <motion.span 
            className="status-value"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            {value}
        </motion.span>
        <span className="status-label">{label}</span>
    </div>
);

const MonitorItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="monitor-item">
        <div className="monitor-header">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="progress-bg">
            <motion.div 
                className="progress-bar" 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
        </div>
    </div>
);

const DiagnosticItem: React.FC<{ icon: React.ReactNode; label: string; status: string; isWarning?: boolean; isCritical?: boolean }> = ({ icon, label, status, isWarning, isCritical }) => (
    <div className="diagnostic-item">
        <div className="diag-icon">
            {icon}
        </div>
        <div className="diag-info">
            <h4>{label}</h4>
            <p className={isCritical ? 'text-red-500 font-bold' : isWarning ? 'text-orange-400' : 'text-green-400'}>{status}</p>
        </div>
        <div className={`diag-status ${isCritical ? 'bg-red-600 shadow-[0_0_10px_#dc2626]' : isWarning ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
    </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; subLabel?: string; active?: boolean; onClick: () => void; disabled?: boolean; isJarvis?: boolean }> = ({ icon, label, subLabel, active, onClick, disabled, isJarvis }) => (
    <button 
        className={`action-btn-new ${active ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isJarvis ? 'jarvis-btn' : ''}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
    >
        <div className="btn-content">
            <div className="btn-icon">
                {icon}
            </div>
            <span className="btn-label">{label}</span>
        </div>
        <div className={`btn-glow-bottom ${isJarvis ? 'bg-orange-500/40' : 'bg-cyan-500/20'}`} />
    </button>
);

export default ImmersiveHUD;
