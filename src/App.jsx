import React, { useState } from "react";
import "./App.css";
import SignInPage from "./component/auth/SignInPage";
import TripOnboarding from "./component/tripForm/TripOnboarding";
import { clearAuth, loadAuth, saveAuth } from "./lib/auth";

function App() {
  const [auth, setAuth] = useState(() => loadAuth());

  const handleSignInSuccess = (session) => {
    saveAuth(session);
    setAuth(session);
  };

  const handleSignOut = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    clearAuth();
    setAuth(null);
  };

  if (!auth?.token) {
    return <SignInPage onSuccess={handleSignInSuccess} />;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-4 top-4 z-50">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)]/96 px-2.5 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.10)] backdrop-blur">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0f706c] to-[#084744] text-[11px] font-bold text-white">
            {(auth.user?.email || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-[220px] truncate text-xs font-semibold text-[#4f616b]">
            {auth.user?.email || "Signed in"}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
          >
            Sign out
          </button>
        </div>
      </div>
      <TripOnboarding token={auth.token} />
    </div>
  );
}

export default App;
