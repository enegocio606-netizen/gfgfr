import { useState, useCallback, useRef } from 'react';
import { getRecentConversationMessages, getSessionState, SessionState } from '../../services/conversationMemory';

export type VoiceSessionState = 'listening' | 'processing' | 'speaking' | 'reconnecting';

export const useVoiceSessionManager = (
  sessionId: string,
  onContextRestored: (messages: any[], sessionState: SessionState | null) => void,
  onReconnect: () => void
) => {
  const [state, setState] = useState<VoiceSessionState>('listening');
  const isReconnectingRef = useRef(false);

  const handleReconnection = useCallback(async () => {
    if (isReconnectingRef.current) return;
    isReconnectingRef.current = true;
    setState('reconnecting');
    console.log("Voice session reconnecting...");

    try {
      if (!sessionId || sessionId === 'default') {
        console.log("Skipping context restoration for null or 'default' session.");
        setState('listening');
        return;
      }

      // 1. Recuperar mensagens e estado da sessão em paralelo
      const [messages, sessionState] = await Promise.all([
        getRecentConversationMessages(sessionId),
        getSessionState(sessionId)
      ]);
      
      console.log("Context and session state restored from Firestore");

      // 2. Restaurar contexto
      onContextRestored(messages, sessionState);

      // 3. Reconectar
      onReconnect();
      
      setState('listening');
    } catch (error) {
      console.error("Failed to restore context:", error);
      setState('listening'); // Fallback
    } finally {
      isReconnectingRef.current = false;
    }
  }, [sessionId, onContextRestored, onReconnect]);

  return { state, setState, handleReconnection };
};
