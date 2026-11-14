import { createContext, useContext, useEffect, useState } from "react";

const NetworkContext = createContext(null);
export const useNetwork = () => useContext(NetworkContext);

// online = real browser connection AND the demo "airplane mode" switch is off
export function NetworkProvider({ children }) {
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [simOffline, setSimState] = useState(localStorage.getItem("simOffline") === "1");

  useEffect(() => {
    const up = () => setBrowserOnline(true), down = () => setBrowserOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const setSim = (v) => { localStorage.setItem("simOffline", v ? "1" : "0"); setSimState(v); };
  return (
    <NetworkContext.Provider value={{ browserOnline, simOffline, setSim, online: browserOnline && !simOffline }}>
      {children}
    </NetworkContext.Provider>
  );
}
