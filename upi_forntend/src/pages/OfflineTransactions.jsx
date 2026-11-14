import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNetwork } from "../context/NetworkContext.jsx";
import { myPackets } from "../lib/idb.js";
import { syncPackets } from "../lib/sync.js";

export default function OfflineTransactions() {
  const { user } = useAuth();
  const { online } = useNetwork();
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => setList((await myPackets(user.id)).reverse());
  useEffect(() => { load(); }, []);

  const pending = list.filter((p) => p.status === "PENDING");

  // This phone itself got internet, so it syncs directly (no mesh needed)
  const syncNow = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await syncPackets(pending);
      setMsg(`${res.filter((r) => r.status === "SETTLED").length} settled, ${res.filter((r) => r.status === "REJECTED").length} rejected`);
    } catch (e) { setMsg(e.message); }
    await load(); setBusy(false);
  };

  return (
    <div className="card wide">
      <h1>Offline transactions</h1>
      <p className="muted">Stored on this device (IndexedDB). They become real only after the server verifies them.</p>
      <div className="row">
        <button onClick={syncNow} disabled={!online || busy || pending.length === 0}>
          {busy ? "Syncing..." : `Sync now (${pending.length})`}
        </button>
        <Link to="/mesh">Send via mesh instead →</Link>
      </div>
      {!online && <p className="muted small">Go online to sync directly.</p>}
      {msg && <p className="ok">{msg}</p>}
      {list.length === 0 && <p className="muted">No offline payments yet.</p>}
      {list.map((p) => (
        <div className="txn" key={p.packetId}>
          <div>
            <b>To {p.receiverUpiId}</b>
            <div className="muted small">{new Date(p.createdAt).toLocaleString()} · {p.packetId.slice(0, 8)}{p.reason ? ` · ${p.reason}` : ""}</div>
          </div>
          <div><span className={`tag ${p.status}`}>{p.status}</span> ₹{p.amount}</div>
        </div>
      ))}
    </div>
  );
}
