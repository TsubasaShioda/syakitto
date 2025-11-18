"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) {
      setMessage("Email and password are required.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Logged in");
    router.push("/");
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2" />
        </div>
        <div>
          <label className="block">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2" />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white">Login</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
