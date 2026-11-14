import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNetwork } from "../context/NetworkContext.jsx";
import { myPackets } from "../lib/idb.js";

export default function Dashboard() {
  const { user, keyStatus } = useAuth();
  const { online } = useNetwork();
  const cacheKey = `balance:${user.id}`;
  const [balance, setBalance] = useState(() => localStorage.getItem(cacheKey));
  const [fresh, setFresh] = useState(false);
  const [txns, setTxns] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    myPackets(user.id).then((l) => setPending(l.filter((p) => p.status === "PENDING")));
    if (!online) { setFresh(false); return; }
    api("/api/wallet").then((d) => { setBalance(d.balance); setFresh(true); localStorage.setItem(cacheKey, d.balance); }).catch(() => setFresh(false));
    api("/api/payment/transactions").then((d) => setTxns(d.transactions.slice(0, 3))).catch(() => {});
  }, [online]);

  const tiles = [
    ["/send", "➤", "Send Money", "Transfer to anyone"],
    ["/receive", "⛶", "Scan & Pay", "Via QR code"],
    ["/offline", "☁️", "Offline Mode", "Save if no internet"],
    ["/mesh", "🕸️", "Mesh Network", "View route"],
  ];

  return (
    <>
      <div className="hello">
        <div>
          <h1>Hello, {user.name.split(" ")[0]} </h1>
          <p className="muted">Here's your account overview · <b>{user.upiId}</b></p>
        </div>
        <div className="balcard">
          <div>Current Balance {!fresh && balance !== null && <span className="small">(last known)</span>}</div>
          <div className="big">{balance === null ? "..." : `₹${Number(balance).toLocaleString("en-IN")}`}</div>
        </div>
      </div>

      {keyStatus === "missing" && <p className="card error">This account's signing key is on another device, so offline payments are disabled here.</p>}
      {keyStatus === "error" && <p className="card error">Could not set up the signing key. Reload while online.</p>}

      <div className="tiles">
        {tiles.map(([to, icon, title, sub]) => (
          <Link className="tile" to={to} key={title}><i>{icon}</i><b>{title}</b><span>{sub}</span></Link>
        ))}
      </div>

      <div className="two">
        <div className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}><h3>Recent Transactions</h3><Link to="/history" style={{ textDecoration: "none"}}>View All →</Link></div>
          {pending.map((p) => (
            <div className="txn" key={p.packetId}>
              <div className="l"><div className="ic pend">⏳</div><div><b>Pending Payment</b><div className="muted small">To {p.receiverUpiId}</div></div></div>
              <div><div>- ₹{p.amount}</div><span className="tag PENDING">Pending</span></div>
            </div>
          ))}
          {txns.map((t) => (
            <div className="txn" key={t.id}>
              <div className="l">
                <div className={`ic ${t.direction === "SENT" ? "" : "in"}`}>{t.direction === "SENT" ? "↑" : "↓"}</div>
                <div><b>{t.direction === "SENT" ? "Sent to" : "Received from"} {t.counterparty.name}</b><div className="muted small">{new Date(t.createdAt).toLocaleString()}</div></div>
              </div>
              <div><div>{t.direction === "SENT" ? "-" : "+"} ₹{t.amount}</div><span className={`tag ${t.status}`}>{t.status === "SUCCESS" ? "Success" : "Failed"}</span></div>
            </div>
          ))}
          {pending.length + txns.length === 0 && <p className="muted">No transactions yet.</p>}
        </div>
        <div className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}><h3>Mesh Network Status</h3><span className="ok small">● Active</span></div>
          <div className="miniMesh">
            <div><i>📱</i>You<br /><span className={`dot ${online ? "" : "off"}`} />{online ? "Online" : "Offline"}</div>
            <div><i>📡</i>Bridge<br /><span className="dot" />Online</div>
            <div><i>🖥️</i>Server<br /><span className="dot" />Online</div>
          </div>
          <Link to="/mesh" style={{ textDecoration: "none"}}>Open mesh simulation →</Link>
        </div>
      </div>
    </>
  );
}
