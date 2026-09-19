// CYBERTOOL — Firebase client (browser-only, lazy-initialized)
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
} from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDrZmR_6v3ItW7d1sheKfOhgh-Eegd3gu8",
  authDomain: "cyberhub-ebb7c.firebaseapp.com",
  databaseURL: "https://cyberhub-ebb7c-default-rtdb.firebaseio.com",
  projectId: "cyberhub-ebb7c",
  storageBucket: "cyberhub-ebb7c.firebasestorage.app",
  messagingSenderId: "921149574713",
  appId: "1:921149574713:web:cybertool",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseDb(): Database {
  if (!db) db = getDatabase(getFirebaseApp());
  return db;
}
