// Tiny IndexedDB wrapper. Stores: "packets" (offline payments) and "keys" (signing keys).
const open = () =>
  new Promise((resolve, reject) => {
    const r = indexedDB.open("meshpay", 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("packets", { keyPath: "packetId" });
      r.result.createObjectStore("keys", { keyPath: "userId" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export const putItem = (store, value) => run(store, "readwrite", (s) => s.put(value));
export const getItem = (store, key) => run(store, "readonly", (s) => s.get(key));
export const allItems = (store) => run(store, "readonly", (s) => s.getAll());

export async function myPackets(userId) {
  const all = await allItems("packets");
  return all.filter((p) => p.userId === userId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
