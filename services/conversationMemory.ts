import { 
  db, 
  collection, 
  addDoc, 
  query, 
  where,
  getDocs, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  handleFirestoreError,
  OperationType,
  auth
} from '../firebase-singleton';
import { ConversationMessage } from '../types';

const CONVERSATIONS_COLLECTION = 'conversas';

export interface SessionState {
  tópico: string;
  último_comando: string;
  último_agente: string;
}

/**
 * Fetches the oldest conversation session ID.
 */
export const getFirstConversation = async (): Promise<string | null> => {
  try {
    const collRef = collection(db, CONVERSATIONS_COLLECTION);
    if (!auth.currentUser?.uid) return null;
    const q = query(collRef, where('uid', '==', auth.currentUser?.uid), orderBy('updatedAt', 'asc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CONVERSATIONS_COLLECTION);
    return null;
  }
};

/**
 * Fetches the most recent conversation session ID.
 */
export const getLastConversation = async (): Promise<string | null> => {
  try {
    const collRef = collection(db, CONVERSATIONS_COLLECTION);
    if (!auth.currentUser?.uid) return null;
    const q = query(collRef, where('uid', '==', auth.currentUser?.uid), orderBy('updatedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CONVERSATIONS_COLLECTION);
    return null;
  }
};

/**
 * Saves a message to the persistent conversation history in Firestore.
 */
export const saveConversationMessage = async (
  sessionId: string,
  message: ConversationMessage,
  uid?: string
): Promise<void> => {
  console.log("SALVANDO MENSAGEM:", message);

  try {
    const currentUid = uid || auth.currentUser?.uid;
    if (!currentUid) {
        console.warn("Nenhum UID disponível para salvar mensagem.");
        return;
    }

    // Garantir que o documento da conversa existe com o UID do dono para as regras do Firestore
    const sessionRef = doc(db, CONVERSATIONS_COLLECTION, sessionId);
    await setDoc(sessionRef, {
      uid: currentUid,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, sessionId, 'mensagens');

    const docRef = await addDoc(messagesRef, {
      uid: currentUid,
      role: message.role === 'model' ? 'assistant' : message.role,
      text: message.text,
      timestamp: serverTimestamp(),
    });
    console.log("MENSAGEM SALVA COM ID:", docRef.id);

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CONVERSATIONS_COLLECTION}/${sessionId}/mensagens`);
  }
};

/**
 * Fetches recent messages for a session to reconstruct the conversation buffer.
 */
export const getRecentConversationMessages = async (
  sessionId: string,
  limitCount: number = 8
): Promise<ConversationMessage[]> => {
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, sessionId, 'mensagens');
    if (!auth.currentUser?.uid) return [];
    const q = query(messagesRef, where('uid', '==', auth.currentUser?.uid), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    const messages: ConversationMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        role: data.role === 'assistant' ? 'model' : data.role,
        text: data.text,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as ConversationMessage);
    });
    
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${CONVERSATIONS_COLLECTION}/${sessionId}/mensagens`);
    return [];
  }
};

/**
 * Saves the current session state.
 */
export const saveSessionState = async (
  sessionId: string,
  state: SessionState
): Promise<void> => {
  try {
    const sessionRef = doc(db, CONVERSATIONS_COLLECTION, sessionId);
    await setDoc(sessionRef, { 'estado da sessão': state }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CONVERSATIONS_COLLECTION}/${sessionId}`);
  }
};

/**
 * Retrieves the session state.
 */
export const getSessionState = async (
  sessionId: string
): Promise<SessionState | null> => {
  try {
    const sessionRef = doc(db, CONVERSATIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(sessionRef);
    if (docSnap.exists()) {
      return docSnap.data()['estado da sessão'] as SessionState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${CONVERSATIONS_COLLECTION}/${sessionId}`);
    return null;
  }
};
