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
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <span className="max-w-[220px] truncate text-xs text-slate-600">
            {auth.user?.email || "Signed in"}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
      <TripOnboarding />
    </div>
  );
}

export default App;
