import "server-only";

// Keep the server-only guard for Next.js while allowing the standalone seed
// command to share the exact same Firebase Admin initialization.
export {
  adminFirestore,
  adminStorage,
  firebaseAdminApp,
} from "./firebase-admin-core";
