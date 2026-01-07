// apps/web/src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const go = () => {
    if (!url.trim()) return;
    const clean = url.trim().replace(/\/$/, "");
    router.push(`/repo?url=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center max-w-5xl">
        <h1 className="text-8xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse">
          OnboardMe
        </h1>
        <p className="text-4xl md:text-6xl text-zinc-300 mt-10 font-light">
          Understand any codebase in <span className="text-cyan-400 font-black">&lt;27 seconds</span>
        </p>
        <p className="text-2xl text-zinc-500 mt-6">
          Paste any GitHub repo. We read its soul.
        </p>

        <div className="mt-20 flex flex-col md:flex-row gap-6 justify-center items-center">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            placeholder="https://github.com/vercel/next.js"
            className="w-full max-w-2xl px-12 py-8 text-2xl bg-white/5 border border-white/20 rounded-full placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition-all backdrop-blur-xl"
          />
          <button
            onClick={go}
            className="px-20 py-8 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-black text-3xl rounded-full hover:scale-110 transition-all shadow-2xl"
          >
            ONBOARD ME
          </button>
        </div>
      </div>
    </div>
  );
}