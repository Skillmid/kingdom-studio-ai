"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TestSupabasePage() {
  const [result, setResult] = useState("Not tested");

  async function testConnection() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setResult(`❌ Error: ${error.message}`);
        return;
      }

      console.log(data);
      setResult("✅ Successfully connected to Supabase");
    } catch (error) {
      setResult(`❌ ${String(error)}`);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-6 text-3xl font-bold">
          Supabase Connection Test
        </h1>

        <button
          onClick={testConnection}
          className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black hover:bg-yellow-400"
        >
          Test Connection
        </button>

        <p className="mt-6 text-center">
          {result}
        </p>
      </div>
    </main>
  );
}