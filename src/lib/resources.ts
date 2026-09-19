// CYBERTOOL — resource catalog CRUD (Firebase Realtime Database)
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { getFirebaseDb } from "./firebase";

export interface CyberResource {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "app" | "course" | "method" | "tool" | "video";
  link: string;
  logo: string;
  createdAt: number;
}

export function watchResources(cb: (items: CyberResource[]) => void) {
  const r = ref(getFirebaseDb(), "resources");
  return onValue(
    r,
    (snap) => {
      const out: CyberResource[] = [];
      if (snap.exists()) {
        const v = snap.val() as Record<string, Omit<CyberResource, "id">>;
        for (const [id, item] of Object.entries(v)) out.push({ id, ...item });
      }
      out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cb(out);
    },
    () => cb([]) // permission denied etc. — show empty catalog instead of crashing
  );
}

export async function addResource(data: Omit<CyberResource, "id" | "createdAt">) {
  const r = push(ref(getFirebaseDb(), "resources"));
  await set(r, { ...data, createdAt: Date.now() });
}

export async function updateResource(id: string, data: Partial<CyberResource>) {
  await update(ref(getFirebaseDb(), `resources/${id}`), data);
}

export async function deleteResource(id: string) {
  await remove(ref(getFirebaseDb(), `resources/${id}`));
}
