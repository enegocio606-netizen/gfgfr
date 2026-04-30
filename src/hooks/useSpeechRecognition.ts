import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = (
  onResult: (text: string) => void, 
  onInterimResult?: (text: string) => void,
  onError?: (error: string) => void, 
  onRestart?: () => void, // Added onRestart
  lang: string = 'pt-BR'
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // intentToListenRef: true se o usuário quer que o microfone esteja ativo
  const intentToListenRef = useRef(false);
  // isActuallyStartedRef: true se o objeto SpeechRecognition está em execução
  const isActuallyStartedRef = useRef(false);
  // isStartingRef: true se uma chamada ao start() está em andamento
  const isStartingRef = useRef(false);
  
  const restartTimeoutRef = useRef<any>(null);

  const startListening = useCallback(() => {
    intentToListenRef.current = true;
    setIsListening(true);

    if (isActuallyStartedRef.current || isStartingRef.current) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      if (onError) onError("not-supported");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true; // Enable interim results
      recognitionRef.current.lang = lang;

      recognitionRef.current.onstart = () => {
        isActuallyStartedRef.current = true;
        isStartingRef.current = false;
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        // Send final results, or interim if you want to show them in UI
        if (finalTranscript) {
          onResult(finalTranscript);
        }
        if (interimTranscript && onInterimResult) {
          onInterimResult(interimTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        isActuallyStartedRef.current = false;
        isStartingRef.current = false;
        
        // Se o intent ainda é true, tentamos reiniciar com um delay
        if (intentToListenRef.current) {
          if (onRestart) onRestart(); // Call onRestart
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (intentToListenRef.current && !isActuallyStartedRef.current && !isStartingRef.current) {
              try {
                isStartingRef.current = true;
                recognitionRef.current.start();
              } catch (e: any) {
                isStartingRef.current = false;
                if (e.name === 'InvalidStateError') {
                  isActuallyStartedRef.current = true;
                } else {
                  console.warn("Auto-restart failed:", e.message);
                }
              }
            }
          }, 300); // Reduced delay for faster restart
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        
        console.error("Erro no microfone:", event.error);
        
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          intentToListenRef.current = false;
          setIsListening(false);
          if (onError) onError(event.error);
        }
        
        // Em caso de erro crítico, talvez devêssemos resetar o isStartingRef
        isStartingRef.current = false;
      };
    }

    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (e: any) {
      if (e.name === 'InvalidStateError') {
        console.warn("Recognition already started (InvalidStateError), sync state.");
        isActuallyStartedRef.current = true;
        isStartingRef.current = false;
      } else {
        console.error("Failed to start speech recognition:", e);
        isActuallyStartedRef.current = false;
        isStartingRef.current = false;
      }
    }
  }, [lang, onResult]);

  const stopListening = useCallback(() => {
    intentToListenRef.current = false;
    setIsListening(false);
    isStartingRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        // Use abort() to stop immediately and prevent further events
        recognitionRef.current.abort();
        isActuallyStartedRef.current = false;
      } catch (e) {
        console.warn("Error aborting recognition:", e);
        // Fallback to stop() if abort fails
        try {
          recognitionRef.current.stop();
        } catch (stopError) {
          console.warn("Error stopping recognition:", stopError);
        }
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      intentToListenRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  return { isListening, startListening, stopListening };
};
