"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { providersApi } from "@/lib/api";

export default function ProviderLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await providersApi.login(form);
      localStorage.setItem("token", r.data.access_token);
      localStorage.setItem("role", "provider");
      router.push("/provider/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Login</h1>
        <p className="text-gray-500 text-sm mb-6">
          Don&apos;t have an account?{" "}
          <Link href="/provider/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Marketplace</Link>
        </div>
      </div>
    </div>
  );
}
