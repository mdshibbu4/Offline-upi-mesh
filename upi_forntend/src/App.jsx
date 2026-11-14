import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { NetworkProvider } from "./context/NetworkContext.jsx";
import Layout from "./components/Layout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SendMoney from "./pages/SendMoney.jsx";
import Receive from "./pages/Receive.jsx";
import OfflineTransactions from "./pages/OfflineTransactions.jsx";
import Mesh from "./pages/Mesh.jsx";
import History from "./pages/History.jsx";
import Admin from "./pages/Admin.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="card">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="card">Loading...</p>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Protected><Layout /></Protected>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/send" element={<SendMoney />} />
              <Route path="/receive" element={<Receive />} />
              <Route path="/offline" element={<OfflineTransactions />} />
              <Route path="/mesh" element={<Mesh />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NetworkProvider>
  );
}
