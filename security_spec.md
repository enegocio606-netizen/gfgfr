# Firebase Security Specification

## 1. Data Invariants
- Each user has a unique profile.
- All FocoFlow data must belong to a specific user (via `uid` field) and can only be accessed by the owner.
- AI Memory can only be accessed by the user who created it.
- Conversation messages are bound to a parent conversation, which belongs to a user.
- Admin whitelist (`authorized_emails`) is read-only for standard users and protected.

## 2. The "Dirty Dozen" Payloads (Examples)
1. `{"uid": "attacker_id", "titulo": "Malicious Task"}` (Creating a task with someone else's UID)
2. `{"uid": "victim_id", "role": "admin"}` (Privilege escalation: setting role to admin)
3. `{"status": "completed", "winner": "unknown"}` (State short-cutting/Value poisoning)
4. `{"id": "a".repeat(2000), "titulo": "PoisonID"}` (ID Poisoning/Resource exhaustion)
5. `{"email": "admin@example.com", "email_verified": false}` (Email spoofing)
6. `{"ownerId": "attacker_id"}` (Ownership take-over)
7. `{"field1": "payload", "ghostField": true}` (Shadow update test)
8. `{"createdAt": "2024-01-01"}` (Client-provided timestamp manipulation)
9. `{"balance": -1000000}` (Financial value manipulation)
10. `{"type": "admin_announcement"}` (System-only field injection)
11. `{"message": "PII Data here"}` (PII leakage in public field)
12. `{"uid": "victim_id", "status": "active"}` (Re-activating blocked/removed account)

## 3. Test Runner
Existing: `/firestore.rules.test.ts`
Plan: Run tests after implementing `firestore.rules`.
