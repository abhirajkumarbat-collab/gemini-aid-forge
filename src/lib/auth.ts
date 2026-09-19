// CYBERTOOL — auth actions + user profile / admin role helpers (Firebase)
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
  type ConfirmationResult,
  type ApplicationVerifier,
} from "firebase/auth";
import { ref, get, set, update, serverTimestamp } from "firebase/database";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

export interface CyberUser {
  uid: string;
  email: string | null;
  name: string;
  isAdmin: boolean;
  isAnonymous: boolean;
}

export function watchAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

export async function ensureUserRecord(u: User): Promise<CyberUser> {
  const db = getFirebaseDb();
  const userRef = ref(db, `users/${u.uid}`);
  let snap;
  try {
    snap = await get(userRef);
  } catch {
    // Database rules not yet opened — fall back to a local profile so the
    // user can still enter the app.
    return {
      uid: u.uid,
      email: u.email,
      name: u.displayName ?? "",
      isAdmin: false,
      isAnonymous: u.isAnonymous,
    };
  }
  if (!snap.exists()) {
    // NOTE: requires RTDB rules allowing users/$uid writes
    try {
      await set(userRef, {
        email: u.email ?? "",
        name: u.displayName ?? "",
        isAdmin: false,
        createdAt: Date.now(),
      });
    } catch {
      /* rules not opened yet — profile will be created on next login */
    }
    return {
      uid: u.uid,
      email: u.email,
      name: u.displayName ?? "",
      isAdmin: false,
      isAnonymous: u.isAnonymous,
    };
  }
  const v = snap.val();
  return {
    uid: u.uid,
    email: u.email,
    name: v.name || u.displayName || "",
    isAdmin: v.isAdmin === true,
    isAnonymous: u.isAnonymous,
  };
}

export async function refreshRole(uid: string): Promise<boolean> {
  const snap = await get(ref(getFirebaseDb(), `users/${uid}/isAdmin`));
  return snap.exists() && snap.val() === true;
}

export async function signUpEmail(name: string, email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  const db = getFirebaseDb();
  await set(ref(db, `users/${cred.user.uid}`), {
    email,
    name,
    isAdmin: false,
    createdAt: Date.now(),
  });
  return cred.user;
}

export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return cred.user;
}

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  return cred.user;
}

export async function signInGuest() {
  const cred = await signInAnonymously(getFirebaseAuth());
  return cred.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export function makeRecaptcha(containerId: string): ApplicationVerifier {
  const auth = getFirebaseAuth();
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function sendPhoneOtp(
  phone: string,
  verifier: ApplicationVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(getFirebaseAuth(), phone, verifier);
}

export async function signOut() {
  await fbSignOut(getFirebaseAuth());
}

export async function touchLastLogin(uid: string) {
  try {
    await update(ref(getFirebaseDb(), `users/${uid}`), { lastLogin: Date.now() });
  } catch {
    /* non-fatal */
  }
}

export { serverTimestamp };
