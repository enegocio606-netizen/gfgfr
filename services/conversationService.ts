import { db, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, handleFirestoreError, OperationType, setDoc, doc, updateDoc } from "../firebase-singleton";

export async function salvarMensagemNoFirestore(userId: string, conversationId: string, role: string, message: string) {
  const path = `conversas/${conversationId}/mensagens`;
  try {
    // 1. Update the parent conversation's updatedAt
    const convRef = doc(db, "conversas", conversationId);
    await updateDoc(convRef, {
      updatedAt: serverTimestamp()
    });

    // 2. Add the message
    await addDoc(collection(db, "conversas", conversationId, "mensagens"), {
      role: role,
      text: message,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function criarConversa(userId: string, title: string) {
  const id = Math.random().toString(36).substring(2, 12);
  const path = `conversas/${id}`;
  try {
    await setDoc(doc(db, "conversas", id), {
      uid: userId,
      title: title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return null;
  }
}

export async function buscarHistorico(userId: string) {
  try {
    const q = query(
      collection(db, "conversas"),
      where("uid", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "conversas");
    return [];
  }
}
