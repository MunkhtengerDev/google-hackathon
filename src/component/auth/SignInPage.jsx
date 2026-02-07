import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "../../ui/primitives";

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity script"));
    document.head.appendChild(script);
  });
}

export default function SignInPage({ onSuccess }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const handleCredential = useCallback(
    async (credential) => {
      if (!credential) {
        setError("Google did not return an ID token. Please try again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credential }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message || "Google sign-in failed");
        }

        if (!payload?.token || !payload?.user) {
          throw new Error("Backend returned an invalid auth response");
        }

        onSuccess?.({
          token: payload.token,
          user: payload.user,
          isNewUser: Boolean(payload.isNewUser),
        });
      } catch (requestError) {
        setError(requestError.message || "Unable to complete sign-in");
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  useEffect(() => {
    let cancelled = false;

    if (!GOOGLE_CLIENT_ID) {
      setError("Missing VITE_GOOGLE_CLIENT_ID in frontend env.");
      return undefined;
    }

    if (!buttonRef.current) return undefined;

    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !google?.accounts?.id || !buttonRef.current) return;

        setIsScriptReady(true);
        buttonRef.current.innerHTML = "";

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleCredential(response?.credential),
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
        });
      })
      .catch((scriptError) => {
        if (cancelled) return;
        setError(scriptError.message || "Unable to initialize Google sign-in");
      });

    return () => {
      cancelled = true;
    };
  }, [handleCredential]);

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-slate-200/70 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Trip Planner
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-slate-900">
              Plan smarter with one secure sign-in.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Sign in with Google to save your trip preferences and continue
              from any device.
            </p>
            <div className="mt-8 space-y-2 text-sm text-slate-700">
              <p>1. Authenticate with your Google account.</p>
              <p>2. We exchange your ID token with your backend API.</p>
              <p>3. Your session is stored locally for quick access.</p>
            </div>
          </section>

          <Card className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-slate-900">
                Sign in
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Continue with your Google account.
              </p>

              <div className="mt-6">
                <div ref={buttonRef} className="min-h-[48px]" />
              </div>

              {loading && (
                <p className="mt-4 text-sm text-slate-600">
                  Verifying with backend...
                </p>
              )}

              {!isScriptReady && !error && (
                <p className="mt-4 text-sm text-slate-500">
                  Loading Google sign-in...
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <p className="mt-6 text-xs text-slate-500">
                API endpoint: <code>{API_BASE_URL}/api/v1/users/google</code>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
