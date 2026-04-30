import { describe, test, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules - Hardened Audit", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ais-atlas-os",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // P1: Identity Spoofing
  test("P1. Identity Spoofing: DENIED", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "itens_focoflow", "item1"), {
        uid: "bob", // Spoofing bob
        titulo: "Alice's spoofed item",
        categoria: "task",
        id: "item1",
        criado_em: Date.now()
      })
    );
  });

  // P2: Privilege Escalation
  test("P2. Privilege Escalation: DENIED", async () => {
    const alice = testEnv.authenticatedContext("alice", { email: "alice@example.com", email_verified: true });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "Usuarios", "alice"), {
            uid: "alice",
            email: "alice@example.com",
            role: "user"
        });
    });

    await assertFails(
      updateDoc(doc(alice.firestore(), "Usuarios", "alice"), {
        role: "admin"
      })
    );
  });

  // P3: Shadow Field Injection
  test("P3. Shadow Field Injection: DENIED", async () => {
    const alice = testEnv.authenticatedContext("alice", { email_verified: true });
    await assertFails(
      setDoc(doc(alice.firestore(), "itens_focoflow", "item1"), {
        uid: "alice",
        titulo: "Task",
        categoria: "task",
        id: "item1",
        criado_em: Date.now(),
        ghostField: true // Unknown field
      })
    );
  });

  // P5: Terminal State Locking
  test("P5. Terminal State Locking: DENIED", async () => {
    const alice = testEnv.authenticatedContext("alice", { email_verified: true });
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "itens_focoflow", "done1"), {
            uid: "alice",
            titulo: "Finished Task",
            categoria: "task",
            status: "completed",
            id: "done1",
            criado_em: Date.now()
        });
    });

    await assertFails(
      updateDoc(doc(alice.firestore(), "itens_focoflow", "done1"), {
        titulo: "Changed Title"
      })
    );
  });

  // P8: Unauthorized Read (PII Leak)
  test("P8. Unauthorized Read (PII Leak): DENIED", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "Usuarios", "bob"), {
            uid: "bob",
            email: "bob@example.com"
        });
    });

    await assertFails(getDoc(doc(alice.firestore(), "Usuarios", "bob")));
  });

  // P12: Audit Log Deletion
  test("P12. Audit Log Deletion: DENIED", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await testEnv.withSecurityRulesDisabled(async (context) => {
          await setDoc(doc(context.firestore(), "security_logs", "log1"), {
              email: "alice@example.com",
              action: "login",
              status: "success",
              timestamp: new Date()
          });
      });
      await assertFails(deleteDoc(doc(alice.firestore(), "security_logs", "log1")));
  });

  // SUCCESS CASE
  test("Authorized creation: SUCCESS", async () => {
    const alice = testEnv.authenticatedContext("alice", { email_verified: true });
    await assertSucceeds(
      setDoc(doc(alice.firestore(), "itens_focoflow", "item1"), {
        uid: "alice",
        titulo: "Actual Task",
        categoria: "task",
        id: "item1",
        criado_em: Date.now(),
        status: "todo",
        prioridade: "medium"
      })
    );
  });
});
