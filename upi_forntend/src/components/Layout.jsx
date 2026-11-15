import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNetwork } from "../context/NetworkContext.jsx";

export const Logo = () => (
  <div className="logo">
    <svg
      width="38"
      height="30"
      viewBox="0 0 38 30"
      fill="none"
      stroke="#8fa8ff"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M3 11a22 22 0 0 1 32 0" />
      <path d="M9 17a14 14 0 0 1 20 0" />
      <path d="M15 23a6 6 0 0 1 8 0" />
      <circle cx="19" cy="27" r="1.5" fill="#8fa8ff" />
    </svg>
    Offline UPI
  </div>
);

const LINKS = [
  ["/", "", "Dashboard"],
  ["/send", "", "Send Money"],
  ["/receive", "", "Receive & QR"],
  ["/offline", "", "Offline Mode"],
  ["/mesh", "", "Mesh Network"],
  ["/history", "", "Transactions"],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { online, browserOnline, simOffline, setSim } = useNetwork();
  return (
    <div className="shell">
      <aside className="side">
        <Logo />
        {LINKS.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {label}
          </NavLink>
        ))}
        {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        <button className="out" onClick={logout}>
          ➜] Logout
        </button>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="chip">
            <div className="avatar">{user.name[0]?.toUpperCase()}</div>
            {user.name}
          </div>
          <button
            className={`net ${online ? "" : "off"}`}
            disabled={!browserOnline}
            onClick={() => setSim(!simOffline)}
            title="Tap to simulate airplane mode"
          >
            ● {online ? "Online" : "Offline"} <span className="hide-sm">(tap to switch)</span>
          </button>
        </div>
        {!online && (
          <div className="offbanner">
            📵 You are offline. New payments are saved on this device as PENDING
            and sent later through the mesh.
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
