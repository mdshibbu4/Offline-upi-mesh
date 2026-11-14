import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function History() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/payment/transactions").then((d) => setList(d.transactions)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h1>Transaction history</h1>
      {error && <p className="error">{error}</p>}
      {list && list.length === 0 && <p className="muted">No transactions yet.</p>}
      {list && list.map((t) => (
        <div className="txn" key={t.id}>
          <div>
            <b>{t.direction === "SENT" ? "To" : "From"} {t.counterparty.name}</b>
            <div className="muted small">
              {new Date(t.createdAt).toLocaleString()} · {t.mode}
              {t.note ? ` · ${t.note}` : ""}
              {t.status === "FAILED" ? ` · ${t.failReason}` : ""}
            </div>
          </div>
          <div className={t.status === "FAILED" ? "error" : t.direction === "SENT" ? "out" : "ok"}>
            {t.status === "FAILED" ? "FAILED " : t.direction === "SENT" ? "- " : "+ "}₹{t.amount}
          </div>
        </div>
      ))}
    </div>
  );
}
