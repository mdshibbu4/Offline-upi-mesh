import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Logo } from "../components/Layout.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); 
    setError(""); 
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <section className="hero">
        <Logo />
        <p>Mesh Payment Simulation</p>
        <div className="phone-art">📱</div>
        <h1>Pay Anytime,<br />Even <span>Without Internet!</span></h1>
        <p>A smart mesh network for seamless digital payments.</p>
        <div className="feat"><i>⚡</i>Offline Transactions</div>
        <div className="feat"><i>🕸️</i>Mesh Network Routing</div>
        <div className="feat"><i>🔒</i>Secure &amp; Signed (ECDSA)</div>
      </section>
      <div className="authwrap">
        <form className="authcard" onSubmit={submit}>
          <div className="tabs">
            <Link to="/login" className={!isRegister ? "on" : ""}>Login</Link>
            <Link to="/register" className={isRegister ? "on" : ""}>Register</Link>
          </div>
          <h2>{isRegister ? "Create account " : "Welcome Back! "}</h2>
          <p className="muted" style={{ textAlign: "center" }}>{isRegister ? "Get ₹5,000 demo balance" : "Login to continue with Offline UPI"}</p>
          {isRegister && <input name="name" placeholder="Full name" value={form.name} onChange={change} required />}
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
          <input name="password" type="password" placeholder="Password (min 6)" value={form.password} onChange={change} required />
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? "Please wait..." : isRegister ? "Register" : "Login"}</button>
          <p className="muted" style={{ textAlign: "center" }}>
            {isRegister ? <>Have an account? <Link to="/login" style={{ textDecoration: "none"}}>Login</Link></> : <>New here? <Link to="/register" style={{ textDecoration: "none"}} >Create an account</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
