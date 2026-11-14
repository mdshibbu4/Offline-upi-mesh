import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNetwork } from "../context/NetworkContext.jsx";
import { myPackets, putItem } from "../lib/idb.js";
import { syncPackets } from "../lib/sync.js";

const NODES = [
  { key: "A", name: "You", role: "Sender", icon: "👤" },
  { key: "B", name: "Phone B", role: "Node", icon: "👤" },
  { key: "C", name: "Phone C", role: "Node", icon: "👤" },
  { key: "BRIDGE", name: "Bridge", role: "Gateway", icon: "📡" },
  { key: "SERVER", name: "Server", role: "Backend", icon: "🖥️" },
];

export default function Mesh() {
  const { user } = useAuth();
  const { browserOnline } = useNetwork();
  const [bridgeNet, setBridgeNet] = useState(true);
  const [packets, setPackets] = useState([]);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const say = (m) => setLog((l) => [m, ...l].slice(0, 12));
  const load = async () => setPackets((await myPackets(user.id)).slice(-6));

  useEffect(() => {
    load();
    api("/api/mesh/devices")
      .then((d) => setBridgeNet(d.devices.find((x) => x.key === "BRIDGE")?.internet ?? true))
      .catch(() => {});
  }, []);

  const toggleBridge = async () => {
    const next = !bridgeNet;
    setBridgeNet(next);
    say(`Bridge internet ${next ? "ON" : "OFF"}`);
    api("/api/mesh/devices/BRIDGE", { method: "PATCH", body: { internet: next } }).catch(() => {});
  };

  // One round: every pending packet hops forward once. At the Bridge, if it has internet, sync to server.
  const runRound = async () => {
    setBusy(true);
    const pending = (await myPackets(user.id)).filter((p) => p.status === "PENDING");
    if (!pending.length) { say("No pending packets. Create one on Send while offline."); setBusy(false); return; }

    for (const p of pending) {
      if (p.hop < 3) { p.hop += 1; await putItem("packets", p); say(`₹${p.amount} → ${NODES[p.hop].name}`); }
    }
    const atBridge = pending.filter((p) => p.hop === 3);
    if (atBridge.length) {
      if (bridgeNet && browserOnline) {
        say("Bridge has internet. Uploading to server...");
        try {
          const res = await syncPackets(atBridge);
          res.forEach((r) => say(`Server: ${r.status}${r.reason ? ` (${r.reason})` : ""}`));
        } catch (e) { say(`Sync failed: ${e.message}`); }
      } else say("Packet is waiting at the Bridge: no internet yet.");
    }
    await load(); setBusy(false);
  };

  // Attack demos: what if a bridge replays or edits a packet?
  const attack = async (kind) => {
    const base = packets.find((p) => p.status === "SETTLED");
    if (!base) return say("Settle a packet first, then try an attack.");
    const copy = { packetId: base.packetId, senderUpiId: base.senderUpiId, receiverUpiId: base.receiverUpiId, amount: base.amount, createdAt: base.createdAt, signature: base.signature };
    if (kind === "tamper") copy.amount = base.amount + 500; // evil bridge raises the amount
    try {
      const { results } = await api("/api/bridge/sync", { method: "POST", body: { packets: [copy] } });
      say(`${kind === "tamper" ? "Tamper" : "Replay"} attack → ${results[0].status}: ${results[0].reason || "accepted"}`);
    } catch (e) { say(e.message); }
  };

  const col = (p) => (p.status === "PENDING" ? p.hop : 4);
  const last = packets[packets.length - 1];
  const hop = last ? (last.status === "PENDING" ? last.hop : 4) : -1;
  const steps = ["Packet Created", "Forwarded via Mesh", "Reached Gateway", "Verified by Server"];
  const doneAt = [0, 1, 3, 4];

  return (
    <>
      <div className="dark">
        <div className="head">
          <h2>🕸️ Mesh Network - Transaction Flow</h2>
          <span className="live">Live Simulation ●</span>
        </div>
        <div className="flow">
          {NODES.map((n, i) => {
            const here = packets.filter((p) => col(p) === i);
            const isBridge = n.key === "BRIDGE", isServer = n.key === "SERVER";
            const up = isBridge ? bridgeNet : isServer ? true : i === 0 ? false : true;
            return (
              <div key={n.key} className={`nodecard ${here.length ? "has" : ""} ${isBridge ? "gate" : ""}`}>
                <div className="av">{n.icon}</div>
                <b>{n.name}</b><div className="small">({n.role})</div>
                <span className={`pill ${up ? "" : "off"}`}>{up ? "● Online" : "● Offline"}</span>
                <div>{here.map((p) => <span key={p.packetId} className={`pk ${p.status}`}>₹{p.amount}{p.status === "SETTLED" ? " ✅" : p.status === "REJECTED" ? " ❌" : ""}</span>)}</div>
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <button onClick={runRound} disabled={busy}>▶ Run mesh round</button>
          <button className="alt" onClick={toggleBridge}>Bridge internet: {bridgeNet ? "ON" : "OFF"}</button>
          <button className="alt" onClick={() => attack("replay")}>Attack: replay</button>
          <button className="alt" onClick={() => attack("tamper")}>Attack: tamper</button>
        </div>
        <div className="log">{log.length ? log.map((l, i) => <div key={i}>{l}</div>) : "Activity log is empty. Create an offline payment on the Send page first."}</div>
      </div>

      {last && (
        <div className="dark">
          <div className="details" style={{ marginTop: 0 }}>
            <div>
              <h3>Transaction Details</h3>
              <div className="kv"><b>Packet ID</b>: {last.packetId.slice(0, 8)}</div>
              <div className="kv"><b>Sender</b>: {last.senderUpiId}</div>
              <div className="kv"><b>Receiver</b>: {last.receiverUpiId}</div>
              <div className="kv"><b>Amount</b>: ₹{last.amount}</div>
            </div>
            <div>{steps.map((t, i) => <div key={t} className={`check ${hop >= doneAt[i] && !(i === 3 && last.status === "PENDING") ? "done" : ""}`}>{t}</div>)}</div>
            <div className={`success ${last.status === "REJECTED" ? "rej" : ""}`}>
              {last.status === "SETTLED" && <><div style={{ fontSize: 34 }}>✅</div><b>Payment Successful!</b><span className="small">₹{last.amount} sent to {last.receiverUpiId}</span></>}
              {last.status === "REJECTED" && <><div style={{ fontSize: 34 }}>❌</div><b>Payment Rejected</b><span className="small">{last.reason}</span></>}
              {last.status === "PENDING" && <><div style={{ fontSize: 34 }}>⏳</div><b>In transit</b><span className="small">Run mesh rounds to move it forward</span></>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
