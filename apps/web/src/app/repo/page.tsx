'use client';

import { useSearchParams } from "next/navigation";

export default function RepoPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-8">Analyzing repo...</h1>
        <p className="text-2xl text-zinc-400">URL: {url || "None"}</p>
        <div className="mt-16 text-cyan-400 text-8xl animate-pulse">⚡</div>
      </div>
    </div>
  );
}