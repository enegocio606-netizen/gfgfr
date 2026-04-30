// src/services/microphoneService.ts

export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state === 'granted';
  } catch (error) {
    console.warn("[ATLAS] Não foi possível verificar permissão de microfone:", error);
    return false; // Assume false if unable to check
  }
}

export async function startMicrophone(): Promise<MediaStream> {
  try {
    console.log("[ATLAS] Solicitando acesso ao microfone...");
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("API de microfone não suportada neste navegador.");
    }

    // Configure para microfone contínuo
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    console.log("[ATLAS] Microfone ativado com sucesso (contínuo).");
    return stream;
  } catch (error: any) {
    console.error("[ATLAS] Erro detalhado ao acessar microfone:", error);
    throw error;
  }
}

export function stopMicrophone(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    console.log("[ATLAS] Microfone parado.");
  }
}
