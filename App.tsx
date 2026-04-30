import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useSpeechRecognition } from './src/hooks/useSpeechRecognition';
import { useVoiceSessionManager } from './src/hooks/useVoiceSessionManager';
import { 
    Send, 
    Paperclip, 
    Mic, 
    MicOff, 
    Camera, 
    CameraOff, 
    Monitor, 
    MonitorOff, 
    Volume2, 
    VolumeX,
    Plus,
    Trash2,
    Settings,
    History,
    Bell,
    User as UserIcon,
    LogOut,
    Search,
    ChevronRight,
    X,
    AlertCircle,
    ExternalLink,
    Shield,
    BarChart2,
    Maximize2,
    Menu,
    Archive,
    Sparkles
} from 'lucide-react';
import { startMicrophone, stopMicrophone, checkMicrophonePermission } from './src/services/microphoneService';
import { createLiveSession, ILiveSessionController, sendTextMessage, summarizeText, validateApiKey, generateMusic, summarizeConversation, generateSpeech } from './services/geminiService';
import { preprocessText } from './services/optimizationService';
import { toast } from 'sonner';
import { 
    saveConversationMessage, 
    getRecentConversationMessages, 
    saveSessionState,
    getSessionState,
    SessionState
} from './services/conversationMemory';
import { Sidebar } from './src/components/dashboard/Sidebar';
import { RightSidebar } from './src/components/dashboard/RightSidebar';
import { extractYouTubeVideoId, checkYouTubeVideoAvailability } from './services/youtubeUtils';
import { CustomTheme, applyCustomTheme } from './services/themeService';
import { 
    createFocoFlowTask, 
    createFocoFlowTransaction, 
    getFocoFlowData, 
    createFocoFlowProject, 
    createFocoFlowReminder, 
    createFocoFlowLink,
    createFocoFlowYouTube,
    updateFocoFlowItem,
    deleteFocoFlowItem,
    updateFocoFlowTransaction,
    deleteFocoFlowTransaction,
    getMonthlyFinancialReport,
    createFocoFlowNote,
    createFocoFlowAccount,
    createFocoFlowRecurring,
    createFocoFlowThirdParty,
    createFocoFlowFinancialGoal,
    deleteFocoFlowFinancialGoal,
    getOperationalAnalysis
} from './services/focoFlowService';
import { saveMemory, searchMemory, buscarMemorias } from './services/memoryService';
// import { salvarMensagem, buscarHistorico, buscarMemorias } from './services/supabaseService';
import { FocoFlowNXDashboard } from './src/components/dashboard/focoflow-nx/FocoFlowNXDashboard';
import FinancialReportCard from './components/FinancialReportCard';
// Removed FocoFlowDashboard
import AtlasLogo from './components/AtlasLogo';
import CopyableContentBlock from './components/CopyableContentBlock';
import MessageActions from './components/MessageActions';
import VisualHelpModal from './components/VisualHelpModal';
import ConfirmationModal from './components/ConfirmationModal';
import NotificationsModal from './components/NotificationsModal';
import AgentsModal from './components/AgentsModal';
import ArchivedConversationsModal from './components/ArchivedConversationsModal';
import SettingsModal from './components/SettingsModal';
import UserManagementModal from './components/UserManagementModal';
import AdminDashboard from './components/AdminDashboard';
import ImmersiveMode from './components/ImmersiveMode';
import { SYSTEM_AGENTS } from './constants';
import { ConversationMessage, Conversation, UserProfile, CustomAgent, SystemNotification } from './types';
import { auth, signOut, db, doc, updateDoc, setDoc, increment, storage, ref, uploadBytes, getDownloadURL, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs, limit, getDocFromServer, handleFirestoreError, OperationType, testConnection } from './firebase-singleton';
import ImmersiveHUD from './src/components/ImmersiveHUD';
import ATLASStatus from './src/components/ATLASStatus';
import ErrorBoundary from './components/ErrorBoundary';
import AlarmModal from './components/AlarmModal';


// ... (inside the App component or at the top level)

import type { User } from 'firebase/auth';

// Cost Constants & Token Estimations
// Pricing for gemini-2.5-flash in USD per 1M tokens (for text)
const GEMINI_FLASH_INPUT_COST_PER_MILLION_TOKENS = 0.35;
const GEMINI_FLASH_OUTPUT_COST_PER_MILLION_TOKENS = 0.70;

// ATLAS Voice Configuration (Jarvis Mode)
const ATLAS_VOICE_CONFIG = {
  silenceTimeout: 600000, // 10 minutes
  autoStopMic: false,
  companionMode: true,
  sessionDurationLimit: 9 * 60 * 1000 // 9 minutes
};

// Helper to generate the favicon SVG data URL with a status indicator.
const createFavicon = (isMicActive: boolean): string => {
  const GLogo = `<text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70' font-weight='bold' fill='white' font-family='sans-serif'>G</text>`;

  // Red dot for microphone in the top-right corner
  const micDot = isMicActive
    ? `<circle cx='80' cy='20' r='12' fill='#22c55e' stroke='white' stroke-width='2'/>`
    : '';

  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='#4A5568'/%3E${GLogo}${micDot}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
};

// Helper function to play a short beep sound for feedback.
const playBeep = (context: AudioContext | null, frequency = 440, duration = 100) => {
  if (!context || context.state === 'closed') return;
  if (context.state === 'suspended') {
    context.resume();
  }
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine'; // A simple, clean tone
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
  // Fade out to avoid clicking sound
  gainNode.gain.setValueAtTime(0.3, context.currentTime); // Start at a reasonable volume
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration / 1000);
};

// NEW: Helper function to play a futuristic startup sound (Jarvis style).
const playStartupSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;
    
    // Digital "blips" (Jarvis style)
    const playBlip = (time: number, freq: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    };

    playBlip(now, 1200);
    playBlip(now + 0.1, 1500);
    playBlip(now + 0.2, 1800);

    // Power up sweep
    const oscSweep = context.createOscillator();
    const gainSweep = context.createGain();
    oscSweep.type = 'sawtooth'; // More techy
    oscSweep.frequency.setValueAtTime(100, now + 0.3);
    oscSweep.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    
    // Filter for that resonant Jarvis feel
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.5);
    filter.Q.setValueAtTime(10, now + 0.3);

    gainSweep.gain.setValueAtTime(0, now + 0.3);
    gainSweep.gain.linearRampToValueAtTime(0.2, now + 0.6);
    gainSweep.gain.exponentialRampToValueAtTime(0.0001, now + 2);

    oscSweep.connect(filter);
    filter.connect(gainSweep);
    gainSweep.connect(context.destination);
    oscSweep.start(now + 0.3);
    oscSweep.stop(now + 2);

    // Final confirmation chime
    const playChime = (time: number, freq: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 1);
    };
    playChime(now + 1.5, 880);
    playChime(now + 1.6, 1100);
};

// NEW: Helper function to play a notification sound.
const playNotificationSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // Higher pitch for notification
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15); // Short, sharp sound

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15);
};

// NEW: Helper function to play an alarm sound.
export const playAlarmSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    
    // Check for custom alarm sound in settings
    try {
        const saved = localStorage.getItem('atlasSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.alarmSound) {
                const audio = new Audio(`/sounds/${settings.alarmSound}.mp3`);
                audio.play().catch(() => {
                    // Fallback to synthesizer if file loading fails
                    playSynthAlarm(context);
                });
                return;
            }
        }
    } catch (e) {
        console.warn("Could not play custom alarm sound, falling back to synth", e);
    }
    
    playSynthAlarm(context);
};

// Extracted synthesizer logic to a helper
export const playSynthAlarm = (context: AudioContext) => {
    if (context.state === 'suspended') context.resume();
    const now = context.currentTime;
    
    const playBeepAt = (time: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    };

    playBeepAt(now);
    playBeepAt(now + 0.25);
};


// Estimated costs for other modalities
const ESTIMATED_COST_PER_SECOND_OF_AUDIO = 0.000166; // Approx $0.01/min
const ESTIMATED_COST_PER_IMAGE_FRAME = 0.0025; // An estimate for image analysis
const ESTIMATED_COST_PER_TTS_CHARACTER = 0.000015; // Based on $15 per 1M characters

// Based on pricing, we can estimate token equivalents for non-text modalities
// to provide a unified view of consumption.
const COST_PER_INPUT_TOKEN = GEMINI_FLASH_INPUT_COST_PER_MILLION_TOKENS / 1_000_000;
const COST_PER_OUTPUT_TOKEN = GEMINI_FLASH_OUTPUT_COST_PER_MILLION_TOKENS / 1_000_000;

const ESTIMATED_TOKENS_PER_SECOND_OF_AUDIO = Math.round(ESTIMATED_COST_PER_SECOND_OF_AUDIO / COST_PER_INPUT_TOKEN); // ~474 tokens
const ESTIMATED_TOKENS_PER_IMAGE_FRAME = Math.round(ESTIMATED_COST_PER_IMAGE_FRAME / COST_PER_INPUT_TOKEN); // ~7143 tokens
const ESTIMATED_TOKENS_PER_TTS_CHARACTER = Math.round(ESTIMATED_COST_PER_TTS_CHARACTER / COST_PER_OUTPUT_TOKEN); // ~21 tokens

const TEXT_COMPRESSION_THRESHOLD = 300; // Summarize texts longer than 300 chars
const URL_REGEX = new RegExp('^(https?:\\/\\/)?'+ // protocol
'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
'(\\:\\d+)+?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
'(\\#[-a-z\\d_]*)?$','i'); // fragment locator

type Agent = string; // Relaxed type to allow custom IDs

// Utility function to convert Blob to Base64 (Data URL)
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Utility function to convert Blob/File to Base64 (raw string)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// NEW: Função utilitária para enviar status do microfone para a extensão
function enviarStatusParaExtensao(status: boolean) {
    try {
        if (window?.parent) {
            window.parent.postMessage(
                {
                    type: "ASSISTENTE_MIC_STATUS",
                    on: status
                },
                "*"
            );
            console.log("Status do microfone enviado:", status);
        }
    } catch (e) {
        console.warn("Não foi possível enviar status para extensão:", e);
    }
}


interface AppProps {
  user: User;
  initialUserData: Partial<UserProfile>;
  onApplyTheme?: (theme: string | undefined, customColor: string | undefined) => void;
}

// Helper to extract YouTube video ID
// (Moved to services/youtubeUtils.ts)


