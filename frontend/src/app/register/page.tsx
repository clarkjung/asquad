"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Card, Input } from "@/components/ui";
import { providersApi, consumersApi } from "@/lib/api";

function FormField({ label, placeholder, type = "text", hint, value = "", onChange }: {
  label: string; placeholder?: string; type?: string; hint?: string; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>{label}</label>
      <Input placeholder={placeholder} type={type} value={value} onChange={onChange} />
      {hint && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signin" ? "signin" : "register";

  const [mode, setMode] = useState<"register" | "signin">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ email: "", company: "", password: "" });
  const f = (key: string) => (v: string) => setForm((p) => ({ ...p, [key]: v }));

  const saveTokens = (providerToken: string, consumerToken: string) => {
    localStorage.setItem("provider_token", providerToken);
    localStorage.setItem("consumer_token", consumerToken);
    localStorage.setItem("logged_in", "1");
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const creds = { email: form.email, company_name: form.company, password: form.password };
      const [providerRes, consumerRes] = await Promise.all([
        providersApi.register(creds),
        consumersApi.register(creds),
      ]);
      saveTokens(providerRes.data.access_token, consumerRes.data.access_token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const creds = { email: form.email, password: form.password };
      const [providerRes, consumerRes] = await Promise.all([
        providersApi.login(creds),
        consumersApi.login(creds),
      ]);
      saveTokens(providerRes.data.access_token, consumerRes.data.access_token);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {(["register", "signin"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", border: "none",
                background: mode === m ? "var(--bg)" : "transparent",
                color: mode === m ? "var(--t1)" : "var(--t3)",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}>
                {m === "register" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <Card>
            {mode === "register" ? (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Get started</h2>
                <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Free to start. No credit card required.</p>
                <FormField label="Work Email" placeholder="you@company.com" type="email" value={form.email} onChange={f("email")} />
                <FormField label="Company / Organization" placeholder="Acme Corp." value={form.company} onChange={f("company")} />
                <FormField label="Password" placeholder="••••••••" type="password" value={form.password} onChange={f("password")} hint="At least 8 characters" />
                {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
                <Btn style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleRegister} disabled={loading || !form.email || !form.company || !form.password}>
                  {loading ? "Creating account…" : "Create Account →"}
                </Btn>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Welcome back</h2>
                <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Sign in to your asquad.ai account</p>
                <FormField label="Email" placeholder="you@company.com" type="email" value={form.email} onChange={f("email")} />
                <FormField label="Password" placeholder="••••••••" type="password" value={form.password} onChange={f("password")} />
                {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
                <Btn style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleSignIn} disabled={loading || !form.email || !form.password}>
                  {loading ? "Signing in…" : "Sign In →"}
                </Btn>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
