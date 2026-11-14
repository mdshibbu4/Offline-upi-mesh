import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Admin() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("/api/admin/stats").then(setS).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <div className="card wide">
      <h1>Server dashboard</h1>
      {error && <p className="error">{error}</p>}
      {s && (
        <>
          <div className="stats">
            <div><b>{s.users}</b>Users</div>
            <div><b>{s.transactions}</b>Transactions</div>
            <div><b>₹{s.volume.toLocaleString("en-IN")}</b>Volume</div>
            <div><b>{s.offlineSettled}</b>Offline settled</div>
            <div><b>{s.offlineRejected}</b>Offline rejected</div>
          </div>
          <h3>Recent offline packets</h3>
          {s.recentPackets.length === 0 && <p className="muted">None yet.</p>}
          {s.recentPackets.map((p) => (
            <div className="txn" key={p.packetId}>
              <div>
                <b>{p.from} → {p.to}</b>
                <div className="muted small">{p.packetId.slice(0, 8)} · {new Date(p.at).toLocaleString()}{p.reason ? ` · ${p.reason}` : ""}</div>
              </div>
              <div><span className={`tag ${p.status}`}>{p.status}</span> ₹{p.amount}</div>
            </div>
          ))}
          <button className="alt" onClick={load}>Refresh</button>
        </>
      )}
    </div>
  );
}
