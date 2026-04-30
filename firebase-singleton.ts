
// Version 1.0.8 - Dynamic Config Sync
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp, updateDoc, increment, collection, query, where, orderBy, addDoc, Timestamp, deleteDoc, getDocs, limit, getDoc, getDocFromServer } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'sonner';

console.log("[Firebase] Env Check:", {
  VITE_FIREBASE_API_KEY: import.meta.env?.VITE_FIREBASE_API_KEY ? "EXISTS" : "MISSING",
  FIREBASE_API_KEY: process.env?.FIREBASE_API_KEY ? "EXISTS" : "MISSING",
  GEMINI_API_KEY: process.env?.GEMINI_API_KEY ? "EXISTS" : "MISSING"
});

// Import config directly to ensure we use the latest provisioned values
import { firebaseConfig } from './firebase-applet-config.ts';

console.log("%c[Firebase Singleton] LATEST VERSION 1.1.0 RUNNING", "color: #00ff00; font-weight: bold; background: #000; padding: 2px 5px;");
console.log(`[Firebase] Config Source: projectId=${firebaseConfig.projectId}, databaseId=${(firebaseConfig as any).firestoreDatabaseId}`);

let app;
try {
  const existingApps = getApps();
  if (existingApps.length === 0) {
    // Ensure all required fields are present
    const finalConfig = {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: (firebaseConfig as any).measurementId
    };
    
    console.log("[Firebase] Initializing with config:", {
      projectId: finalConfig.projectId,
      hasApiKey: !!finalConfig.apiKey,
      apiKeyLength: finalConfig.apiKey?.length,
      apiKeyPrefix: finalConfig.apiKey ? finalConfig.apiKey.substring(0, 7) : "MISSING",
      databaseId: firebaseConfig.firestoreDatabaseId,
      appId: finalConfig.appId
    });

    if (!finalConfig.apiKey || finalConfig.apiKey === "remixed-api-key" || finalConfig.apiKey.includes(" ")) {
       console.error("[Firebase] CRITICAL ERROR: API Key is invalid, placeholder, or has whitespaces!", `"${finalConfig.apiKey}"`);
    }

    app = initializeApp(finalConfig);
    console.log("[Firebase] SUCCESS: InitializeApp called.");
  } else {
    app = getApp();
    console.log("[Firebase] SUCCESS: Using existing app instance.");
  }
} catch (error) {
  console.error("[Firebase] CRITICAL: Initialization failed:", error);
  throw error;
}

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const errorString = JSON.stringify(errInfo);
  console.error('Firestore Error:', errorString);
  
  if (errInfo.error.includes('Quota exceeded')) {
    toast.error('Cota do banco de dados excedida. O limite será resetado amanhã.');
  }

  throw new Error(errorString);
}

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('permission-denied')) {
       // This is fine, it means we connected but rules blocked us
       console.log("Firestore reachability verified (permission denied by rules).");
       return;
    }
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    console.warn("Firestore connection test failed:", error);
  }
}

testConnection();

export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    doc,
    onSnapshot,
    setDoc,
    serverTimestamp,
    updateDoc,
    increment,
    ref,
    uploadBytes,
    getDownloadURL,
    collection,
    query,
    where,
    orderBy,
    addDoc,
    Timestamp,
    deleteDoc,
    getDocs,
    limit,
    getDoc,
    getDocFromServer
};


