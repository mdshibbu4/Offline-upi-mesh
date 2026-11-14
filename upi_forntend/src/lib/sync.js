import { api } from "../api.js";
import { putItem } from "./idb.js";

// Sends packets to the server (what a bridge phone does) and saves the verdicts locally.
export async function syncPackets(packets) {
  const body = packets.map(({ packetId, senderUpiId, receiverUpiId, amount, createdAt, signature }) => ({
    packetId, senderUpiId, receiverUpiId, amount, createdAt, signature,
  }));
  const { results } = await api("/api/bridge/sync", { method: "POST", body: { packets: body } });
  for (const r of results) {
    const p = packets.find((x) => x.packetId === r.packetId);
    if (p) await putItem("packets", { ...p, status: r.status, reason: r.reason || null, hop: 4 });
  }
  return results;
}
