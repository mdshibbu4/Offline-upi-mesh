import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNetwork } from "../context/NetworkContext.jsx";
import { myPackets, putItem } from "../lib/idb.js";
import { signPacket } from "../lib/crypto.js";

const OFFLINE_LIMIT = 2000; // must match the server

export default function SendMoney() {
  const { user, keyStatus } = useAuth();
  const { online } = useNetwork();
  const [params] = useSearchParams();
  const [upiId, setUpiId] = useState(params.get("to") || "");
  const [amount, setAmount] = useState(params.get("amt") || "");
  const [note, setNote] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [qrText, setQrText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setAmount(""); setNote(""); setReceiver(null); setUpiId(""); setQrText(""); };

  // "Scan" a QR: paste its text (meshpay://pay?to=...&amt=...)
  const scan = () => {
    const to = /to=([^&\s]+)/.exec(qrText), amt = /amt=(\d+)/.exec(qrText);
    if (!to) return setError("Not a valid MeshPay QR");
    setError(""); setUpiId(decodeURIComponent(to[1])); if (amt) setAmount(amt[1]);
  };

  const findReceiver = async () => {
    setError(""); setSuccess(""); setReceiver(null);
    try { setReceiver(await api(`/api/users/lookup/${encodeURIComponent(upiId.trim())}`)); }
    catch (e) { setError(e.message); }
  };

  const payOnline = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    try {
      const d = await api("/api/payment/send", { method: "POST", body: { receiverUpiId: receiver.upiId, amount: Number(amount), note } });
      localStorage.setItem(`balance:${user.id}`, d.balance);
      setSuccess(`₹${d.transaction.amount} sent to ${receiver.name}. New balance: ₹${d.balance.toLocaleString("en-IN")}`);
      reset();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  // OFFLINE: nothing is sent. We sign a packet and keep it in IndexedDB as PENDING.
  const payOffline = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    try {
      const amt = Number(amount), to = upiId.trim().toLowerCase();
      if (keyStatus !== "ready") throw new Error("Signing key not ready on this device");
      if (!Number.isInteger(amt) || amt < 1 || amt > OFFLINE_LIMIT) throw new Error(`Offline limit: whole rupees from 1 to ${OFFLINE_LIMIT}`);
      if (!to || to === user.upiId) throw new Error("Enter another user's UPI ID");

      const pending = (await myPackets(user.id)).filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
      const known = Number(localStorage.getItem(`balance:${user.id}`) || 0);
      if (amt + pending > known) throw new Error(`Not enough balance for offline use (last known ₹${known}, already pending ₹${pending})`);

      const packet = {
        packetId: crypto.randomUUID(), userId: user.id, senderUpiId: user.upiId,
        receiverUpiId: to, amount: amt, createdAt: new Date().toISOString(), status: "PENDING", hop: 0,
      };
      packet.signature = await signPacket(user.id, packet);
      await putItem("packets", packet);
      setSuccess(`Offline payment of ₹${amt} to ${to} created and saved as PENDING. Open Mesh to send it across the network.`);
      reset();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <h1 className="ptitle">Send Money</h1>
      <div className="two">
        <div className="panel">
          <h3>Receiver</h3>
          <div className="row">
            <input placeholder="Receiver UPI ID (e.g. amit123@meshpay)" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            {online && <button type="button" onClick={findReceiver} disabled={!upiId.trim()}>Find</button>}
          </div>
          <div className="row">
            <input placeholder="Paste QR text to scan (optional)" value={qrText} onChange={(e) => setQrText(e.target.value)} />
            <button type="button" className="alt" onClick={scan} disabled={!qrText.trim()}>Scan</button>
          </div>
          {(receiver || (!online && upiId.trim())) && (
            <form onSubmit={online ? payOnline : payOffline} className="col">
              <p className="muted">
                {online ? <>Sending to <b>{receiver?.name}</b> ({receiver?.upiId})</> : <>Receiver cannot be verified offline. The server checks it later.</>}
              </p>
              <h3>Amount (₹)</h3>
              <input type="number" min="1" step="1" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              {online && <><h3>Message (Optional)</h3><input placeholder="Happy Diwali! 🎉" maxLength={100} value={note} onChange={(e) => setNote(e.target.value)} /></>}
              <button disabled={busy}>{busy ? "Working..." : online ? "✈ Send Money" : "✈ Create offline payment"}</button>
            </form>
          )}
          {error && <p className="error">{error}</p>}
          {success && <p className="ok">{success}</p>}
        </div>
        <div className="panel side-panel">
          {online ? (
            <>
              <div className="bigicon" >📶</div>
              <h3>You're online</h3>
              <p className="muted">Payments are verified by the server instantly.<br />Tap Online (top right) to try offline mode.</p>
            </>
          ) : (
            <>
              <div className="bigicon">📵</div>
              <h3 className="error">No Internet Connection!</h3>
              <p className="muted">Your payment will be saved locally and synced when internet returns.</p>
              <div className="pendingpill">⏱ Payment Saved as Pending</div>
            </>
          )}
          <div className="steps"><span className="on">Saved Locally</span><span className={online ? "" : ""}>Sync Later</span><span>Completed</span></div>
        </div>
      </div>
    </>
  );
}
