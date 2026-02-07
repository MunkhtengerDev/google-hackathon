import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DollarSign,
  Route,
  ShieldCheck,
  Sparkles,
  Timer,
  TimerIcon,
} from "lucide-react";
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

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "unknown";

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
          theme: "filled_blue",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 340,
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
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[86vh] max-w-[1220px] grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="motion-rise relative overflow-hidden rounded-[34px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_32px_80px_rgba(16,28,38,0.12)] lg:col-span-7 lg:p-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#f1bf7b59] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#7bbeb263] blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c8ac] bg-[#fff5e2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-[#5f7078]">
              <Sparkles className="h-3.5 w-3.5 text-[#b56a2c]" />
              Intelligent Trip Workspace
            </div>

            <h1 className="font-display mt-5 text-[46px] leading-[0.98] text-[var(--ink)] sm:text-[56px]">
              Beautiful planning starts with one secure login.
            </h1>

            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-[var(--ink-soft)]">
              Sign in once and continue your journey with autosave, live map
              previews, and seamless backend-authenticated sessions.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={<Route className="h-4 w-4" />}
                title="Live Route UX"
                text="Destinations instantly reflect in your map workspace."
              />
              <FeatureCard
                icon={<Timer className="h-4 w-4" />}
                title="Fast Continue"
                text="Planner state and auth restore instantly on refresh."
              />
              <FeatureCard
                icon={<DollarSign className="h-4 w-4" />}
                title="Fast Continue"
                text="Planner state and auth restore instantly on refresh."
              />
            </div>
          </div>
        </section>

        <Card className="motion-rise flex items-center justify-center lg:col-span-5">
          <div className="w-full max-w-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#61737d]">
              Account Access
            </p>
            <h2 className="font-display mt-2 text-[38px] leading-[0.96] text-[var(--ink)]">
              Sign in
            </h2>
            <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
              Continue with your Google account to enter the planner.
            </p>

            <div className="mt-6">
              <div ref={buttonRef} className="min-h-[48px]" />
            </div>

            {loading ? (
              <p className="mt-4 rounded-xl border border-[#cae0da] bg-[#ebf6f3] px-3 py-2 text-sm font-medium text-[#2a5752]">
                Verifying credentials...
              </p>
            ) : null}

            {!isScriptReady && !error ? (
              <p className="mt-4 text-sm text-[var(--ink-muted)]">
                Preparing Google sign-in...
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-xl border border-[#e9c6bc] bg-[#fff2ef] px-3 py-2 text-sm text-[#8c3f2d]">
                {error}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-[#dbcbb3] bg-[#fff8e9] p-4">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#f4e7cd] text-[#365660]">
        {icon}
      </div>
      <div className="mt-2 text-[13px] font-semibold text-[#223944]">
        {title}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[#5a6e77]">{text}</p>
    </div>
  );
}
