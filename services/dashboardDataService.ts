import { db, handleFirestoreError, OperationType } from '../firebase-singleton';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';

// Mapping local dashboard names to Firestore collection names
const collectionMap: { [key: string]: string } = {
  'tasks': 'itens_focoflow',
  'notes': 'itens_focoflow',
  'reminders': 'itens_focoflow',
  'projects': 'itens_focoflow',
  'links': 'itens_focoflow',
  'transactions': 'transacoes_financeiras_focoflow',
  'goals': 'metas_financeiras_focoflow'
};

const getCollection = (name: string) => collectionMap[name] || name;

// General helper to create items
export const createDashboardItem = async (userId: string, colName: string, data: any) => {
  const collectionName = getCollection(colName);
  try {
    const colRef = collection(db, collectionName);
    // Add hierarchical/relational sync info expected by rules
    const finalData = { 
      ...data, 
      uid: userId, 
      criado_em: Date.now(),
      categoria: colName === 'tasks' ? 'task' : (colName === 'notes' ? 'note' : colName)
    };
    return await addDoc(colRef, finalData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
};

export const getDashboardItems = async (userId: string, colName: string) => {
  const collectionName = getCollection(colName);
  try {
    const colRef = collection(db, collectionName);
    const q = query(
      colRef, 
      where('uid', '==', userId),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
};

export const updateDashboardItem = async (userId: string, colName: string, itemId: string, data: any) => {
  const collectionName = getCollection(colName);
  try {
    const docRef = doc(db, collectionName, itemId);
    await updateDoc(docRef, { ...data, atualizado_em: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${itemId}`);
  }
};

export const deleteDashboardItem = async (userId: string, colName: string, itemId: string) => {
  const collectionName = getCollection(colName);
  try {
    const docRef = doc(db, collectionName, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${itemId}`);
  }
};
