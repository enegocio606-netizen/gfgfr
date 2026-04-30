import { db, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, handleFirestoreError, OperationType, auth } from "../firebase-singleton";

export interface AtlasMemory {
  id?: string;
  content: string;
  memory_type: string;
  created_at?: any;
}

/**
 * Salva uma nova memória no Firestore (memoria_atlas).
 */
export async function saveMemoryFirebase(memory: string, userId: string) {
  try {
    const docRef = await addDoc(
      collection(db, "memoria_atlas"),
      {
        uid: userId,
        text: memory,
        timestamp: Date.now()
      }
    );
    console.log("Memória salva no Firestore:", docRef.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `memoria_atlas/${userId}`);
  }
}

/**
 * Salva uma nova memória no Firestore.
 */
export const saveMemory = async (text: string, memoryType: string = 'important_memory'): Promise<void> => {
  if (!text || !auth.currentUser?.uid) return;

  try {
    await addDoc(collection(db, 'memoria_atlas'), {
        uid: auth.currentUser?.uid,
        text: text,
        memory_type: memoryType,
        timestamp: Date.now()
    });
    console.log("🧠 Memória salva no Firestore (memoria_atlas):", text);
  } catch (fsError) {
    handleFirestoreError(fsError, OperationType.WRITE, 'memoria_atlas');
  }
};

/**
 * Busca memórias relevantes no Firestore.
 */
export const searchMemory = async (queryStr: string, limitCount: number = 10): Promise<string> => {
  if (!auth.currentUser?.uid) return "Usuário não autenticado.";

  try {
    const q = query(
        collection(db, 'memoria_atlas'),
        where('uid', '==', auth.currentUser?.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
    );
    
    const snapshot = await getDocs(q);
    const fsMemories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    if (fsMemories.length === 0) return "Nenhuma memória encontrada.";
    
    return processMemories(fsMemories, queryStr, limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'memoria_atlas');
    return "Erro ao acessar o banco de memórias.";
  }
};

const processMemories = (memories: any[], queryStr: string, limitCount: number): string => {
    // Filtro simples em memória para simular busca por relevância
    const keywords = queryStr.toLowerCase().split(' ').filter(word => word.length > 3);
    let filtered = memories.filter(m => 
      m.text && (
        m.text.toLowerCase().includes(queryStr.toLowerCase()) || 
        keywords.some((kw: string) => m.text.toLowerCase().includes(kw))
      )
    ).slice(0, limitCount);

    // Fallback para as mais recentes se não houver match específico
    if (filtered.length === 0) {
      filtered = memories.slice(0, limitCount);
    }

    return filtered.map((m: any) => m.text).join('\n---\n');
};

// Aliases para compatibilidade com o código existente
export async function salvarMemoria(userId: string, memory: string) {
    try {
        await addDoc(collection(db, "memoria_atlas"), {
            uid: userId,
            text: memory,
            memory_type: 'general',
            timestamp: Date.now()
        });
        console.log("Memória sincronizada no Firestore.");
    } catch (fsError) {
        handleFirestoreError(fsError, OperationType.WRITE, "memoria_atlas");
    }
}

export const buscarMemorias = async (uid: string) => {
    try {
        const q = query(collection(db, 'memoria_atlas'), where('uid', '==', uid), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'memoria_atlas');
        return [];
    }
};
export const saveToMemory = (uid: string, role: string, message: string) => saveMemory(message);
export const saveImportantMemory = (uid: string, info: string) => saveMemory(info);
