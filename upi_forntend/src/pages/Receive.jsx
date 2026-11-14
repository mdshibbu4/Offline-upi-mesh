import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Receive() {
  const { user } = useAuth();
  const [amt, setAmt] = useState("");
  const text = `meshpay://pay?to=${encodeURIComponent(user.upiId)}${amt ? `&amt=${amt}` : ""}`;
  return (
    <div className="card">
      <h1>Receive money</h1>
      <p className="muted">UPI ID: <b>{user.upiId}</b></p>
      <input type="number" min="1" placeholder="Amount to request (optional)" value={amt} onChange={(e) => setAmt(e.target.value)} />
      <div className="qrbox"><QRCodeSVG value={text} size={180} /></div>
      <p className="muted small" style={{ wordBreak: "break-all" }}>{text}</p>
      <p className="muted small">Copy this text into the "Scan" box on another user's Send page.</p>
    </div>
  );
}