export const App: React.FC<AppProps> = ({ user, initialUserData, onApplyTheme }) => {
  const [path, setPath] = useState(window.location.pathname);
  
  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  useEffect(() => {
    testConnection();
  }, []);

  // UI State
  const [isMicActive, setIsMicActive] = useState(false);
  const [activeTone, setActiveTone] = useState<'formal' | 'informal' | 'technical' | 'humorous'>(initialUserData.tone || 'formal');
  const [voiceName, setVoiceName] = useState(initialUserData.voiceName || 'Kore'); 
  const [voiceState, setVoiceState] = useState<'OUVINDO' | 'PROCESSANDO' | 'FALANDO'>('FALANDO');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [isImmersiveMode, setIsImmersiveMode] = useState(true);
  const [showBootOverlay, setShowBootOverlay] = useState(false);
  const isImmersiveModeRef = useRef(true);
  
  const isJarvisPreBoot = useMemo(() => {
    return localStorage.getItem('assistantCustomName') === 'J.A.R.V.I.S.';
  }, []);

  useEffect(() => {
      isImmersiveModeRef.current = isImmersiveMode;
  }, [isImmersiveMode]);

  // Persist isMicActive
  useEffect(() => {
    localStorage.setItem('atlas_mic_active', isMicActive.toString());
  }, [isMicActive]);

  // Sidebar Visibility State (Expanded Mode)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarId, setActiveSidebarId] = useState('conversations');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [agentsModalMode, setAgentsModalMode] = useState<'list' | 'create'>('list');
  const [agentsModalCategory, setAgentsModalCategory] = useState<'system' | 'custom'>('system');
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  
  const playVoice = useCallback(async (text: string) => {
    try {
        const audioDataUrl = await generateSpeech(text, voiceName);
        const audio = new Audio(audioDataUrl);
        await audio.play();
    } catch (error) {
        console.error("Erro ao reproduzir voz do Atlas:", error);
    }
  }, [voiceName]);

  // Conversation History State
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => localStorage.getItem('atlas_active_convo_id'));
  const [activeMessages, setActiveMessages] = useState<ConversationMessage[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(() => !!localStorage.getItem('atlas_active_convo_id'));
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


  const handleLiveSessionRecovery = useCallback(async () => {
    const now = Date.now();
    
    // Prevent rapid reconnection loops (min 2 seconds between attempts)
    if (now - lastReconnectTimeRef.current < 2000 && reconnectAttemptsRef.current > 0) {
        console.warn("[ATLAS Recovery] Reconnection attempt too soon, skipping.");
        return;
    }

    // Limit total consecutive reconnect attempts to prevent infinite loops
    if (reconnectAttemptsRef.current >= 5) {
        console.error("[ATLAS Recovery] Max reconnection attempts reached. Stopping.");
        setIsMicActive(false);
        isMicActiveRef.current = false;
        setIsSessionActive(false);
        setIsMicLoading(false);
        setErrorMessage("Falha crítica na conexão. Por favor, reinicie o microfone manualmente.");
        return;
    }

    // Update session start time for the new session
    sessionStartTimeRef.current = Date.now();
    lastReconnectTimeRef.current = now;
    reconnectAttemptsRef.current += 1;

    console.log(`[ATLAS] Session expired - reconnecting (Attempt ${reconnectAttemptsRef.current})`);
    
    // 1. Clean up old session controller if it exists
    if (liveSessionControllerRef.current) {
      try {
        liveSessionControllerRef.current.closeSession();
        liveSessionControllerRef.current = null;
      } catch (e) {
        console.warn("[ATLAS Recovery] Error during cleanup:", e);
      }
    }

    // 2. Implement simple backoff (1-2 seconds)
    const backoffDelay = Math.min(1000 * reconnectAttemptsRef.current, 2000);

    // 3. Trigger a silent reconnect
    setTimeout(() => {
      if (isMicActiveRef.current) {
        if (handleToggleMicrophoneRef.current) {
            handleToggleMicrophoneRef.current(true, true, true);
        }
      }
    }, backoffDelay);
  }, []); // Dependence on handleToggleMicrophone removed!

  useEffect(() => {
    handleLiveSessionRecoveryRef.current = handleLiveSessionRecovery;
  }, [handleLiveSessionRecovery]);

  const { state: voiceSessionState, setState: setVoiceSessionState, handleReconnection } = useVoiceSessionManager(
    activeConversationId,
    (messages, sessionState) => {
      setActiveMessages(messages);
      if (sessionState) {
        setAtlasSessionState(sessionState);
        if (sessionState.último_agente && sessionState.último_agente !== activeAgent) {
            setActiveAgent(sessionState.último_agente as Agent);
        }
      }
      console.log("Context and session state restored from Firestore");
    },
    () => {
      startListening();
    }
  );

  // Fetch conversation history when activeConversationId changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (activeConversationId && activeConversationId !== 'default') {
        setIsMessagesLoading(true);
        const [history, sessionState] = await Promise.all([
            getRecentConversationMessages(activeConversationId),
            getSessionState(activeConversationId)
        ]);
        setActiveMessages(history);
        if (sessionState) {
            setAtlasSessionState(sessionState);
            setActiveAgent(sessionState.último_agente as Agent);
        } else {
            // Reset to defaults if no session state
            setAtlasSessionState({
                tópico: '',
                último_comando: '',
                último_agente: 'default'
            });
            setActiveAgent('default');
        }
        setIsMessagesLoading(false);
        if (history.length > 0) {
            console.log("Retomando a conversa...");
        }
      } else {
        setActiveMessages([]);
        setAtlasSessionState({
            tópico: '',
            último_comando: '',
            último_agente: 'default'
        });
        setActiveAgent('default');
      }
    };
    fetchHistory();
  }, [activeConversationId]);

  // Persist activeConversationId
  
  const [activeAgent, setActiveAgent] = useState<Agent>('default');
  // const [activeTone, setActiveTone] = useState<'formal' | 'informal' | 'technical' | 'humorous'>('formal'); // Removed re-declaration
  const [assistantCustomName, setAssistantCustomName] = useState(initialUserData.assistantCustomName || 'Atlas');
  const [atlasSessionState, setAtlasSessionState] = useState<SessionState>({
    tópico: '',
    último_comando: '',
    último_agente: 'default'
  });

  // Update Session State when activeAgent changes
  useEffect(() => {
    if (activeConversationId) {
        setAtlasSessionState(prev => ({
            ...prev,
            último_agente: activeAgent
        }));
    }

    // Sync assistant name with JARVIS mode
    if (activeAgent === 'jarvis') {
        setAssistantCustomName('J.A.R.V.I.S.');
    } else if (activeAgent === 'default') {
        const savedName = localStorage.getItem('assistantCustomName_original') || initialUserData.assistantCustomName || 'Atlas';
        setAssistantCustomName(savedName);
    }
  }, [activeAgent, activeConversationId, initialUserData.assistantCustomName]);

  // Save original assistant name for restoration
  useEffect(() => {
    if (assistantCustomName && assistantCustomName !== 'J.A.R.V.I.S.') {
        localStorage.setItem('assistantCustomName_original', assistantCustomName);
    }
  }, [assistantCustomName]);

  // Persist Session State when it changes
  useEffect(() => {
    if (activeConversationId && activeConversationId !== 'default') {
        saveSessionState(activeConversationId, atlasSessionState).catch(e => console.error("Error saving session state:", e));
    }
  }, [atlasSessionState, activeConversationId]);

  // Conversation Renaming State
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{titulo: string; descricao: string} | null>(null);
  
  // Transcription & Input State
  const [currentInputTranscription, setCurrentInputTranscription] = useState<string>('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState<string>('');
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Sync state with refs for UI display - but we update refs directly in voice callbacks
  useEffect(() => {
    currentInputTranscriptionRef.current = currentInputTranscription;
  }, [currentInputTranscription]);

  useEffect(() => {
    currentOutputTranscriptionRef.current = currentOutputTranscription;
  }, [currentOutputTranscription]);

  const [textInput, setTextInput] = useState('');
  
  // Session & Command State
  const [visualHelp, setVisualHelp] = useState<{ image: string; highlight: { x: number; y: number } } | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]); 
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isSummarizedMode, setIsSummarizedMode] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const sessionStartTimeRef = useRef(Date.now());

  // Session Timer Effect
  useEffect(() => {
      const interval = setInterval(() => {
          setSessionTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
  }, []);

  // ATLAS Companion Mode: Heartbeat & Session Renewal
  useEffect(() => {
    if (!ATLAS_VOICE_CONFIG.companionMode || !handleLiveSessionRecovery) return;

    const interval = setInterval(() => {
        const elapsed = Date.now() - sessionStartTimeRef.current;
        
        // 1. Session Renewal (before 9 min limit)
        if (elapsed > ATLAS_VOICE_CONFIG.sessionDurationLimit) {
            console.log("[ATLAS] Renewing session before expiration...");
            sessionStartTimeRef.current = Date.now();
            handleLiveSessionRecovery();
        }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [handleLiveSessionRecovery]);

  const [usageInfo, setUsageInfo] = useState({ totalTokens: initialUserData.usage?.totalTokens || 0, totalCost: initialUserData.usage?.totalCost || 0 });
  const [remainingTokens, setRemainingTokens] = useState(initialUserData.usage?.remainingTokens || 0);
  const [userApiKey, setUserApiKey] = useState<string | null>(() => localStorage.getItem('userGideonApiKey'));
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidatingInSettings, setIsValidatingInSettings] = useState(false);
  const [validationErrorInSettings, setValidationErrorInSettings] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [usdToBrlRate, setUsdToBrlRate] = useState<number | null>(null);

  const isAdmin = useMemo(() => {
    const defaultAdmins = ['iaatlas31@gmail.com', 'gabrielsantion15@gmail.com', 'enegocio606@gmail.com', 'atlas@system.com'];
    return initialUserData.role === 'admin' || (user.email && defaultAdmins.includes(user.email) && user.emailVerified);
  }, [initialUserData.role, user.email, user.emailVerified]);

  const handleFocoFlowCommand = useCallback(async (command: string, args: any): Promise<{ success?: boolean; message?: string; report?: any; data?: any; url?: string; videoId?: string | null; audioUrl?: string; error?: string }> => {
    try {
        switch (command) {
            case 'createFocoFlowTask':
                await createFocoFlowTask(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Tarefa criada no FocoFlow." };
            case 'createFocoFlowProject':
                await createFocoFlowProject(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Projeto criado no FocoFlow." };
            case 'createFocoFlowReminder':
                await createFocoFlowReminder(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Lembrete criado no FocoFlow." };
            case 'createFocoFlowTransaction':
                await createFocoFlowTransaction(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Transação registrada no FocoFlow." };
            case 'createFocoFlowLink':
                await createFocoFlowLink(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Link salvo no FocoFlow." };
            case 'createFocoFlowYouTube':
                await createFocoFlowYouTube(user.uid, args);
                await saveMemory(`Usuário salvou o vídeo: ${args.title || args.url}`, 'video_history');
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Vídeo do YouTube salvo no FocoFlow." };
            case 'generateMusic':
                const audioUrl = await generateMusic(args.prompt, args.duration || 'clip');
                return { success: true, message: "Música gerada com sucesso.", audioUrl };
            case 'playMusicOnYouTube':
                let videoIdToPlay = null;
                let candidates: string[] = [];
                
                // 1. Try direct URL first if provided
                if (args.url) {
                    videoIdToPlay = extractYouTubeVideoId(args.url);
                }
                
                // 2. If no direct URL or it failed, use videoIds list from args
                if (!videoIdToPlay && args.videoIds && Array.isArray(args.videoIds) && args.videoIds.length > 0) {
                    candidates = args.videoIds;
                }
                
                // 3. If still no videoId, use the new API to search and extract
                if (!videoIdToPlay && args.query) {
                    try {
                        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(args.query)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.videoIds && data.videoIds.length > 0) {
                                candidates = [...candidates, ...data.videoIds];
                            }
                        }
                    } catch (e) {
                        console.error("Failed to fetch from YouTube search API:", e);
                    }
                }

                // 4. Validate candidates and find the first available one
                if (!videoIdToPlay && candidates.length > 0) {
                    // Filter out duplicates
                    const uniqueCandidates = Array.from(new Set(candidates));
                    for (const id of uniqueCandidates) {
                        const isAvailable = await checkYouTubeVideoAvailability(id);
                        if (isAvailable) {
                            videoIdToPlay = id;
                            break;
                        }
                    }
                }
                
                // 5. Fallback to search query if still nothing (last resort)
                if (!videoIdToPlay && args.query) {
                    if (args.query.includes('youtube.com') || args.query.includes('youtu.be')) {
                        videoIdToPlay = extractYouTubeVideoId(args.query);
                    }
                }

                if (videoIdToPlay) {
                    const finalUrl = `https://www.youtube.com/watch?v=${videoIdToPlay}&autoplay=1`;
                    window.open(finalUrl, '_blank');
                    await saveMemory(`Usuário assistiu ao vídeo: ${args.title || args.query || 'vídeo do YouTube'}`, 'video_history');
                    return { 
                        success: true, 
                        message: `🎵 Tocando agora no YouTube: ${args.title || args.query || "música"}`, 
                        videoId: videoIdToPlay,
                        data: { title: args.title || args.query, channelName: args.channelName }
                    };
                } else {
                    // If all else fails, open the search results page
                    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                    window.open(searchUrl, '_blank');
                    return { 
                        success: true, 
                        message: `Abrindo pesquisa por ${args.query} no YouTube.`, 
                        url: searchUrl,
                        data: { title: args.title || args.query }
                    };
                }
            case 'searchOnYouTube':
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                return { success: true, message: "Pesquisando no YouTube.", url: searchUrl };
            case 'getFocoFlowData':
                const data = await getFocoFlowData(user.uid, args.collectionName, args.limit, args.category, args.status);
                return { success: true, data };
            case 'updateFocoFlowItem':
                await updateFocoFlowItem(args.id, args.data);
                return { success: true, message: "Item atualizado no FocoFlow." };
            case 'deleteFocoFlowItem':
                await deleteFocoFlowItem(args.id);
                return { success: true, message: "Item excluído do FocoFlow." };
            case 'updateFocoFlowTransaction':
                await updateFocoFlowTransaction(args.id, args.data);
                return { success: true, message: "Transação atualizada no FocoFlow." };
            case 'deleteFocoFlowTransaction':
                await deleteFocoFlowTransaction(args.id);
                return { success: true, message: "Transação excluída do FocoFlow." };
            case 'getMonthlyFinancialReport':
                const report = await getMonthlyFinancialReport(user.uid);
                return { success: true, report };
            case 'openYouTube':
                const ytUrl = 'https://www.youtube.com';
                window.open(ytUrl, '_blank');
                return { 
                    success: true, 
                    message: "YouTube aberto em uma nova aba.", 
                    url: ytUrl,
                    data: { category: 'link', title: 'Abrir YouTube', url: ytUrl } 
                };
            case 'openExternalPanel':
                const panelUrl = 'https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev';
                window.open(panelUrl, '_blank');
                return { 
                    success: true, 
                    message: "Painel Externo Atlas aberto em uma nova aba.", 
                    url: panelUrl,
                    data: { category: 'link', title: 'ABRIR PAINEL ATLAS', url: panelUrl }
                };
            case 'searchOnGoogle':
                const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
                window.open(googleSearchUrl, '_blank');
                return { success: true, message: `Pesquisando "${args.query}" no Google...`, url: googleSearchUrl };
            case 'openWebsite':
                const item = { 
                    category: 'link', 
                    title: args.siteName || 'Painel Externo', 
                    url: args.url 
                };
                return { 
                    success: true, 
                    message: `Ponto de acesso para ${args.siteName || 'site'} gerado. Clique no botão abaixo para ativar a conexão.`, 
                    data: item 
                };
            case 'createFocoFlowNote':
                await createFocoFlowNote(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh_notes'));
                return { success: true, message: "Anotação salva no Bloco de Notas." };
            case 'createFocoFlowAccount':
                await createFocoFlowAccount(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Conta criada no FocoFlow." };
            case 'createFocoFlowRecurring':
                await createFocoFlowRecurring(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Transação recorrente registrada." };
            case 'createFocoFlowThirdParty':
                await createFocoFlowThirdParty(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Cadastro de terceiro realizado." };
            case 'createFocoFlowFinancialGoal':
                await createFocoFlowFinancialGoal(user.uid, args);
                window.dispatchEvent(new CustomEvent('focoflow_refresh'));
                return { success: true, message: "Meta financeira criada." };
            case 'atlasListUsers':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                const usersSnap = await getDocs(collection(db, 'Usuarios'));
                const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
                return { success: true, data: usersData };
            case 'atlasUpdateUserStatus':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                await updateDoc(doc(db, 'Usuarios', args.userId), { status: args.status });
                return { success: true, message: `Status do usuário ${args.userId} atualizado para ${args.status}.` };
            case 'atlasUpdateUserRole':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                await updateDoc(doc(db, 'Usuarios', args.userId), { role: args.role });
                return { success: true, message: `Role do usuário ${args.userId} atualizado para ${args.role}.` };
            case 'atlasDeleteUser':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                if (args.userId === user.uid) return { error: "Você não pode excluir a si mesmo." };
                await deleteDoc(doc(db, 'Usuarios', args.userId));
                return { success: true, message: `Usuário ${args.userId} excluído permanentemente.` };
            case 'atlasDeleteFocoFlowItem':
                await deleteFocoFlowItem(args.itemId);
                return { success: true, message: "Item excluído com sucesso do FocoFlow." };
            case 'atlasDeleteFocoFlowTransaction':
                await deleteFocoFlowTransaction(args.transactionId);
                return { success: true, message: "Transação excluída com sucesso do FocoFlow." };
            case 'atlasDeleteFocoFlowGoal':
                await deleteFocoFlowFinancialGoal(args.goalId);
                return { success: true, message: "Meta financeira excluída com sucesso do FocoFlow." };
            case 'atlasAuthorizeEmail':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                await setDoc(doc(db, 'authorized_emails', args.email), { 
                    status: 'active', 
                    addedAt: serverTimestamp(), 
                    addedBy: user.email 
                }, { merge: true });
                return { success: true, message: `E-mail ${args.email} autorizado com sucesso.` };
            case 'atlasGetSecurityLogs':
                if (!isAdmin) return { error: "Sem permissão administrativa." };
                const logsSnap = await getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(args.limit || 20)));
                const logsData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                return { success: true, data: logsData };
            case 'atlasAnalyzeNXFinancials':
                const analysis = await getOperationalAnalysis(user.uid);
                return { success: true, data: analysis };
            case 'atlasOpenNXDashboard':
                window.location.hash = '#/financeiro';
                return { success: true, message: "Painel FocoFlow NX aberto com sucesso." };
             case 'openSettings':
                setIsSettingsModalOpen(true);
                return { success: true, message: "Abrindo configurações." };
            case 'openFocoFlowDashboard':
                const nxPanelUrl = 'https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev';
                window.open(nxPanelUrl, '_blank');
                return { success: true, message: "Painel NX aberto em uma nova aba.", url: nxPanelUrl };
            default:
                return { error: "Comando desconhecido." };
        }
    } catch (e: any) {
        return { error: e.message };
    }
  }, [user.uid]);
  const handleSearchPastConversationsCommand = useCallback(async (queryStr: string, limitCount: number = 10) => {
    console.log("Searching past conversations for:", queryStr);
    if (!user) return { error: "Usuário não autenticado." };

    try {
      const convosPath = 'conversas';
      const convosQuery = query(collection(db, convosPath), where('uid', '==', user.uid));
      let convosSnapshot;
      try {
        convosSnapshot = await getDocs(convosQuery);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, convosPath);
        throw err;
      }
      
      if (convosSnapshot.empty) return { result: "Nenhuma conversa anterior encontrada." };

      const allConvos = convosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0));

      let results: any[] = [];
      const searchTerms = queryStr.toLowerCase().split(' ').filter(t => t.length > 2);

      for (const convo of allConvos.slice(0, 30)) { // Check more conversations
        let matchFound = false;
        
        // Check title
        if (convo.title && convo.title.toLowerCase().includes(queryStr.toLowerCase())) {
          matchFound = true;
        }

        const msgPath = `conversas/${convo.id}/mensagens`;
        const msgQuery = query(
          collection(db, msgPath),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        let msgSnapshot;
        try {
          msgSnapshot = await getDocs(msgQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, msgPath);
          continue; // Skip this conversation if we can't read its messages
        }
        
        msgSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.text) {
            const textLower = data.text.toLowerCase();
            const isDirectMatch = textLower.includes(queryStr.toLowerCase());
            const hasSearchTerms = searchTerms.length > 0 && searchTerms.every(term => textLower.includes(term));

            if (isDirectMatch || hasSearchTerms || matchFound) {
              results.push({
                convoTitle: convo.title,
                role: data.role,
                text: data.text.substring(0, 500) + (data.text.length > 500 ? '...' : ''),
                timestamp: data.timestamp instanceof Date ? data.timestamp.toLocaleString() : 
                           (data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : 'Data desconhecida')
              });
            }
          }
        });
      }

      if (results.length === 0) {
        return { result: `Não encontrei referências claras a "${queryStr}" no histórico de projetos e conversas.` };
      }

      // Sort results by timestamp (chronological)
      results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Deduplicate by text to avoid spamming the same message if it matches multiple ways
      const uniqueResults = Array.from(new Map(results.map(item => [item.text, item])).values());

      return { 
        result: `Encontrei as seguintes referências no histórico para "${queryStr}":\n` + 
        uniqueResults.slice(0, limitCount).map(r => `[${r.timestamp}] na conversa "${r.convoTitle}" - ${r.role}: ${r.text}`).join('\n\n')
      };

    } catch (error) {
      console.error("Error searching past conversations:", error);
      return { error: "Erro ao buscar no histórico." };
    }
  }, [user]);

  const handleSearchMemoryCommand = useCallback(async (queryStr: string, limitCount: number = 5) => {
    if (!user) return { error: "Usuário não autenticado." };
    const result = await searchMemory(queryStr, limitCount);
    return { result };
  }, [user]);

  const handleSaveImportantMemoryCommand = useCallback(async (info: string) => {
    if (!user) return { error: "Usuário não autenticado." };
    await saveMemory(info);
    return { result: "Informação salva na memória importante." };
  }, [user]);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [profilePicUrl, setProfilePicUrl] = useState(initialUserData.profilePicUrl || null);
  const [theme, setTheme] = useState(initialUserData.theme || 'dark');
  const [customThemeColor, setCustomThemeColor] = useState(initialUserData.customThemeColor || '#00B7FF');
  const [tempColor, setTempColor] = useState(initialUserData.customThemeColor || '#00B7FF'); 
  const [userPreferredName, setUserPreferredName] = useState(initialUserData.userPreferredName || '');
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(initialUserData.textToSpeechEnabled || false); // NEW State for TTS
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => {
    const saved = localStorage.getItem('atlas_custom_themes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCustomThemeId, setActiveCustomThemeId] = useState<string | null>(() => {
    return localStorage.getItem('atlas_active_custom_theme_id');
  });

  useEffect(() => {
    const testMemory = async () => {
      try {
        const { salvarMemoria } = await import('./services/memoryService');
        await salvarMemoria(user.uid, "TESTE ATLAS MEMORIA FUNCIONANDO");
        console.log("Test memory saved successfully.");
      } catch (e) {
        console.error("Test memory save failed:", e);
      }
    };
    
    if (user) {
      testMemory();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const userPath = `Usuarios/${user.uid}`;
      const updates: any = { 
        uid: user.uid,
        email: user.email,
        'lastSeen': serverTimestamp()
      };
      setDoc(doc(db, 'Usuarios', user.uid), updates, { merge: true })
        .catch(e => {
          console.error("Error updating lastSeen:", e);
          handleFirestoreError(e, OperationType.UPDATE, userPath);
        });
    }
  }, [user]);

  // Apply custom theme on load
  useEffect(() => {
    if (activeCustomThemeId) {
      const theme = customThemes.find(t => t.id === activeCustomThemeId);
      if (theme) {
        applyCustomTheme(theme);
      } else {
        applyCustomTheme(null);
      }
    } else {
      applyCustomTheme(null);
    }
  }, [activeCustomThemeId, customThemes]);

  // Persist custom themes
  useEffect(() => {
    localStorage.setItem('atlas_custom_themes', JSON.stringify(customThemes));
  }, [customThemes]);

  useEffect(() => {
    if (activeCustomThemeId) {
        localStorage.setItem('atlas_active_custom_theme_id', activeCustomThemeId);
    } else {
        localStorage.removeItem('atlas_active_custom_theme_id');
    }
  }, [activeCustomThemeId]);

  // Persist custom assistant name to localStorage for Auth screen
  useEffect(() => {
      if (assistantCustomName) {
          localStorage.setItem('assistantCustomName', assistantCustomName);
      }
  }, [assistantCustomName]);

  // Notification System State
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const hasPlayedNotificationSoundRef = useRef(false); // NEW: To prevent multiple notification sounds
  const [ringingAlarms, setRingingAlarms] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]); // NEW: State to hold all reminders
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const liveSessionControllerRef = useRef<ILiveSessionController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastReconnectTimeRef = useRef(0);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null); 
  const audioAnalyserRef = useRef<AnalyserNode | null>(null); // Output Analyser
  const inputAudioAnalyserRef = useRef<AnalyserNode | null>(null); // NEW: Input Analyser Ref
  const animationFrameRef = useRef<number | null>(null); // NEW: Animation Loop Ref
  const frameIntervalRef = useRef<number | null>(null);
  const usageUpdateRef = useRef({ tokenDelta: 0, costDelta: 0 });
  const firestoreUpdateTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 2. Define the ref instead of inlining it
  const handleToggleMicrophoneRef = useRef<any>(null); // Note: defined already above!
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null); // NEW: Visualizer Canvas Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      // Auto-start removed as per user request: "QUERO ATIVAÇÃO DO JARVIS MANUAL MSM"
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  
  // Scrolling Logic Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true); // Default to true so it starts at bottom

  // --- TEXTAREA AUTO-RESIZE ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textInput]);

  // Refs for State (Fix Stale Closures in Event Listeners)
  const isMicActiveRef = useRef(isMicActive);
  const handleLiveSessionRecoveryRef = useRef<(() => Promise<void>) | null>(null);
  const isScreenSharingRef = useRef(isScreenSharing);
  const isCameraActiveRef = useRef(isCameraActive);
  
  // Prevent duplicate messages
  const lastProcessedResponseRef = useRef<string>('');


  // Efeito para atualizar o favicon, mostrando um ponto vermelho quando o microfone está ativo.
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = createFavicon(isMicActive);
    }
  }, [isMicActive]);
  
  // Sync Refs with State
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { isCameraActiveRef.current = isCameraActive; }, [isCameraActive]);

  // Previous state ref for mic active status to detect change
  const prevIsMicActiveRef = useRef<boolean>(isMicActive);
  
  // Effect to play a sound when the microphone is turned off.
  useEffect(() => {
    if (prevIsMicActiveRef.current && !isMicActive) {
      // Play a low-pitched beep to indicate 'off'
      // Note: We only play sound here if state changed. The actual logic is in disconnectSession or handleToggle
      // window.speechSynthesis.cancel(); // Stopped in handler
    }
    prevIsMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Ensure video element stays in sync with stream state to fix visibility issues
  useEffect(() => {
    if (videoRef.current) {
        if (isCameraActive && cameraStreamRef.current) {
            if (videoRef.current.srcObject !== cameraStreamRef.current) {
                videoRef.current.srcObject = cameraStreamRef.current;
                videoRef.current.play().catch(e => console.warn("Video play error (camera):", e));
            }
        } else if (isScreenSharing && screenStreamRef.current) {
             if (videoRef.current.srcObject !== screenStreamRef.current) {
                videoRef.current.srcObject = screenStreamRef.current;
                videoRef.current.play().catch(e => console.warn("Video play error (screen):", e));
            }
        }
    }
  }, [isCameraActive, isScreenSharing]);

  useEffect(() => {
    const handleOpenConversation = (e: any) => {
      if (e.detail?.id) {
        setActiveConversationId(e.detail.id);
      }
    };
    window.addEventListener('atlas_open_conversation', handleOpenConversation);
    return () => {
      window.removeEventListener('atlas_open_conversation', handleOpenConversation);
    };
  }, []);

  // --- PRESENCE SYSTEM (Online Status) ---
  useEffect(() => {
      if (!user) return;

      const updatePresence = async () => {
          try {
              const userRef = doc(db, 'Usuarios', user.uid);
              await setDoc(userRef, {
                  visto_por_ultimo: serverTimestamp()
              }, { merge: true });
          } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `Usuarios/${user.uid}`);
          }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 60000);

      const handleVisibilityChange = () => {
          if (!document.hidden) {
              updatePresence();
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [user]);

  // Derived state for active and archived conversations
  const { activeConversations, archivedConversations } = useMemo(() => {
    const active: Conversation[] = [];
    const archived: Conversation[] = [];
    allConversations.forEach(convo => {
      if (convo.isArchived) {
        archived.push(convo);
      } else {
        active.push(convo);
      }
    });
    return { activeConversations: active, archivedConversations: archived };
  }, [allConversations]);

  const activeConversation = useMemo(() => 
    allConversations.find(c => c.id === activeConversationId), 
  [allConversations, activeConversationId]);

  const updateConversationSummary = useCallback(async (convoId: string, messages: ConversationMessage[]) => {
    if (messages.length < 5) return; // Don't summarize very short conversations
    
    try {
      const textToSummarize = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const summary = await summarizeText(`Resuma esta conversa focando nos principais pontos, decisões e continuidade de projetos para servir como memória de longo prazo:\n\n${textToSummarize}`);
      if (summary) {
        const convoPath = `conversas/${convoId}`;
        try {
          await updateDoc(doc(db, 'conversas', convoId), { summary });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, convoPath);
        }
      }
    } catch (err) {
      console.error("Error summarizing conversation:", err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId && activeMessages.length > 0 && activeMessages.length % 10 === 0) {
      updateConversationSummary(activeConversationId, activeMessages);
    }
  }, [activeMessages.length, activeConversationId, updateConversationSummary]);

  const addMessage = useCallback(async (
      role: 'user' | 'model' | 'system', 
      text: string, 
      options: {
          summary?: string;
          imageUrl?: string;
          fileName?: string;
          blockType?: 'code' | 'text' | 'prompt';
          audioUrl?: string;
          youtubeVideoId?: string;
          youtubeTitle?: string;
          youtubeChannel?: string;
      } = {}
  ): Promise<string | null> => {
      console.log(`addMessage called: role=${role}, text_length=${text.length}`);
      if (!activeConversationId) return null;
      try {
          const { summary, imageUrl, fileName, blockType, audioUrl, youtubeVideoId, youtubeTitle, youtubeChannel } = options;
          
          // Automatically extract YouTube Video ID if not explicitly provided
          let finalYoutubeVideoId = youtubeVideoId;
          if (!finalYoutubeVideoId && text) {
              const youtubeMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
              if (youtubeMatch) {
                  finalYoutubeVideoId = youtubeMatch[1];
              }
          }

          const messageData = { 
              role: role === 'model' ? 'assistant' : role, 
              text, 
              uid: user?.uid, // Added uid for easier cross-conversation searching in future
              timestamp: serverTimestamp(), 
              ...(summary && { summary }), 
              ...(imageUrl && { imageUrl }), 
              ...(fileName && { fileName }),
              ...(blockType && { blockType }),
              ...(audioUrl && { audioUrl }),
              ...(finalYoutubeVideoId && { youtubeVideoId: finalYoutubeVideoId }),
              ...(youtubeTitle && { youtubeTitle }),
              ...(youtubeChannel && { youtubeChannel })
          };
          const messageRef = await addDoc(collection(db, `conversas/${activeConversationId}/mensagens`), messageData);
          
          // SALVAR NO SUPABASE (Sincronização desativada)
          /*
          try {
              await salvarMensagem(activeConversationId, role === 'model' ? 'assistant' : (role as string), text, false);
          } catch (supabaseErr) {
              console.error("Erro ao salvar mensagem no Supabase:", supabaseErr);
          }
          */

          // REPRODUZIR VOZ (MODO ATLAS)
          if (role === 'model') {
              playVoice(text);
          }

          // Update conversation last activity
          await updateDoc(doc(db, 'conversas', activeConversationId), { updatedAt: serverTimestamp() });

          // SAVE TO PERSISTENT MEMORY
          if (user?.uid && (role === 'user' || role === 'model')) {
              saveMemory(
                  text, 
                  role === 'model' ? 'atlas' : 'user'
              ).catch(e => console.error("Error saving to persistent memory:", e));
          }

          return messageRef.id;
      } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `conversas/${activeConversationId}/mensagens`);
          setErrorMessage("Falha ao salvar a mensagem.");
          return null;
      }
  }, [activeConversationId, user?.uid]);

  const checkAndSaveProgrammingLevel = useCallback(async (userMessage: string) => {
    if (activeAgent === 'programmer' && !initialUserData.programmingLevel) {
      const messageLower = userMessage.toLowerCase().trim();
      let level: 'basic' | 'intermediate' | 'advanced' | null = null;

      const basicTerms = ['básico', 'basico', 'iniciante', 'basic', 'beginner'];
      const intermediateTerms = ['intermédio', 'intermediário', 'intermediario', 'medio', 'medium', 'intermediate'];
      const advancedTerms = ['avançado', 'avancado', 'expert', 'especialista', 'senior', 'advanced'];

      if (basicTerms.some(term => messageLower.includes(term))) {
        level = 'basic';
      } else if (intermediateTerms.some(term => messageLower.includes(term))) {
        level = 'intermediate';
      } else if (advancedTerms.some(term => messageLower.includes(term))) {
        level = 'advanced';
      }
      
      if (level) {
        try {
          const userDocRef = doc(db, 'Usuarios', user.uid);
          await setDoc(userDocRef, { programmingLevel: level }, { merge: true });
          addMessage('system', `Seu nível de programação foi salvo como: ${level}.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `Usuarios/${user.uid}`);
          setErrorMessage("Não foi possível salvar seu nível de programação.");
        }
      }
    }
  }, [activeAgent, initialUserData.programmingLevel, user.uid, addMessage]);

  // Sync internal state with props from Firestore listener
  useEffect(() => {
    setProfilePicUrl(initialUserData.profilePicUrl || null);
    setTheme(initialUserData.theme || 'dark');
    setCustomThemeColor(initialUserData.customThemeColor || '#00B7FF');
    setTempColor(initialUserData.customThemeColor || '#00B7FF');
    setVoiceName(initialUserData.voiceName || 'Kore');
    setIsTextToSpeechEnabled(initialUserData.textToSpeechEnabled || false);
    setRemainingTokens(initialUserData.usage?.remainingTokens || 0);
    setUsageInfo({
      totalTokens: initialUserData.usage?.totalTokens || 0,
      totalCost: initialUserData.usage?.totalCost || 0
    });
  }, [initialUserData]);

  // Fetch System Notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
        collection(db, 'system_notifications'),
        orderBy('criado_em', 'desc'),
        limit(5)
    );

    const path = 'system_notifications';
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifs: SystemNotification[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifs.push({
                id: doc.id,
                title: data.titulo || data.title,
                message: data.message,
                videoUrl: data.videoUrl,
                linkUrl: data.linkUrl, // Added linkUrl
                linkText: data.linkText, // Added linkText
                createdAt: data.criado_em?.toDate() || data.createdAt?.toDate() || new Date(),
            });
        });
        setNotifications(notifs);
        
        const seenStorage = localStorage.getItem('seenNotificationIds');
        const seenIds = seenStorage ? JSON.parse(seenStorage) : [];
        const hasUnread = notifs.some(n => !seenIds.includes(n.id));

        if (hasUnread) {
            setUnreadNotifications(true);
            // Play sound only if it hasn't been played for this batch of unread notifications
            if (!hasPlayedNotificationSoundRef.current && outputAudioContextRef.current) {
                playNotificationSound(outputAudioContextRef.current);
                hasPlayedNotificationSoundRef.current = true;
            }
        } else {
            setUnreadNotifications(false);
            hasPlayedNotificationSoundRef.current = false; // Reset if no unread notifications
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const markNotificationsAsSeen = useCallback(async () => {
      if (!notifications || notifications.length === 0) return;

      const seenStorage = localStorage.getItem('seenNotificationIds');
      const seenIds: string[] = seenStorage ? JSON.parse(seenStorage) : [];
      const newSeenIds = [...seenIds];
      let hasUpdates = false;

      for (const n of notifications) {
          if (!seenIds.includes(n.id)) {
              const notifRef = doc(db, 'system_notifications', n.id);
              try {
                  await updateDoc(notifRef, { viewCount: increment(1) });
              } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `system_notifications/${n.id}`);
              }
              newSeenIds.push(n.id);
              hasUpdates = true;
          }
      }

      if (hasUpdates) {
          localStorage.setItem('seenNotificationIds', JSON.stringify(newSeenIds));
      }
      setUnreadNotifications(false);
      hasPlayedNotificationSoundRef.current = false; // Reset after marking as seen
  }, [notifications]);

  // NEW: FocoFlow Alarms Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'itens_focoflow'),
      where('uid', '==', user.uid),
      where('categoria', '==', 'reminder')
    );

    const path = 'itens_focoflow';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      snapshot.forEach((doc) => {
        const item = doc.data();
        if (item.reminder_time && item.reminder_time <= now && !item.dismissed) {
          setActiveAlarm({ titulo: item.titulo || 'Lembrete', descricao: item.descricao || '' });
          setIsAlarmOpen(true);
          updateFocoFlowItem(doc.id, { dismissed: true });
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // NEW: Alarm Checker Effect
  useEffect(() => {
    if (!reminders || reminders.length === 0) {
      setRingingAlarms([]);
      return;
    }

    const checkAlarms = () => {
      const now = Date.now();
      const active = (reminders || []).filter((r: any) => {
        // Trigger if reminderTime is reached and not dismissed/completed
        // We allow a window of 1 hour for old alarms to trigger if they weren't dismissed
        const oneHourAgo = now - (60 * 60 * 1000);
        return r.reminderTime <= now && r.reminderTime > oneHourAgo && !r.dismissed && !r.completed;
      });
      
      // Only update if the list of active alarms actually changed to prevent unnecessary re-renders
      setRingingAlarms(prev => {
        const currentPrev = prev || [];
        const prevIds = currentPrev.map(a => a.id).sort().join(',');
        const nextIds = active.map(a => a.id).sort().join(',');
        if (prevIds === nextIds) return currentPrev;
        return active;
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    checkAlarms();

    return () => clearInterval(interval);
  }, [reminders]);

  // NEW: Alarm Sound Effect
  useEffect(() => {
    if (ringingAlarms && ringingAlarms.length > 0) {
      if (!alarmIntervalRef.current && !alarmAudioRef.current) {
        // Read setting
        let customSound = 'som1';
        try {
          const saved = localStorage.getItem('atlasSettings');
          if (saved) {
             const settings = JSON.parse(saved);
             if (settings.alarmSound) customSound = settings.alarmSound;
          }
        } catch (e) {}

        // Try to play MP3 first
        const audio = new Audio(`/sounds/${customSound}.mp3`);
        audio.loop = true;
        alarmAudioRef.current = audio;
        
        audio.play().then(() => {
          // Playing successfully, no need for synth interval
        }).catch(() => {
          // Fallback to synth interval if MP3 fails
          alarmAudioRef.current = null;
          if (!alarmIntervalRef.current) {
            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
              try {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              } catch (e) {}
            }
            alarmIntervalRef.current = window.setInterval(() => {
              if (outputAudioContextRef.current) {
                playSynthAlarm(outputAudioContextRef.current);
              }
            }, 1000);
          }
        });
      }
    } else {
      // Stop everything
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      if (alarmAudioRef.current) alarmAudioRef.current.pause();
    };
  }, [ringingAlarms]);

  const handleDismissAlarm = useCallback(async (alarmId: string) => {
    try {
        await updateFocoFlowItem(alarmId, { dismissed: true });
        setRingingAlarms(prev => (prev || []).filter(a => a.id !== alarmId));
    } catch (error) {
        console.error("Error dismissing alarm:", error);
    }
  }, []);

  const handleDismissAllAlarms = useCallback(async () => {
    if (!ringingAlarms || ringingAlarms.length === 0) return;
    try {
        const ids = ringingAlarms.map(a => a.id);
        await Promise.all(ids.map(id => updateFocoFlowItem(id, { dismissed: true })));
        setRingingAlarms([]);
    } catch (error) {
        console.error("Error dismissing all alarms:", error);
    }
  }, [ringingAlarms]);

  const handleStopAlarmCommand = useCallback(() => {
      console.log("Stopping alarm via voice command...");
      handleDismissAllAlarms();
  }, [handleDismissAllAlarms]);

  const handleUpdateUserPreferencesCommand = useCallback(async (prefs: { themeColor?: string; assistantName?: string; userName?: string }) => {
      console.log("Updating user preferences via voice command:", prefs);
      if (!user) return;

      const updates: any = {};

      if (prefs.themeColor) {
          setCustomThemeColor(prefs.themeColor);
          updates.customThemeColor = prefs.themeColor;
      }

      if (prefs.assistantName) {
          setAssistantCustomName(prefs.assistantName);
          updates.assistantCustomName = prefs.assistantName;
      }

      if (prefs.userName) {
          setUserPreferredName(prefs.userName);
          updates.userPreferredName = prefs.userName;
      }

      if (Object.keys(updates).length > 0) {
          const userPath = `Usuarios/${user.uid}`;
          try {
              await setDoc(doc(db, 'Usuarios', user.uid), updates, { merge: true });
          } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, userPath);
          }
      }
  }, [user]);

  // NEW: Fetch Custom Agents
  useEffect(() => {
      if (!user) return;

      const q = query(
          collection(db, `Usuarios/${user.uid}/custom_agents`),
          orderBy('criado_em', 'desc')
      );

      const path = `Usuarios/${user.uid}/custom_agents`;
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const agents: CustomAgent[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              agents.push({
                  id: doc.id,
                  name: data.nome || data.name,
                  description: data.descricao || data.description,
                  systemInstruction: data.systemInstruction,
                  createdAt: data.criado_em?.toDate() || data.createdAt?.toDate() || new Date(),
              });
          });
          setCustomAgents(agents);
      }, (err) => {
          handleFirestoreError(err, OperationType.GET, path);
      });

      return () => unsubscribe();
  }, [user]);

  // Fetch all conversations for the user
  useEffect(() => {
      if (!user) return;
      setIsConversationsLoading(true);

      const q = query(
          collection(db, 'conversas'),
          where('uid', '==', user.uid)
      );

      const path = 'conversas';
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedConversations: Conversation[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedConversations.push({
                  id: doc.id,
                  uid: data.uid,
                  title: data.title || data.titulo || "Sem título",
                  createdAt: (data.createdAt || data.criado_em)?.toDate() || new Date(),
                  isArchived: data.isArchived || data.esta_arquivado || false,
                  summary: data.summary,
              });
          });
          
          fetchedConversations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          setAllConversations(fetchedConversations);
          
          const currentActive = fetchedConversations.find(c => !c.isArchived);

          // If we have a saved ID, try to find it. Otherwise fallback to most recent.
          const savedId = localStorage.getItem('atlas_active_convo_id');
          const savedConvo = savedId ? fetchedConversations.find(c => c.id === savedId) : null;

          if (!activeConversationId) {
              if (savedConvo) {
                  setActiveConversationId(savedConvo.id);
              } else if (currentActive) {
                  setActiveConversationId(currentActive.id);
              }
          }
          
          if (!initialLoadComplete && !currentActive) {
              seedInitialConversation();
          }
          
          setIsConversationsLoading(false);
          setInitialLoadComplete(true);
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setErrorMessage("Não foi possível carregar seu histórico de conversas.");
          setIsConversationsLoading(false);
      });

      return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch messages for the active conversation
  useEffect(() => {
      if (!activeConversationId) {
          setActiveMessages([]);
          return;
      }
      
      // Reset scroll tracking when changing conversations
      shouldAutoScrollRef.current = true;

      setIsMessagesLoading(true);
      const q = query(
          collection(db, `conversas/${activeConversationId}/mensagens`),
          orderBy('timestamp', 'asc')
      );

      const path = `conversas/${activeConversationId}/mensagens`;
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedMessages: ConversationMessage[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedMessages.push({
                  id: doc.id,
                  role: data.role === 'assistant' ? 'model' : data.role,
                  text: data.text,
                  timestamp: data.timestamp?.toDate() || new Date(),
                  summary: data.summary,
                  imageUrl: data.imageUrl,
                  fileName: data.fileName,
                  blockType: data.blockType,
                  ...(data.audioUrl && { audioUrl: data.audioUrl }),
                  ...(data.youtubeVideoId && { youtubeVideoId: data.youtubeVideoId }),
              });
          });
          setActiveMessages(fetchedMessages);
          setIsMessagesLoading(false);
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setErrorMessage("Não foi possível carregar as mensagens desta conversa.");
          setIsMessagesLoading(false);
      });

      return () => unsubscribe();
  }, [activeConversationId]);

  // SMART AUTO-SCROLL LOGIC
  const handleChatScroll = useCallback(() => {
      if (chatContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          // Determine if user is near bottom (within 100px)
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
          shouldAutoScrollRef.current = isAtBottom;
      }
  }, []);

  useEffect(() => {
      if (shouldAutoScrollRef.current && chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [activeMessages, currentInputTranscription, currentOutputTranscription]);


  const handleLogout = async () => {
    try {
      if (user?.email) {
        localStorage.setItem('lastKnownTokenCount', JSON.stringify({ email: user.email, tokens: remainingTokens }));
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error)
    }
  };
  
  const updateUsage = useCallback((tokens: number, cost: number) => {
      if (userApiKey) return;
      setUsageInfo(prev => ({ totalTokens: prev.totalTokens + tokens, totalCost: prev.totalCost + cost }));
      setRemainingTokens(prev => prev - tokens);
      usageUpdateRef.current.tokenDelta += tokens;
      usageUpdateRef.current.costDelta += cost;
      if (firestoreUpdateTimerRef.current) clearTimeout(firestoreUpdateTimerRef.current);
      firestoreUpdateTimerRef.current = window.setTimeout(async () => {
          const { tokenDelta, costDelta } = usageUpdateRef.current;
          if (tokenDelta > 0 || costDelta > 0) {
              const userPath = `Usuarios/${user.uid}`;
              const userDocRef = doc(db, 'Usuarios', user.uid);
              try {
                  await setDoc(userDocRef, {
                      usage: {
                          totalTokens: increment(tokenDelta),
                          totalCost: increment(costDelta),
                          remainingTokens: increment(-tokenDelta)
                      }
                  }, { merge: true });
              } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, userPath);
              }
              usageUpdateRef.current = { tokenDelta: 0, costDelta: 0 };
          }
      }, 3000);
  }, [user.uid, userApiKey]);
  
  const generateAndStoreSummary = useCallback(async (messageId: string, text: string) => {
    if (text.length > TEXT_COMPRESSION_THRESHOLD && activeConversationId) {
        const messagePath = `conversas/${activeConversationId}/mensagens/${messageId}`;
        try {
            const summary = await summarizeText(text);
            const messageRef = doc(db, `conversas/${activeConversationId}/mensagens`, messageId);
            await updateDoc(messageRef, { summary });
        } catch(err) {
            handleFirestoreError(err, OperationType.UPDATE, messagePath);
        }
    }
  }, [activeConversationId]);

  const generateConversationSummary = useCallback(async () => {
    if (activeConversationId && activeMessages.length > 0) {
        try {
            const activeConversation = activeConversations.find(c => c.id === activeConversationId);
            const currentSummary = activeConversation?.summary;
            // Summarize the last few messages to update the long-term memory
            const newSummary = await summarizeConversation(currentSummary, activeMessages.slice(-6));
            if (newSummary && newSummary !== currentSummary) {
                const conversationPath = `conversas/${activeConversationId}`;
                const conversationDocRef = doc(db, 'conversas', activeConversationId);
                try {
                    await updateDoc(conversationDocRef, { summary: newSummary });
                    console.log("Conversation summary updated for continuity.");
                    
                    // Also save to Atlas memory for long-term persistence and searchability
                    await saveMemory(`Resumo da conversa "${activeConversation?.title || 'Sem título'}": ${newSummary}`, 'important_memory');
                    
                    // Notify FocoFlow dashboard to refresh
                    window.dispatchEvent(new CustomEvent('focoflow_refresh_conversations'));
                } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, conversationPath);
                }
            }
        } catch (err) {
            console.error("Error generating conversation summary:", err);
        }
    }
  }, [activeConversationId, activeMessages, activeConversations, user.uid]);

  useEffect(() => {
    const handleSummarize = (e: any) => {
      if (e.detail?.id === activeConversationId) {
        generateConversationSummary();
      }
    };
    window.addEventListener('atlas_summarize_conversation', handleSummarize);
    return () => {
      window.removeEventListener('atlas_summarize_conversation', handleSummarize);
    };
  }, [activeConversationId, generateConversationSummary]);
  
  const clearSilenceTimer = useCallback(() => {
  }, []); 

  const startSilenceTimer = useCallback(() => {
  }, []); 

  // --- OPTIMIZED VIDEO CAPTURE (Downscaling) ---
  // MOVED UP to be available for stopScreenSharing (indirectly if needed, though logically distinct)
  const captureScreenAsBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) { resolve(null); return; }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use alpha: false to optimize canvas performance for video frames
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          // MAX WIDTH 800px for performance optimization
          const MAX_WIDTH = 800;
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          if (width > MAX_WIDTH) {
              const scale = MAX_WIDTH / width;
              width = MAX_WIDTH;
              height = height * scale;
          }

          // Set canvas to downscaled size
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(video, 0, 0, width, height);
          
          // Compress to JPEG 0.6 quality
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
      } else {
        resolve(null);
      }
    });
  }, []);

  // --- DISCONNECT SESSION ---
  // MOVED UP to be available for stopScreenSharing
  const disconnectSession = useCallback(() => {
    setIsMicActive(false);
    if (liveSessionControllerRef.current) {
        liveSessionControllerRef.current?.stopMicInput();
        liveSessionControllerRef.current?.closeSession();
        liveSessionControllerRef.current = null;
    }
    // Also force stop videos if full disconnect is called
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScreenSharing(false);
    setIsCameraActive(false);
    setVisualHelp(null);
    
    playBeep(outputAudioContextRef.current, 300, 150); 
    enviarStatusParaExtensao(false);
  }, []);

  const stopScreenSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScreenSharing(false);
    setVisualHelp(null);

    // Keep the session open to maintain context, even if screen sharing is off.
    console.log("Screen sharing stopped. Session remains open to maintain context.");
  }, [disconnectSession]); 

  // Define handleActivateAgent and handleDeactivateAgent early so they are available for useCallback dependencies and other functions.
  const handleActivateAgent = useCallback((agentId: Agent) => {
    if (agentId === activeAgent) return;
    if (isMicActive) {
        // We don't turn off mic here immediately to avoid disrupting the flow
    }
    setActiveAgent(agentId);
    setIsAgentsModalOpen(false);
    
    // Determine name for system message
    let agentName = 'Agente Personalizado';
    const customAgent = customAgents.find(a => a.id === agentId);
    const systemAgent = SYSTEM_AGENTS.find(a => a.id === agentId);

    if (customAgent) {
        agentName = customAgent.name;
    } else if (systemAgent) {
        agentName = systemAgent.name;
    }

    if (agentId === 'jarvis') {
        playStartupSound(outputAudioContextRef.current);
        setAssistantCustomName('J.A.R.V.I.S.');
    }

    toast.success(`Protocolo Ativado: ${agentName}`, {
        description: `O sistema agora está operando sob a identidade de ${agentName}. Todas as diretrizes e conhecimentos foram carregados com sucesso.`,
        duration: 5000,
        icon: <Sparkles className="w-5 h-5 text-purple-400" />
    });

    addMessage('system', `Sistema ativou o modo: ${agentName}`);
  }, [activeAgent, customAgents, addMessage, isMicActive]);

  const handleDeactivateAgent = useCallback(() => {
    if (activeAgent === 'default') return;
    setActiveAgent('default');
    setIsAgentsModalOpen(false);
    
    toast.info("Protocolo Desativado", {
        description: "Retornando ao Assistente Padrão e diretrizes originais.",
        duration: 4000
    });

    addMessage('system', 'Sistema ativou o modo: Assistente Padrão');
  }, [activeAgent, addMessage]);

  const handleCreateCustomAgent = useCallback(async (name: string, desc: string, instr: string) => {
    if(!user) return;
    try {
        await addDoc(collection(db, `Usuarios/${user.uid}/custom_agents`), {
            nome: name, 
            descricao: desc, 
            systemInstruction: instr, 
            criado_em: serverTimestamp()
        });
        toast.success("Agente criado com sucesso!");
    } catch(err) { 
        handleFirestoreError(err, OperationType.WRITE, `Usuarios/${user.uid}/custom_agents`);
        setErrorMessage("Erro ao criar agente. Verifique as permissões."); 
    }
  }, [user]);

  const handleUpdateCustomAgent = useCallback(async (id: string, name: string, desc: string, instr: string) => {
    if(!user) return;
    try {
        await updateDoc(doc(db, `Usuarios/${user.uid}/custom_agents`, id), {
            nome: name, 
            descricao: desc, 
            systemInstruction: instr,
            atualizado_em: serverTimestamp()
        });
        toast.success("Agente atualizado com sucesso!");
    } catch(err) { 
        handleFirestoreError(err, OperationType.UPDATE, `Usuarios/${user.uid}/custom_agents/${id}`);
        setErrorMessage("Erro ao atualizar agente."); 
    }
  }, [user]);

  const handleDeleteCustomAgent = useCallback((id: string) => {
    if(!user) return;
    setAgentToDelete(id);
  }, [user]);

  const confirmDeleteAgent = useCallback(async () => {
    if(!user || !agentToDelete) return;
    try {
        await deleteDoc(doc(db, `Usuarios/${user.uid}/custom_agents`, agentToDelete));
        if(activeAgent === agentToDelete) handleActivateAgent('default');
        setAgentToDelete(null);
    } catch(err) { 
        handleFirestoreError(err, OperationType.DELETE, `Usuarios/${user.uid}/custom_agents/${agentToDelete}`);
        setErrorMessage("Erro ao excluir agente."); 
    }
  }, [user, agentToDelete, activeAgent, handleActivateAgent]);

  const onSwitchAgentCommand = useCallback((agentName: string) => {
      // Normalize string: Lowercase, remove accents
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedInput = normalize(agentName);

      // 1. Check Custom Agents (Name Matching)
      const customMatch = customAgents.find(a => 
          normalize(a.name).includes(normalizedInput) || normalizedInput.includes(normalize(a.name))
      );
      if (customMatch) {
          handleActivateAgent(customMatch.id);
          return;
      }

      // 2. Check System Agents (Keywords & Name Matching)
      // This allows the AI to send "trafego", "gestor", "andromeda" and we find the right agent
      const systemMatch = SYSTEM_AGENTS.find(a => 
          // Match ID directly
          a.id === agentName ||
          // Match Name partial
          normalize(a.name).includes(normalizedInput) ||
          // Match any defined keyword
          a.keywords.some(k => normalizedInput.includes(k))
      );

      if (systemMatch) {
          handleActivateAgent(systemMatch.id);
          return;
      }

      // Fallback: If "default" or general terms are used but missed above
      if (['padrao', 'normal', 'voltar', 'inicio'].some(k => normalizedInput.includes(k))) {
          handleActivateAgent('default');
      }

  }, [customAgents, handleActivateAgent]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setVisualHelp(null);

    // Keep the session open to maintain context, even if camera is off.
    console.log("Camera stopped. Session remains open to maintain context.");
  }, [disconnectSession]);

  useEffect(() => {
    // Clear existing interval to avoid duplicates
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // UPDATED LOOP: Send frame if video is active, REGARDLESS of mic state (as long as session exists)
    // We assume the session is open (via toggleMicrophone logic or initial setup)
    if ((isScreenSharing || isCameraActive) && isSessionActive && liveSessionControllerRef.current) {
       frameIntervalRef.current = window.setInterval(async () => {
          const blob = await captureScreenAsBlob();
          if (blob) {
              try {
                  const base64Data = await blobToBase64(blob);
                  liveSessionControllerRef.current?.sessionPromise?.then((session) => {
                      session.sendRealtimeInput({ video: { data: base64Data, mimeType: 'image/jpeg' } });
                  });
                  updateUsage(ESTIMATED_TOKENS_PER_IMAGE_FRAME, ESTIMATED_COST_PER_IMAGE_FRAME);
              } catch (e) { console.error("Error sending frame:", e); }
          }
       }, 1000); 
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isSessionActive, isScreenSharing, isCameraActive, updateUsage, captureScreenAsBlob]);

  const startScreenSharing = useCallback(async (): Promise<boolean> => {
    try {
      if (isCameraActive) {
          // Stop camera but don't disconnect session
          if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
          }
          setIsCameraActive(false);
          await new Promise(r => setTimeout(r, 100));
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
      
      setIsScreenSharing(true);
      
      // If session is not active, start it automatically for real-time visual analysis
      // Fix: Use isMicActiveRef to avoid stale closure and force state to true to avoid toggling off
      if (!isMicActiveRef.current && !isMicLoading && handleToggleMicrophoneRef.current) {
          handleToggleMicrophoneRef.current(false, true);
      }

      return true;
    } catch (err: any) {
      console.warn('Screen sharing failed or cancelled:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : '';

      if (
        errorName === 'NotAllowedError' || 
        errorName === 'AbortError' ||
        errorMsg.includes('Permission denied') ||
        errorMsg.includes('user denied') ||
        errorMsg.includes('User denied')
      ) {
        return false;
      }

      setErrorMessage("Falha ao iniciar o compartilhamento de tela.");
      return false;
    }
  }, [stopScreenSharing, isCameraActive, isMicLoading]); // Added isMicLoading to deps

  const startCamera = useCallback(async (): Promise<boolean> => {
      try {
        if (isScreenSharing) {
            // Stop screen but don't disconnect session
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            await new Promise(r => setTimeout(r, 100));
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraStreamRef.current = stream;
        stream.getVideoTracks()[0].onended = () => {
            stopCamera();
        };

        setIsCameraActive(true);

        // If session is not active, start it automatically for real-time visual analysis
        // Fix: Use isMicActiveRef to avoid stale closure and force state to true to avoid toggling off
        if (!isMicActiveRef.current && !isMicLoading && handleToggleMicrophoneRef.current) {
            handleToggleMicrophoneRef.current(false, true);
        }

        return true;
      } catch (err: any) {
          console.warn('Camera start failed or cancelled:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorName = err instanceof Error ? err.name : '';

          if (
            errorName === 'NotAllowedError' || 
            errorName === 'NotFoundError' || 
            errorName === 'AbortError' ||
            errorMsg.includes('Permission denied') ||
            errorMsg.includes('user denied')
          ) {
             if (errorName === 'NotFoundError') {
                setErrorMessage("Nenhuma câmera encontrada no dispositivo.");
             }
             return false;
          }

          setErrorMessage(`Falha ao iniciar a câmera: ${errorMsg}`);
          return false;
      }
  }, [stopCamera, isScreenSharing, isSessionActive]);
  
  // --- MONITORAMENTO DE COMPRIMENTO DA CONVERSA ---
  useEffect(() => {
    if (activeMessages.length > 80 && activeConversationId) {
        const hasWarning = activeMessages.some(m => m.role === 'system' && m.text.includes("O ATLAS IA informa"));
        if (!hasWarning) {
            addMessage('system', "O ATLAS IA informa: Esta conversa está ficando longa. Para manter o desempenho e a precisão, você pode me pedir para iniciar uma nova conversa ou usar o botão 'Nova Conversa'. Eu manterei o resumo do que discutimos para continuidade.");
        }
    }
  }, [activeMessages.length, activeConversationId, addMessage]);

  const seedInitialConversation = async () => {
    if (liveSessionControllerRef.current) {
        disconnectSession();
    }
    
    try {
        const conversationsPath = 'conversas';
        const newConvoRef = await addDoc(collection(db, conversationsPath), {
            uid: user.uid,
            title: "Atlas IA: Ponto de Partida",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
            summary: "Configuração inicial do sistema Atlas IA.",
        });

        const messagesPath = `conversas/${newConvoRef.id}/mensagens`;
        const initialMessages = [
            {
                role: 'system',
                text: 'Olá! Sou o ATLAS IA. Seu ambiente está configurado e pronto para uso.\n\n- **Controle Total**: Posso gerenciar suas tarefas e finanças no FocoFlow.\n- **Visão Real**: Posso analisar sua tela ou câmera no Modo Imersivo.\n- **Continuidade Inteligente**: Quando as conversas ficam longas, posso migrá-las para novas sessões mantendo o contexto.',
                timestamp: serverTimestamp(),
                uid: user.uid
            }
        ];

        for (const msg of initialMessages) {
            await addDoc(collection(db, messagesPath), msg);
        }

        // Save to memory too
        await saveMemory('O sistema Atlas IA foi configurado com sucesso. Firebase, Auth e Firestore Rules estão operacionais.', 'important_memory');

        setActiveConversationId(newConvoRef.id);
        setInitialLoadComplete(true);
    } catch (err) {
        console.error("Error seeding initial conversation:", err);
        handleNewChat(); // Fallback to standard new chat
    }
  };

  const handleNewChat = async (passedSummary?: string, passedTitle?: string) => {
    // If we have a session, close it entirely when starting new chat
    if(liveSessionControllerRef.current) {
        disconnectSession();
    }
    
    // Auto-archive current conversation if it exists
    if (activeConversationId) {
        const conversationPath = `conversas/${activeConversationId}`;
        try {
            const conversationDocRef = doc(db, 'conversas', activeConversationId);
            await updateDoc(conversationDocRef, { isArchived: true });
        } catch (err) {
            console.error("Error auto-archiving conversation:", err);
            handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        }
    }
    
    try {
        // Clear state before creating new to give immediate UI feedback
        setActiveMessages([]);
        setIsMessagesLoading(true);
        const conversationsPath = 'conversas';
        const newConvoRef = await addDoc(collection(db, conversationsPath), {
            uid: user.uid,
            title: passedTitle || "Nova Conversa",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
            summary: passedSummary || null
        });

        const messagesPath = `conversas/${newConvoRef.id}/mensagens`;
        
        if (passedSummary) {
            await addDoc(collection(db, messagesPath), {
                role: 'assistant',
                text: `Iniciando nova rota de conversa. Ponto de partida: ${passedSummary}`,
                timestamp: serverTimestamp(),
                uid: user.uid
            });
        }

        setActiveConversationId(newConvoRef.id);
        setTextInput('');
        setCurrentInputTranscription('');
        setCurrentOutputTranscription('');
        setErrorMessage(null);
        setIsMessagesLoading(false);
        setIsConversationsLoading(false);
        toast.success(passedTitle ? `Iniciando: ${passedTitle}` : "Nova conversa criada.");
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'conversas');
        setErrorMessage("Falha ao criar nova conversa.");
        setIsMessagesLoading(false);
        setIsConversationsLoading(false);
    }
  };
  
  const handleArchiveConversation = async (conversationId: string) => {
    const conversationPath = `conversas/${conversationId}`;
    try {
        const conversationDocRef = doc(db, 'conversas', conversationId);
        await updateDoc(conversationDocRef, { isArchived: true });

        if (activeConversationId === conversationId) {
            const nextActiveConvo = activeConversations.find(c => c.id !== conversationId);
            if (nextActiveConvo) {
                setActiveConversationId(nextActiveConvo.id);
            } else {
                handleNewChat();
            }
        }
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        setErrorMessage("Não foi possível arquivar a conversa.");
    }
  };
  
  const handleRestoreConversation = async (conversationId: string) => {
      const conversationPath = `conversas/${conversationId}`;
      try {
          const conversationDocRef = doc(db, 'conversas', conversationId);
          await updateDoc(conversationDocRef, { isArchived: false, createdAt: serverTimestamp() });
          setActiveConversationId(conversationId);
          setIsArchivedModalOpen(false); // Close the archived modal after restoring
      } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, conversationPath);
          setErrorMessage("Não foi possível restaurar a conversa.");
      }
  };

  const handleDeleteConversation = async () => {
    if (!chatToDelete) return;
    const conversationPath = `conversas/${chatToDelete.id}`;
    try {
      const messagesPath = `conversas/${chatToDelete.id}/mensagens`;
      const messagesQuery = query(collection(db, messagesPath));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(messagesQuery);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, messagesPath);
        throw err;
      }
      for (const doc of querySnapshot.docs) {
          try {
              await deleteDoc(doc.ref);
          } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, doc.ref.path);
          }
      }

      if (activeConversationId === chatToDelete.id) {
          const nextActiveConvo = activeConversations.find(c => c.id !== chatToDelete.id) || activeConversations[0] || null;
          setActiveConversationId(null);
          try {
            await deleteDoc(doc(db, 'conversas', chatToDelete.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, conversationPath);
            throw err;
          }
          if (nextActiveConvo) {
              setActiveConversationId(nextActiveConvo.id);
          } else {
              handleNewChat();
          }
      } else {
          try {
            await deleteDoc(doc(db, 'conversas', chatToDelete.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, conversationPath);
            throw err;
          }
      }
      setChatToDelete(null); 
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, conversationPath);
        setErrorMessage("Não foi possível excluir a conversa.");
        setChatToDelete(null); 
    }
  };
  
  const startEditingConversation = (convo: Conversation) => {
    setEditingConversationId(convo.id);
    setEditTitleInput(convo.title);
  };

  const saveConversationTitle = async (convoId: string) => {
    if (!editTitleInput.trim() || editTitleInput === "") {
         setEditingConversationId(null);
         return;
    }
    const conversationPath = `conversas/${convoId}`;
    try {
        await updateDoc(doc(db, 'conversas', convoId), { title: editTitleInput.trim() });
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        setErrorMessage("Erro ao atualizar o titulo.");
    } finally {
        setEditingConversationId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, convoId: string) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveConversationTitle(convoId);
    } else if (e.key === 'Escape') {
        setEditingConversationId(null);
    }
  };

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        if (!response.ok) throw new Error('Failed to fetch exchange rate');
        const data = await response.json();
        const rate = parseFloat(data.USDBRL.bid);
        setUsdToBrlRate(rate);
      } catch (error) {
        console.error("Could not fetch USD to BRL exchange rate:", error);
      }
    };
    fetchExchangeRate();
    inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
    outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
    
    // Setup Audio Analysers for Visualizer
    const setupAnalysers = () => {
        if (outputAudioContextRef.current) {
            const outAnalyser = outputAudioContextRef.current.createAnalyser();
            outAnalyser.fftSize = 512;
            outAnalyser.smoothingTimeConstant = 0.6;
            outAnalyser.connect(outputAudioContextRef.current.destination);
            audioAnalyserRef.current = outAnalyser;
        }
        if (inputAudioContextRef.current) {
            const inAnalyser = inputAudioContextRef.current.createAnalyser();
            inAnalyser.fftSize = 512;
            inAnalyser.smoothingTimeConstant = 0.6;
            // Don't connect input analyser to destination to avoid feedback loop
            inputAudioAnalyserRef.current = inAnalyser;
        }
    };
    setupAnalysers();

    // Galaxy Animation State
    let time = 0;
    const numStars = 400;
    const stars: {x: number, y: number, z: number, radius: number, angle: number, speed: number, color: string, dist: number}[] = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: 0,
            y: 0,
            z: Math.random() * 2,
            radius: Math.random() * 1.5 + 0.5,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.01 + 0.002,
            color: `hsl(${Math.random() * 40 + 190}, 100%, ${Math.random() * 40 + 60}%)`, // Cyan/Blue colors
            dist: Math.random() * 400 + 50
        });
    }

    // Start Visualizer Loop
    const renderVisualizer = () => {
        const smallCanvas = visualizerCanvasRef.current;
        
        if (!audioAnalyserRef.current && !inputAudioAnalyserRef.current) {
             animationFrameRef.current = requestAnimationFrame(renderVisualizer);
             return;
        }
        
        // Get data from both analysers
        const bufferLength = 256;
        const outData = new Uint8Array(bufferLength);
        const inData = new Uint8Array(bufferLength);
        
        if (audioAnalyserRef.current) audioAnalyserRef.current.getByteFrequencyData(outData);
        if (inputAudioAnalyserRef.current) inputAudioAnalyserRef.current.getByteFrequencyData(inData);
        
        // Calculate average volume for input to detect user speaking
        let inSum = 0;
        for(let i=0; i<bufferLength; i++) inSum += inData[i];
        const inAvg = inSum / bufferLength;
        const userSpeaking = inAvg > 15; // Lower threshold for better sensitivity

        // Merge data (take max of both)
        const dataArray = new Uint8Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = Math.max(outData[i], inData[i]);
        }

        const baseAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#00B7FF';
        const accentColor = userSpeaking ? '#00FF99' : baseAccent; // Vibrant green when user speaks

        // 1. Draw Small Canvas (Dynamic Wave Mode)
        if (smallCanvas) {
            const ctx = smallCanvas.getContext('2d');
            if (ctx) {
                const parentWidth = smallCanvas.parentElement?.clientWidth || 300;
                if (smallCanvas.width !== parentWidth) {
                    smallCanvas.width = parentWidth;
                }
                
                ctx.clearRect(0, 0, smallCanvas.width, smallCanvas.height);
                
                // Calculate average volume for pulse
                let sum = 0;
                for(let i=0; i<bufferLength; i++) sum += dataArray[i];
                const avg = sum / bufferLength;
                const pulse = avg / 255;

                const centerY = smallCanvas.height / 2;
                const sliceWidth = smallCanvas.width / (bufferLength / 2);
                
                // Draw 3 layers of waves with different offsets and opacities
                const drawWave = (offset: number, opacity: number, scale: number) => {
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = accentColor;
                    ctx.globalAlpha = opacity;
                    
                    // Add glow
                    ctx.shadowBlur = (userSpeaking ? 20 : 10) * pulse;
                    ctx.shadowColor = accentColor;
                    
                    let x = 0;
                    for (let i = 0; i < bufferLength / 2; i++) {
                        const v = dataArray[i] / 128.0;
                        const y = centerY + (v * (smallCanvas.height / 2) * scale * Math.sin(i * 0.2 + time * 0.1 + offset));
                        
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                        x += sliceWidth;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset glow for next layer
                };

                drawWave(0, 0.8, 0.8);
                drawWave(Math.PI / 2, 0.4, 0.6);
                drawWave(Math.PI, 0.2, 0.4);
                
                ctx.globalAlpha = 1.0;
            }
        }
        
        animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };
    renderVisualizer();

    return () => {
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      window.speechSynthesis.cancel();
      clearSilenceTimer();
      stopScreenSharing(); 
      stopCamera(); 
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed isImmersiveMode dependency to prevent audio context recreation

  // Restart session when immersive mode changes to update voice
  useEffect(() => {
      if (isMicActive) {
          disconnectSession();
          setTimeout(() => handleToggleMicrophone(true), 500);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImmersiveMode]);

  // NEW: Speak Text Function for TTS in Chat
  const speakText = (text: string) => {
    if (!text) return;
    
    // Clean up markdown/code blocks for speech
    let cleanText = text.replace(/<codeblock>[\s\S]*?<\/codeblock>/g, ' Código oculto. ');
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ' Bloco de código. ');
    cleanText = cleanText.replace(/\*/g, ''); // Remove bold/italic markers
    cleanText = cleanText.replace(/<[^>]*>/g, ''); // Remove tags like <highlight>
    
    // Stop previous utterance
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Slightly slower natural speaking rate
    
    // Optional: Select a specific voice if available (browser dependent)
    // const voices = window.speechSynthesis.getVoices();
    // const ptVoice = voices.find(v => v.lang.includes('pt-BR'));
    // if (ptVoice) utterance.voice = ptVoice;
    
    window.speechSynthesis.speak(utterance);
  };
  
  const handleModelResponse = useCallback(async (responseText: string, isUserCopyRequest: boolean = false) => {
      console.log("handleModelResponse: Processing response:", responseText.substring(0, 100) + "...");
      const codeBlockRegex = /<codeblock>(.*?)<\/codeblock>/s;
      const highlightRegex = /<highlight>([\s\S]*?)<\/highlight>/i;
      const switchAgentRegex = /\[\[SWITCH_AGENT:(.*?)\]\]/i;
      const setUserNameRegex = /\[\[SET_USER_NAME:(.*?)\]\]/i;

      const userNameMatch = responseText.match(setUserNameRegex);
      if (userNameMatch && userNameMatch[1]) {
          const newName = userNameMatch[1].trim();
          setUserPreferredName(newName);
          if (user) {
          const userPath = `Usuarios/${user.uid}`;
          try {
              await setDoc(doc(db, 'Usuarios', user.uid), { userPreferredName: newName }, { merge: true });
          } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, userPath);
          }
          }
      }

      const switchMatch = responseText.match(switchAgentRegex);
      if (switchMatch && switchMatch[1]) {
          const agentName = switchMatch[1].trim();
          console.log("Switching agent via text tag:", agentName);
          onSwitchAgentCommand(agentName);
      }

      let modelTextWithoutSwitch = responseText.replace(switchAgentRegex, '').replace(setUserNameRegex, '').trim();

      const highlightMatch = modelTextWithoutSwitch.match(highlightRegex);
      if (highlightMatch && highlightMatch[1]) {
          try {
              let jsonStr = highlightMatch[1].trim();
              jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
              
              const coords = JSON.parse(jsonStr);
              if (typeof coords.x === 'number' && typeof coords.y === 'number') {
                  if (isScreenSharing || isCameraActive) {
                      const blob = await captureScreenAsBlob();
                      if (blob) {
                          const newImageUrl = await blobToDataURL(blob);
                          setVisualHelp({ image: newImageUrl, highlight: coords });
                      }
                  } else {
                      const lastUserImage = activeMessages.slice().reverse().find(m => m.role === 'user' && m.imageUrl)?.imageUrl;
                      if (lastUserImage) {
                          setVisualHelp({ image: lastUserImage, highlight: coords });
                      }
                  }
              }
          } catch (e) {
              console.error("Failed to parse highlight coordinates:", e);
          }
      }

      let modelTextWithoutHighlight = modelTextWithoutSwitch.replace(highlightRegex, '').trim();
      let explanationText = '';
      let codeText: string | undefined;
      let copyableBlockText: string | undefined; 

      const codeMatch = modelTextWithoutHighlight.match(codeBlockRegex);

      if (codeMatch && codeMatch[1]) {
          codeText = codeMatch[1].trim();
          explanationText = modelTextWithoutHighlight.replace(codeBlockRegex, '').trim();
      } else {
          explanationText = modelTextWithoutHighlight;
      }
      
      if (isUserCopyRequest && !codeText && (explanationText || '').length < 500) {
          copyableBlockText = explanationText;
      }

      const messageId = await addMessage('model', modelTextWithoutHighlight, { 
          blockType: codeText ? 'code' : copyableBlockText ? 'text' : undefined
      });
      
      if (messageId && (explanationText || '').length > TEXT_COMPRESSION_THRESHOLD) {
          generateAndStoreSummary(messageId, explanationText);
      }

      // Update conversation summary for long-term memory after each model response
      generateConversationSummary();
  }, [addMessage, generateAndStoreSummary, generateConversationSummary, activeMessages, isScreenSharing, isCameraActive, captureScreenAsBlob, onSwitchAgentCommand]);
  
  const onModelStartSpeaking = useCallback(() => {
    setIsSpeaking(true);
    startSilenceTimer();
  }, [startSilenceTimer]);

  const onModelStopSpeaking = useCallback((text: string) => {
    setIsSpeaking(false);
    clearSilenceTimer();
    if (lastProcessedResponseRef.current === text) {
        console.log("Duplicate response ignored.");
        return;
    }
    lastProcessedResponseRef.current = text;
    handleModelResponse(text);
  }, [clearSilenceTimer, handleModelResponse]);

  const onUserStopSpeaking = useCallback((text: string) => {
      const processedText = preprocessText(text);
      if (!processedText.trim()) return;
      
      lastProcessedResponseRef.current = ''; 
      addMessage('user', processedText);
      checkAndSaveProgrammingLevel(processedText);
      shouldAutoScrollRef.current = true; // User spoke, ensure auto-scroll is on

      // Update Session State with last command
      if (activeConversationId) {
          const newState: SessionState = {
              ...atlasSessionState,
              último_comando: processedText,
              último_agente: activeAgent
          };
          setAtlasSessionState(newState);
          saveSessionState(activeConversationId, newState).catch(e => console.error("Error saving session state:", e));
      }

      const lowerText = text.toLowerCase();

      // JARVIS AUTO-SAVE (NÍVEL JARVIS)
      const jarvisKeywords = ["meu nome", "lembre", "remember", "importante", "gravar", "salvar na memória"];
      if (user?.uid && jarvisKeywords.some(kw => lowerText.includes(kw))) {
          console.log("[ATLAS Jarvis] Auto-saving voice info to memory...");
          saveMemory(text);
      }
      
      // Handle JARVIS activation command directly
      if (lowerText.includes('ativar jarvis') || lowerText.includes('ative o jarvis') || lowerText.includes('entrada jarvis')) {
          console.log("[ATLAS] Jarvis activation command detected via voice.");
          handleActivateAgent('jarvis');
          return;
      }
      
      // Handle "Pare de ouvir" command to manually disable mic via voice
      if (lowerText.includes('pare de ouvir') || lowerText.includes('parar de ouvir') || lowerText.includes('desligar microfone')) {
          console.log("User requested to stop listening via voice command.");
          handleToggleMicrophone();
          return;
      }

      const visualKeywords = ['print', 'captura', 'foto', 'mostre', 'onde', 'marcar', 'cadê', 'veja'];
      
      if ((isScreenSharing || isCameraActive) && visualKeywords.some(kw => lowerText.includes(kw))) {
         // Placeholder for client-side visual triggers if needed, currently empty as per requirement
      }
  }, [addMessage, checkAndSaveProgrammingLevel, isScreenSharing, isCameraActive]);

  const handleToggleMicrophone = async (skipCheck: boolean | React.SyntheticEvent = false, forceState?: boolean, isSilentReconnect = false) => {
    if (isMicLoading && typeof skipCheck !== 'boolean') {
        console.log("[ATLAS Mic] Toggle ignored: already loading.");
        return;
    }
    
    const isActuallySkipCheck = typeof skipCheck === 'boolean' ? skipCheck : false;
    console.log(`[ATLAS Mic] handleToggleMicrophone. skipCheck: ${isActuallySkipCheck}, forceState: ${forceState}, current: ${isMicActiveRef.current}, silent: ${isSilentReconnect}`);
    
    const currentlyActive = isMicActiveRef.current;
    const targetState = forceState !== undefined ? forceState : !currentlyActive;

    if (!isSilentReconnect) {
        reconnectAttemptsRef.current = 0;
    }

    // If already in target state and not a restart request, do nothing
    if (currentlyActive === targetState && !isActuallySkipCheck) {
        return;
    }

    // If mic is active and we want to turn it off
    if (currentlyActive && !targetState && !isActuallySkipCheck) {
      // 1. Set State
      setIsMicActive(false);
      isMicActiveRef.current = false;
      
      // 2. Stop Audio Input only
      if (liveSessionControllerRef.current) {
          liveSessionControllerRef.current?.stopMicInput();
          stopMicrophone(micStreamRef.current);
          micStreamRef.current = null;
      }
      
      // 3. Play Feedback
      playBeep(outputAudioContextRef.current, 300, 150);
      enviarStatusParaExtensao(false);

    // 4. IMPORTANT: Keep the session open to maintain context, even if mic is off.
    // We only stop the microphone input stream, but we don't close the WebSocket.
    // This allows the conversation to continue from where it was when the mic is toggled back on.
    console.log("Mic muted. Session remains open to maintain context.");

    } else if (currentlyActive && isActuallySkipCheck && liveSessionControllerRef.current) {
      // Restart: Just stop and start mic input
      if (liveSessionControllerRef.current) {
          liveSessionControllerRef.current?.stopMicInput();
          await liveSessionControllerRef.current?.startMic();
      }
    } else if (targetState) {
      // If we want it ON (or it's a forced restart and session is missing)
      setIsMicLoading(true);
      setIsMicActive(true);
      isMicActiveRef.current = true;
      setMicPermissionDenied(false); // Reset permission status when user tries to activate
      
      // Resume AudioContexts immediately on user gesture to comply with browser policies
      if (inputAudioContextRef.current) await inputAudioContextRef.current.resume();
      if (outputAudioContextRef.current) await outputAudioContextRef.current.resume();

      // Check permission before attempting to start
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
          console.warn("[ATLAS] Permissão de microfone não concedida previamente.");
      }

      try {
        // HARD RESET AUDIO CLOCK: Fixes the bug where audio stops playing after a glitch
        nextStartTimeRef.current = 0;

        // Ensure AudioContexts are healthy. If they were closed/suspended/glitched, recover them.
        const ensureContext = (ref: React.MutableRefObject<AudioContext | null>, sampleRate: number) => {
            if (!ref.current || ref.current.state === 'closed') {
                ref.current = new AudioContext({ sampleRate });
                return true;
            }
            return false;
        };

        const inputRecreated = ensureContext(inputAudioContextRef, 16000);
        const outputRecreated = ensureContext(outputAudioContextRef, 24000);

        if (outputRecreated && outputAudioContextRef.current) {
            // Reconnect analyser if output was recreated
            const analyser = outputAudioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.6;
            analyser.connect(outputAudioContextRef.current.destination);
            audioAnalyserRef.current = analyser;
        }
        if (inputRecreated && inputAudioContextRef.current) {
            // Reconnect input analyser
            const analyser = inputAudioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.6;
            inputAudioAnalyserRef.current = analyser;
        }

        await outputAudioContextRef.current?.resume();
        await inputAudioContextRef.current?.resume();

        // Second check: if still not running, force recreation
        if (outputAudioContextRef.current?.state !== 'running' || inputAudioContextRef.current?.state !== 'running') {
            console.warn("AudioContexts failed to resume. Forcing recreation...");
            inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
            
            const outAnalyser = outputAudioContextRef.current.createAnalyser();
            outAnalyser.fftSize = 512;
            outAnalyser.smoothingTimeConstant = 0.6;
            outAnalyser.connect(outputAudioContextRef.current.destination);
            audioAnalyserRef.current = outAnalyser;

            const inAnalyser = inputAudioContextRef.current.createAnalyser();
            inAnalyser.fftSize = 512;
            inAnalyser.smoothingTimeConstant = 0.6;
            inputAudioAnalyserRef.current = inAnalyser;
            
            await outputAudioContextRef.current.resume();
            await inputAudioContextRef.current.resume();
        }

        window.speechSynthesis.cancel(); 

        // CHECK: If session already exists (because video was running), just resume mic
        if (liveSessionControllerRef.current) {
             console.log("Session exists, resuming microphone input...");
             // Clear any old audio buffers to prevent stutter
             liveSessionControllerRef.current?.stopPlayback();
             
             const stream = await startMicrophone();
             micStreamRef.current = stream;
             await liveSessionControllerRef.current?.startMic(stream);
             setIsMicActive(true);
             setIsMicLoading(false);
             playBeep(outputAudioContextRef.current, 600, 150); 
             enviarStatusParaExtensao(true);
             return;
        }

        // If no session exists, create a new one
        console.log("[ATLAS] Creating new live session");
        
        // Check permission BEFORE connecting to Live API
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
            // Try to request it now to trigger the browser prompt
            try {
                const stream = await startMicrophone();
              if (inputAudioAnalyserRef.current) {
                const dataArray = new Uint8Array(inputAudioAnalyserRef.current.frequencyBinCount);
                inputAudioAnalyserRef.current.getByteFrequencyData(dataArray);
                console.log("[DEBUG] Microphone stream activity:", dataArray.reduce((a, b) => a + b, 0) > 0 ? "Active" : "Silent");
              } else {
                console.log("[DEBUG] Microphone stream analyser is null.");
              }
                micStreamRef.current = stream;
            } catch (e) {
                throw new Error("NotAllowedError"); // Trigger permission error
            }
        }

        let agentInstruction = "";
        const customAgent = customAgents.find(a => a.id === activeAgent);
        if (customAgent) {
            agentInstruction = `\n\n${customAgent.systemInstruction}`;
        }
        
        const toneInstruction = {
            formal: "Seja extremamente educado, formal, prestativo e use um tom sofisticado e profissional.",
            informal: "Seja amigável, casual, prestativo e use um tom descontraído e próximo.",
            technical: "Seja preciso, técnico, direto ao ponto e use um tom focado em lógica e eficiência técnica.",
            humorous: "Seja divertido, bem-humorado, prestativo e use um tom leve e carismático."
        }[activeTone];

        const finalVoiceName = (voiceName || 'Kore');
        
        let finalVoiceNameToUse = finalVoiceName;
        if (isImmersiveMode) {
            finalVoiceNameToUse = 'Charon'; // SOPHISTICATED AI voice
            const nameToUse = assistantCustomName || (activeAgent === 'jarvis' ? 'J.A.R.V.I.S.' : 'ATLAS');
            agentInstruction += `\n\nVocê está no modo imersivo. Aja e fale como ${nameToUse}, seu sistema operacional de inteligência artificial. ${toneInstruction} Responda de forma concisa e direta, focando na eficiência e no suporte técnico.`;
        } else {
             agentInstruction += `\n\n${toneInstruction}`;
        }

        // FETCH MEMORY CONTEXT FOR LIVE SESSION
        let memoryContext = "";
        if (user?.uid) {
            try {
                const memories = await buscarMemorias(user.uid);
                if (memories && memories.length > 0) {
                    memoryContext = memories
                        .slice(0, 5)
                        .map((m: any) => m.memory || m.content)
                        .join("\n");
                } else {
                    memoryContext = await searchMemory("contexto geral", 5);
                }
            } catch (e) {
                console.error("Erro ao carregar memórias para sessão de voz:", e);
                memoryContext = await searchMemory("contexto geral", 5);
            }
        }

        console.log(`[ATLAS Context] Initializing live session. History size: ${activeMessages.length} messages. Active Agent: ${activeAgent}`);
        
        const controller = await createLiveSession(
            {
                onOpen: () => {
                    setIsMicLoading(false);
                    reconnectAttemptsRef.current = 0; // Reset reconnection counter on success
                    // Only play beep if it's not a silent reconnect
                    if (!isSilentReconnect) {
                        playBeep(outputAudioContextRef.current, 600, 150); 
                    } else {
                        console.log("[ATLAS] Reconnected successfully");
                    }
                    enviarStatusParaExtensao(true);
                },
                onClose: () => {
                    console.log("[ATLAS] Session closed by server");
                    liveSessionControllerRef.current = null;

                    if (isMicActiveRef.current) {
                        handleLiveSessionRecovery();
                    } else {
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                    }
                },
                onGoAway: () => {
                    console.log("[ATLAS] Session GoAway received. Recovering...");
                    handleLiveSessionRecovery();
                },
                onMicrophoneStopped: () => {
                    console.warn("[ATLAS] Microphone stopped unexpectedly, attempting silent restart...");
                    if (isMicActiveRef.current) handleLiveSessionRecovery();
                },
                onError: (e) => {
                    let errorMsg = "Erro desconhecido na sessão de voz.";
                    
                    if (e instanceof Error) {
                        errorMsg = e.message;
                    } else if (e && typeof e === 'object') {
                        const event = e as any;
                        errorMsg = event.message || event.reason || event.error?.message || String(e);
                        if (errorMsg === '[object ErrorEvent]' || errorMsg === '[object Event]') {
                            errorMsg = "Erro de conexão WebSocket.";
                            if (event.code) errorMsg += ` (Code: ${event.code})`;
                        }
                    } else {
                        errorMsg = String(e);
                    }

                    console.error("[ATLAS Mic] Session Error Detail:", errorMsg);

                    if (errorMsg.includes("Permission denied") || errorMsg.includes("NotAllowedError")) {
                        setErrorMessage("Permissão de microfone negada. Por favor, verifique se o microfone está habilitado nas configurações do seu navegador e se você permitiu o acesso para este site.");
                        setMicPermissionDenied(true);
                        setIsMicActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                        liveSessionControllerRef.current = null;
                        return;
                    }

                    const isAbortedError = errorMsg.includes("The operation was aborted") || 
                                         errorMsg.includes("AbortError") || 
                                         errorMsg.includes("Connection aborted") ||
                                         errorMsg.includes("GoAway");
                    
                    if (isAbortedError) {
                        console.log("[ATLAS] Live Session aborted (expected on close/reconnect)");
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                        liveSessionControllerRef.current = null;
                        return;
                    }

                    console.error("[ATLAS] Live Session Error Object:", e);
                    console.error("[ATLAS] Live Session Error:", errorMsg);
                    
                    const isQuotaError = errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("cota") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");

                    liveSessionControllerRef.current = null;
                    
                    // If it's not a quota error and we were supposed to be active, try to restart silently
                    if (isMicActiveRef.current && !isQuotaError) {
                        handleLiveSessionRecovery();
                    } else {
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                        
                        if (isQuotaError) {
                            setErrorMessage("Cota da API Gemini excedida. Aguarde um momento.");
                        } else {
                            // Only show error message if it's not a transient connection issue we're trying to fix
                            setErrorMessage(`Erro na sessão de voz: ${errorMsg}`);
                        }
                    }
                },
                onInputTranscriptionUpdate: (text) => {
                    const separator = currentInputTranscriptionRef.current ? " " : "";
                    currentInputTranscriptionRef.current += (separator + text);
                    setCurrentInputTranscription(currentInputTranscriptionRef.current);
                },
                onOutputTranscriptionUpdate: (text) => {
                    currentOutputTranscriptionRef.current += text;
                    setCurrentOutputTranscription(currentOutputTranscriptionRef.current);
                },
                onModelStartSpeaking: onModelStartSpeaking,
                onModelStopSpeaking: onModelStopSpeaking,
                onUserStopSpeaking: onUserStopSpeaking,
                onTurnComplete: () => {
                    // When a turn is complete, we can finalize the transcriptions
                    const finalOutput = currentOutputTranscriptionRef.current.trim();
                    const finalInput = currentInputTranscriptionRef.current.trim();

                    if (finalOutput) {
                        onModelStopSpeaking(finalOutput);
                        currentOutputTranscriptionRef.current = '';
                        setCurrentOutputTranscription('');
                    }
                    if (finalInput) {
                        onUserStopSpeaking(finalInput);
                        currentInputTranscriptionRef.current = '';
                        setCurrentInputTranscription('');
                    }
                },
                onInterrupt: () => { setIsSpeaking(false); clearSilenceTimer(); },
                
                // Call disconnectSession for explicit command, but ensure it handles partial shutdown if needed
                // Removed onDeactivateMicrophoneCommand as it is no longer supported by the service
                onDeactivateScreenSharingCommand: () => stopScreenSharing(),
                onActivateScreenSharingCommand: () => startScreenSharing(),
                onActivateCameraCommand: () => startCamera(),
                onDeactivateCameraCommand: () => stopCamera(),
                onSwitchAgentCommand: onSwitchAgentCommand,
                onFocoFlowCommand: async (command, args) => {
                    const res = await handleFocoFlowCommand(command, args);
                    if (res.success) {
                        if (res.report) {
                            const reportData = { category: 'financial_report', ...res.report };
                            addMessage('system', `Aqui está o seu relatório financeiro:\n[[FOCOFLOW_ITEM:${JSON.stringify(reportData)}]]`);
                        } else if (res.data && Array.isArray(res.data)) {
                             const items = res.data.map((item: any) => `[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`).join('\n');
                             addMessage('system', `Aqui estão os dados solicitados:\n${items}`);
                        } else if (command === 'playMusicOnYouTube' && res.videoId) {
                             addMessage('system', res.message, { 
                                 youtubeVideoId: res.videoId,
                                 youtubeTitle: res.data?.title,
                                 youtubeChannel: res.data?.channelName
                             });
                        } else if (command === 'generateMusic' && res.audioUrl) {
                             addMessage('system', res.message, { 
                                 audioUrl: res.audioUrl
                             });
                        } else if (res.url) {
                             const item = { category: 'link', title: res.message, url: res.url };
                             addMessage('system', `${res.message}\n[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`);
                        } else if (res.message) {
                             addMessage('system', res.message);
                        }
                    }
                    return res;
                },
                onSearchPastConversationsCommand: handleSearchPastConversationsCommand,
                onSearchMemoryCommand: handleSearchMemoryCommand,
                onSaveImportantMemoryCommand: handleSaveImportantMemoryCommand,
                onStopAlarmCommand: handleStopAlarmCommand,
                onOpenWebsiteCommand: (url: string) => window.open(url, '_blank'),
                onUpdateUserPreferencesCommand: handleUpdateUserPreferencesCommand,
                onNewConversationCommand: (summary?: string, title?: string) => handleNewChat(summary, title),
                onSessionReady: (session) => { /* Ready */ },
                onVoiceStateChange: (state) => setVoiceState(state)
            },
            inputAudioContextRef.current!,
            outputAudioContextRef.current!,
            nextStartTimeRef,
            micStreamRef,
            audioAnalyserRef.current, // Pass the output analyser
            inputAudioAnalyserRef.current, // Pass the input analyser
            activeMessages, 
            activeAgent,
            isScreenSharing || isCameraActive,
            initialUserData.programmingLevel,
            agentInstruction,
            finalVoiceNameToUse,
            isSummarizedMode,
            activeAgent === 'jarvis',
            assistantCustomName,
            userPreferredName,
            activeConversation?.summary,
            memoryContext
        );

        liveSessionControllerRef.current = controller;
        setIsMicActive(true);
        setIsSessionActive(true);
        
        // Request permission and start mic via controller
        const stream = await startMicrophone();
        micStreamRef.current = stream;
        await controller.startMic(stream);
        setIsMicLoading(false);
        console.log("[ATLAS] Microphone reconnected");

      } catch (error: any) {
          console.error("Failed to start microphone or live session:", error);
          
          // Handle specific permission errors
          const isNotAllowed = error.message === 'NotAllowedError' || 
                               error.name === 'NotAllowedError' || 
                               error.message?.includes('Permission denied') || 
                               error.message?.includes('not-allowed');
          
          if (isNotAllowed) {
              setMicPermissionDenied(true);
              setErrorMessage("Permissão de microfone negada. Por favor, clique no ícone de cadeado na barra de endereços do seu navegador e ative a permissão de microfone.");
          } else if (error.message?.includes("service is currently unavailable")) {
              setErrorMessage("O serviço Gemini Live está temporariamente indisponível. Tente novamente em alguns instantes.");
          } else {
              setErrorMessage(`Erro ao iniciar sessão: ${error.message || 'Erro desconhecido'}`);
          }
          
          setIsMicLoading(false);
          setIsMicActive(false);
          isMicActiveRef.current = false;
          liveSessionControllerRef.current = null;
      }
    }
  };

  useEffect(() => { handleToggleMicrophoneRef.current = handleToggleMicrophone; }, [handleToggleMicrophone]);

  const handleLiveSessionRecoveryRedundant = useCallback(async () => {
    const now = Date.now();
    
    // Prevent rapid reconnection loops (min 2 seconds between attempts)
    if (now - lastReconnectTimeRef.current < 2000 && reconnectAttemptsRef.current > 0) {
        console.warn("[ATLAS Recovery] Reconnection attempt too soon, skipping.");
        return;
    }

    // Limit total consecutive reconnect attempts to prevent infinite loops
    if (reconnectAttemptsRef.current >= 5) {
        console.error("[ATLAS Recovery] Max reconnection attempts reached. Stopping.");
        setIsMicActive(false);
        isMicActiveRef.current = false;
        setIsSessionActive(false);
        setIsMicLoading(false);
        setErrorMessage("Falha crítica na conexão. Por favor, reinicie o microfone manualmente.");
        return;
    }

    // Update session start time for the new session
    sessionStartTimeRef.current = Date.now();
    lastReconnectTimeRef.current = now;
    reconnectAttemptsRef.current += 1;

    console.log(`[ATLAS] Session expired - reconnecting (Attempt ${reconnectAttemptsRef.current})`);
    
    // 1. Clean up old session controller if it exists
    if (liveSessionControllerRef.current) {
      try {
        liveSessionControllerRef.current.closeSession();
        liveSessionControllerRef.current = null;
      } catch (e) {
        console.warn("[ATLAS Recovery] Error during cleanup:", e);
      }
    }

    // 2. Implement simple backoff (1-2 seconds)
    const backoffDelay = Math.min(1000 * reconnectAttemptsRef.current, 2000);

    // 3. Trigger a silent reconnect
    setTimeout(() => {
      if (isMicActiveRef.current) {
        handleToggleMicrophone(true, true, true);
      }
    }, backoffDelay);
  }, [handleToggleMicrophone]);

  // Auto-start microphone removed to prevent "Permission denied" errors on reload without user interaction

  const handleSend = useCallback(async (overrideText?: string | React.MouseEvent) => {
      // Barge-in: Stop assistant from speaking
      window.speechSynthesis.cancel();
      
      const fileInput = attachmentFileInputRef.current;
      const hasFile = fileInput && fileInput.files && fileInput.files[0];
      
      const actualText = typeof overrideText === 'string' ? overrideText : undefined;
      let messageText = actualText !== undefined ? actualText : textInput;
      
      if (!messageText.trim() && !hasFile && !isSendingText) return;
      if (isSendingText) return;

      // PRE-PROCESSING: Normalize text before any operation
      messageText = preprocessText(messageText);

      setIsSendingText(true);
      if (actualText === undefined) {
          setTextInput('');
      }

      // Local Command Interception for External Panel (Fast-Path)
      const lowerText = messageText.toLowerCase().trim();
      const openPanelTriggers = ['abrir painel', 'abrir o painel', 'painel externo', 'firebase studio', 'abrir terminal', 'acessar painel'];
      if (openPanelTriggers.some(trigger => lowerText.includes(trigger))) {
          await addMessage('user', messageText);
          const item = { 
              category: 'link', 
              title: 'Painel Externo | Firebase Studio', 
              url: 'https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev' 
          };
          addMessage('system', `Senhor, o terminal do Firebase Studio está pronto para acesso. Clique no botão abaixo para iniciar a conexão.\n[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`);
          setIsSendingText(false);
          return;
      }

      shouldAutoScrollRef.current = true; // Force scroll to bottom on send
      
      window.speechSynthesis.cancel(); // Stop current speech if typing

      // Ensure we have a conversation
      let currentConvoId = activeConversationId;
      if (!currentConvoId) {
          const conversationsPath = 'conversas';
          try {
              const newConvoRef = await addDoc(collection(db, conversationsPath), {
                  uid: user.uid,
                  title: messageText.substring(0, 30) || "Nova Conversa",
                  createdAt: serverTimestamp(),
                  isArchived: false,
              });
              currentConvoId = newConvoRef.id;
              setActiveConversationId(currentConvoId);
          } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, conversationsPath);
              setIsSendingText(false);
              return;
          }
      }

      if (messageText.trim()) {
          await addMessage('user', messageText);
          checkAndSaveProgrammingLevel(messageText);
      }

      let fileData = undefined;
      if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          try {
              const base64 = await blobToBase64(file);
              fileData = { base64, mimeType: file.type };
              await addMessage('user', 'Enviou uma imagem.', { imageUrl: `data:${file.type};base64,${base64}` });
          } catch (e) {
              console.error("File read error:", e);
          }
          fileInput.value = ''; 
      }

      if (!fileData && (isScreenSharing || isCameraActive)) {
          const blob = await captureScreenAsBlob();
          if (blob) {
               const base64 = await blobToBase64(blob);
               fileData = { base64, mimeType: 'image/jpeg' };
          }
      }
      
      try {
          let agentInstruction = "";
          const customAgent = customAgents.find(a => a.id === activeAgent);
          if (customAgent) agentInstruction = customAgent.systemInstruction;
          
          console.log("handleSend: Sending message:", messageText, "with history:", activeMessages.length, "messages");
          
          // FETCH MEMORY CONTEXT
          let memoryContext = "";
          if (user?.uid) {
              try {
                  const memories = await buscarMemorias(user.uid);
                  if (memories && memories.length > 0) {
                      memoryContext = memories
                          .slice(0, 5)
                          .map((m: any) => m.memory || m.content)
                          .join("\n");
                  } else {
                      memoryContext = await searchMemory(messageText || "contexto geral", 3);
                  }
              } catch (e) {
                  console.error("Erro ao buscar memórias:", e);
                  memoryContext = await searchMemory(messageText || "contexto geral", 3);
              }
          }

          // JARVIS AUTO-SAVE (NÍVEL JARVIS)
          const lowerMsg = (messageText || "").toLowerCase();
          const jarvisKeywords = ["meu nome", "lembre", "remember", "importante", "gravar", "salvar na memória", "fruta"];
          if (user?.uid && jarvisKeywords.some(kw => lowerMsg.includes(kw))) {
              console.log("[ATLAS Jarvis] Auto-saving text info to memory...");
              saveMemory(messageText || "");
          }

          const result = await sendTextMessage(
              messageText || "Analise o que vê.", 
              activeMessages, 
              activeAgent, 
              fileData, 
              isScreenSharing || isCameraActive,
              activeConversationId || `default_${user.uid}`,
              user.uid,
              initialUserData.programmingLevel,
              agentInstruction,
              isSummarizedMode,
               assistantCustomName,
              userPreferredName,
              activeConversation?.summary,
              memoryContext,
              activeAgent === 'jarvis'
          );
          console.log("handleSend: Received result:", result);
          
          if (result && result.functionCalls) {
              for (const fc of result.functionCalls) {
                  if (fc.name === 'atlasCreateNewConversation') {
                      const args = fc.args as any;
                      await handleNewChat(args.summary, args.newTitle);
                      continue;
                  }
                  if (fc.name === 'switchActiveAgent') {
                      onSwitchAgentCommand((fc.args as any).agentName);
                  } else if (fc.name === 'searchPastConversations') {
                      const res = await handleSearchPastConversationsCommand((fc.args as any).query, (fc.args as any).limit);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'searchMemory') {
                      const res = await handleSearchMemoryCommand((fc.args as any).query, (fc.args as any).limit);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'saveImportantMemory') {
                      const res = await handleSaveImportantMemoryCommand((fc.args as any).info);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'openWebsite') {
                      const args = fc.args as any;
                      const item = { category: 'link', title: args.siteName || 'Link Externo', url: args.url };
                      addMessage('system', `Ponto de acesso seguro gerado.\n[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`);
                  } else if (fc.name.includes('FocoFlow') || fc.name === 'playMusicOnYouTube' || fc.name === 'searchOnYouTube' || fc.name === 'searchOnGoogle' || fc.name === 'generateMusic' || fc.name === 'openYouTube' || fc.name === 'openExternalPanel' || fc.name === 'openFocoFlowDashboard' || fc.name.startsWith('atlas')) {
                      const res = await handleFocoFlowCommand(fc.name, fc.args);
                      if (res.success) {
                          if (res.report) {
                              const reportData = { category: 'financial_report', ...res.report };
                              addMessage('system', `Aqui está o seu relatório financeiro:\n[[FOCOFLOW_ITEM:${JSON.stringify(reportData)}]]`);
                          } else if (res.data && Array.isArray(res.data)) {
                              const items = res.data.map((item: any) => `[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`).join('\n');
                              addMessage('system', `Aqui estão os dados solicitados:\n${items}`);
                          } else if (fc.name === 'playMusicOnYouTube' && res.videoId) {
                              addMessage('system', res.message, { 
                                  youtubeVideoId: res.videoId,
                                  youtubeTitle: res.data?.title,
                                  youtubeChannel: res.data?.channelName
                              });
                          } else if (fc.name === 'generateMusic' && res.audioUrl) {
                              addMessage('system', res.message, { 
                                  audioUrl: res.audioUrl
                              });
                          } else if (res.url) {
                              const videoIdFromUrl = extractYouTubeVideoId(res.url);
                              if (videoIdFromUrl) {
                                  addMessage('system', res.message, { 
                                      youtubeVideoId: videoIdFromUrl,
                                      youtubeTitle: res.data?.title,
                                      youtubeChannel: res.data?.channelName
                                  });
                              } else {
                                  const item = { category: 'link', title: res.message, url: res.url };
                                  addMessage('system', `${res.message}\n[[FOCOFLOW_ITEM:${JSON.stringify(item)}]]`);
                              }
                          } else {
                              addMessage('system', res.message || "Ação do FocoFlow concluída.");
                          }
                      } else {
                          setErrorMessage(res.error || "Erro ao executar comando no FocoFlow.");
                      }
                  } else if (fc.name === 'highlightCoordinates') {
                      const args = fc.args as any;
                      if (typeof args.x === 'number' && typeof args.y === 'number') {
                          if (isScreenSharing || isCameraActive) {
                              const blob = await captureScreenAsBlob();
                              if (blob) {
                                  const newImageUrl = await blobToDataURL(blob);
                                  setVisualHelp({ image: newImageUrl, highlight: { x: args.x, y: args.y } });
                              }
                          } else {
                              const lastUserImage = activeMessages.slice().reverse().find(m => m.role === 'user' && m.imageUrl)?.imageUrl;
                              if (lastUserImage) {
                                  setVisualHelp({ image: lastUserImage, highlight: { x: args.x, y: args.y } });
                              }
                          }
                      }
                  }
              }
          }

          if (result && result.groundingMetadata) {
              const chunks = result.groundingMetadata.groundingChunks;
              if (chunks && chunks.length > 0) {
                  const urls = chunks
                      .filter((c: any) => c.web && c.web.uri)
                      .map((c: any) => `• [${c.web.title || 'Fonte'}](${c.web.uri})`);
                  
                  if (urls.length > 0) {
                      addMessage('system', `Fontes da busca:\n${urls.join('\n')}`);
                  }
              }
          }

          if (result && (result.text || result.functionCalls)) {
              await handleModelResponse(result.text || "Comando processado.", messageText.toLowerCase().includes("copie") || messageText.toLowerCase().includes("copy"));

              if (isTextToSpeechEnabled && result.text) {
                  speakText(result.text);
              }

              const inputLen = (messageText || "").length + (fileData ? 1000 : 0);
              const outputLen = (result.text || '').length;
              updateUsage(
                  Math.ceil(inputLen / 4) + Math.ceil(outputLen / 4), 
                  (inputLen / 4 * COST_PER_INPUT_TOKEN) + (outputLen / 4 * COST_PER_OUTPUT_TOKEN)
              );
          }
      } catch (e: any) {
          console.error("Text Gen Error:", e);
          let errText = e.message || String(e);
          
          // Enhanced error parsing for 429/Quota issues
          try {
             if (typeof errText === 'string' && errText.includes('{"error":')) {
                 const parsed = JSON.parse(errText);
                 if(parsed.error?.status === 'RESOURCE_EXHAUSTED' || parsed.error?.code === 429) {
                     errText = "Limite de uso atingido (Cota esgotada). Por favor, aguarde alguns segundos e tente novamente.";
                 } else if (parsed.error?.message) {
                     errText = parsed.error.message;
                 }
             }
          } catch(parseErr) { /* ignore parsing errors */ }

          if(errText.includes("RESOURCE_EXHAUSTED") || errText.includes("429") || errText.toLowerCase().includes("quota") || errText.toLowerCase().includes("cota")) {
               errText = "Limite de requisições excedido temporariamente (Cota esgotada). Aguarde alguns segundos.";
          }

          setErrorMessage(`Erro ao enviar mensagem: ${errText}`);
      } finally {
          setIsSendingText(false);
      }
  }, [
      attachmentFileInputRef, 
      textInput, 
      isSendingText, 
      activeConversationId, 
      user, 
      db, 
      activeMessages, 
      activeAgent, 
      customAgents, 
      initialUserData, 
      isSummarizedMode, 
      assistantCustomName, 
      userPreferredName, 
      activeConversation,
      addMessage,
      checkAndSaveProgrammingLevel,
      onSwitchAgentCommand,
      handleSearchPastConversationsCommand,
      handleFocoFlowCommand,
      isScreenSharing,
      isCameraActive,
      isTextToSpeechEnabled,
      speakText,
      updateUsage
  ]);

  const { isListening, startListening, stopListening } = useSpeechRecognition(useCallback((text: string) => {
      if (isMicActiveRef.current && liveSessionControllerRef.current) {
          // Quando o microfone está ativo no modo Live API, a API já processa o áudio nativamente.
          // Apenas adicionamos a transcrição manual para salvar o histórico da fala do usuário.
          addMessage('user', text);
      } else {
          handleSend(text);
      }
  }, [addMessage, handleSend]), useCallback((interim: string) => {
      setCurrentInputTranscription(interim);
  }, []), useCallback((error: string) => {
      if (error === 'not-allowed' || error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setErrorMessage("Permissão de microfone negada. Por favor, clique no ícone de cadeado na barra de endereços do seu navegador e ative a permissão de microfone para usar os comandos de voz.");
          setIsMicActive(false);
          isMicActiveRef.current = false;
      } else if (error === 'not-supported') {
          setErrorMessage("Reconhecimento de voz não é suportado neste navegador. Tente usar o Chrome ou Edge.");
          setIsMicActive(false);
          isMicActiveRef.current = false;
      }
  }, []), useCallback(() => {
      handleReconnection();
  }, [handleReconnection]));

  useEffect(() => {
    // Inicia a transcrição contínua para salvar o histórico enquanto o microfone estiver ativo.
    if (isMicActive) {
      startListening();
    } else {
      stopListening();
    }
  }, [isMicActive, startListening, stopListening]);

  const activeAgentName = useMemo(() => {
    const custom = customAgents.find(a => a.id === activeAgent);
    if (custom) return custom.name;
    const system = SYSTEM_AGENTS.find(a => a.id === activeAgent);
    if (system) return system.name;
    return "Assistente Padrão";
  }, [activeAgent, customAgents]);

  const handleToggleTextToSpeech = async () => {
      const newState = !isTextToSpeechEnabled;
      setIsTextToSpeechEnabled(newState);
      // Cancel current speech if turning off
      if (!newState) {
          window.speechSynthesis.cancel();
      }
      try {
          const userPath = `Usuarios/${user.uid}`;
          await setDoc(doc(db, 'Usuarios', user.uid), { textToSpeechEnabled: newState }, { merge: true });
      } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `Usuarios/${user.uid}`);
      }
  };


   // Fim do componente App (inserido logo antes do fechamento do componente/return)
  // ATLAS Companion Mode: Heartbeat & Session Renewal
  useEffect(() => {
    if (!ATLAS_VOICE_CONFIG.companionMode || !handleLiveSessionRecovery) return;

    const interval = setInterval(() => {
        const elapsed = Date.now() - sessionStartTimeRef.current;
        
        // 1. Session Renewal (before 9 min limit)
        if (elapsed > ATLAS_VOICE_CONFIG.sessionDurationLimit) {
            console.log("[ATLAS] Renewing session before expiration...");
            sessionStartTimeRef.current = Date.now();
            handleLiveSessionRecovery();
        }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [handleLiveSessionRecovery]);

  return (
    <div className={`flex h-[100dvh] w-full ${activeCustomThemeId ? 'bg-transparent' : 'bg-[var(--bg-primary)]'} text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300`}>
      
      <AnimatePresence>
        {showBootOverlay && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center font-mono"
          >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                  <h1 className="text-4xl md:text-6xl text-white font-light tracking-[0.5em] mb-8 flex items-center" style={{ textShadow: `0 0 20px ${isJarvisPreBoot ? 'rgba(249, 115, 22, 0.4)' : 'rgba(0, 242, 255, 0.4)'}` }}>
                    {assistantCustomName.split('').map((char, index) => (
                      <React.Fragment key={index}>
                        {char}
                        {index < assistantCustomName.length - 1 && char !== '.' && char !== ' ' && <span className="opacity-75 mx-1 md:mx-2 text-white/50"></span>}
                      </React.Fragment>
                    ))}
                  </h1>
                  
                  <div className={`w-64 h-[1px] bg-gradient-to-r from-transparent ${isJarvisPreBoot ? 'via-orange-500' : 'via-cyan-500'} to-transparent mb-8 opacity-50`}></div>
                  
                  <p className={`${isJarvisPreBoot ? 'text-orange-400' : 'text-cyan-400'} mb-12 text-xs md:text-sm tracking-[0.3em] uppercase opacity-80 animate-pulse`}>
                    Aguardando Inicialização Manual
                  </p>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${isJarvisPreBoot ? 'rgba(249, 115, 22, 0.4)' : 'rgba(0, 242, 255, 0.4)'}` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                          try {
                              outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                          } catch (e) {
                              console.warn("Could not auto-initialize AudioContext:", e);
                          }
                      }
                      if (outputAudioContextRef.current?.state === 'suspended') {
                          outputAudioContextRef.current.resume();
                      }
                      setShowBootOverlay(false);
                      setTimeout(() => {
                          if (outputAudioContextRef.current?.state === 'running') {
                              playStartupSound(outputAudioContextRef.current);
                          }
                      }, 150);
                    }}
                    className={`px-8 py-4 bg-transparent border ${isJarvisPreBoot ? 'border-orange-500 text-orange-400' : 'border-cyan-500 text-cyan-400'} font-bold tracking-[0.2em] text-sm uppercase relative overflow-hidden group rounded hover:bg-opacity-30 transition-all duration-300`}
                  >
                    <span className={`relative z-10 flex border-b border-transparent ${isJarvisPreBoot ? 'group-hover:border-orange-400 text-orange-400' : 'group-hover:border-cyan-400 text-cyan-400'} pb-1`}>INICIAR {isJarvisPreBoot ? 'JARVIS' : 'ATLAS'}</span>
                    <div className={`absolute inset-0 ${isJarvisPreBoot ? 'bg-orange-500/10' : 'bg-cyan-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  </motion.button>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mesh-bg" />
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline muted />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {activeSidebarId === 'focoflow-nx' ? (
          <FocoFlowNXDashboard />
        ) : (
          <ImmersiveHUD 
              assistantName={assistantCustomName || "ATLAS"}
              isMicActive={isMicActive}
              isCameraActive={isCameraActive}
              isScreenSharing={isScreenSharing}
              isThinking={voiceState === 'PROCESSANDO'}
              isSpeaking={voiceState === 'FALANDO'}
              onMicToggle={handleToggleMicrophone}
              isMicPermissionDenied={micPermissionDenied}
              onCameraToggle={isCameraActive ? stopCamera : startCamera}
              onScreenToggle={isScreenSharing ? stopScreenSharing : startScreenSharing}
              onSettingsClick={() => setIsSettingsModalOpen(true)}
              onCardShowToggle={() => {
                if (isSidebarOpen && activeSidebarId === 'specialists') {
                  setIsSidebarOpen(false);
                } else {
                  setActiveSidebarId('specialists');
                  setIsSidebarOpen(true);
                }
              }}
              onMenuClick={() => {
                if (isSidebarOpen && activeSidebarId !== 'specialists') {
                  setIsSidebarOpen(false);
                } else {
                  setActiveSidebarId('conversations');
                  setIsSidebarOpen(true);
                }
              }}
              onExit={handleLogout}
              sessionTime={sessionTime}
              lastAssistantMessage={activeMessages.filter(m => m.role === 'model').slice(-1)[0]?.text}
              audioAnalyserRef={audioAnalyserRef}
              inputAudioAnalyserRef={inputAudioAnalyserRef}
              activeAgentName={activeAgentName}
              activeAgentId={activeAgent}
          />
        )}
      </main>

      <AnimatePresence>
          {isSidebarOpen && activeSidebarId !== 'specialists' && (
              <motion.div
                  initial={{ x: -260 }}
                  animate={{ x: 0 }}
                  exit={{ x: -260 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 left-0 z-[200]"
              >
                  <Sidebar 
                      assistantName={assistantCustomName}
                      conversations={allConversations}
                      activeConversationId={activeConversationId}
                      activeId={activeSidebarId}
                      onSelectConversation={(id) => {
                          setActiveConversationId(id);
                          setActiveSidebarId('conversations');
                          setIsSidebarOpen(false);
                      }}
                      onNewConversation={() => {
                          handleNewChat();
                          setActiveSidebarId('conversations');
                          setIsSidebarOpen(false);
                      }}
                      onNavItemClick={(id) => {
                          setActiveSidebarId(id);

                          if (id === 'settings') {
                            setIsSettingsModalOpen(true);
                          }
                          
                          if (id !== 'specialists') {
                            setIsSidebarOpen(false);
                          }
                      }}
                  />
                  {/* Backdrop to close sidebar */}
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1]" 
                    onClick={() => setIsSidebarOpen(false)}
                  />
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {isSidebarOpen && activeSidebarId === 'specialists' && (
              <motion.div
                  initial={{ x: 400 }}
                  animate={{ x: 0 }}
                  exit={{ x: 400 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 z-[200]"
              >
                  <RightSidebar 
                      onClose={() => setIsSidebarOpen(false)}
                      customAgents={customAgents}
                      activeAgentId={activeAgent}
                      onActivateAgent={(id) => {
                          handleActivateAgent(id);
                          setIsSidebarOpen(false);
                      }}
                      onCreateAgent={() => {
                          setAgentsModalMode('create');
                          setAgentsModalCategory('custom');
                          setIsAgentsModalOpen(true);
                          setIsSidebarOpen(false);
                      }}
                  />
                  {/* Backdrop to close sidebar */}
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1]" 
                    onClick={() => setIsSidebarOpen(false)}
                  />
              </motion.div>
          )}
      </AnimatePresence>

      {/* Modals */}
      <VisualHelpModal data={visualHelp} onClose={() => setVisualHelp(null)} />
      
      <ConfirmationModal 
          isOpen={!!chatToDelete} 
          onClose={() => setChatToDelete(null)}
          onConfirm={handleDeleteConversation}
          title="Excluir Conversa"
          message="Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita."
      />

      <ConfirmationModal 
          isOpen={!!agentToDelete} 
          onClose={() => setAgentToDelete(null)}
          onConfirm={confirmDeleteAgent}
          title="Excluir Agente"
          message="Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita."
      />
      
      <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          notifications={notifications}
      />
      
      <AgentsModal 
        isOpen={isAgentsModalOpen}
        onClose={() => {
          setIsAgentsModalOpen(false);
          setAgentsModalMode('list');
          setAgentsModalCategory('system');
        }}
        onActivate={handleActivateAgent}
        onDeactivate={handleDeactivateAgent}
        activeAgent={activeAgent}
        customAgents={customAgents}
        onCreateAgent={handleCreateCustomAgent}
        onUpdateAgent={handleUpdateCustomAgent}
        onDeleteAgent={handleDeleteCustomAgent}
        initialMode={agentsModalMode}
        initialCategory={agentsModalCategory}
      />

      <ArchivedConversationsModal
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedConversations={archivedConversations}
          onRestoreConversation={handleRestoreConversation}
      />

       <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          user={user}
          assistantCustomName={assistantCustomName}
          setAssistantCustomName={setAssistantCustomName}
          userPreferredName={userPreferredName}
          setUserPreferredName={setUserPreferredName}
          tone={activeTone}
          setTone={setActiveTone}
          theme={theme}
          setTheme={setTheme}
          onApplyTheme={onApplyTheme}
          voiceName={voiceName}
          setVoiceName={setVoiceName}
      />

       {/* Alarm Modal */}
       <AlarmModal
           isOpen={isAlarmOpen}
           onClose={() => setIsAlarmOpen(false)}
           onDisable={() => {
               // Logic to actually disable/stop the alarm
           }}
           reminderData={activeAlarm || {titulo: '', descricao: ''}}
       />

    </div>
  );
};

export default App;