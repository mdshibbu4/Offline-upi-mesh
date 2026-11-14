import { api } from "../api.js";
import { getItem, putItem } from "./idb.js";

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

// Same text the server rebuilds in bridgeController.messageOf()
export const messageOf = (p) => `${p.packetId}|${p.senderUpiId}|${p.receiverUpiId}|${p.amount}|${p.createdAt}`;

const upload = (publicJwk) => api("/api/users/public-key", { method: "POST", body: { publicKey: publicJwk } });

// Returns "ready" or "missing" (account has a key, but on another device).
export async function ensureKeys(user) {
  const local = await getItem("keys", user.id);
  if (local) {
    if (!user.hasKey) await upload(local.publicJwk);
    return "ready";
  }
  if (user.hasKey) return "missing";

  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  await putItem("keys", { userId: user.id, privateKey: pair.privateKey, publicJwk }); // private key is non-extractable
  await upload(publicJwk);
  return "ready";
}

export async function signPacket(userId, packet) {
  const rec = await getItem("keys", userId);
  if (!rec) throw new Error("No signing key on this device");
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, rec.privateKey, new TextEncoder().encode(messageOf(packet)));
  return b64(sig);
}
