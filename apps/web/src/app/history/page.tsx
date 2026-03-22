// apps/web/src/app/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HistoryEntry {
  url: string;
  repoName: string;
  timestamp: number;
  language: string;
  stars: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("onboardme_history");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("onboardme_history");
    setHistory([]);
  };

  const analyzeRepo = (url: string) => {
    router.push(`/repo?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25">
              O
            </div>
            <span className="font-bold text-xl text-slate-800">OnboardMe</span>
          </a>
          <a href="/" className="text-sm text-slate-600 hover:text-cyan-600 font-medium">
            ← Back to Home
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Analysis History</h1>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No history yet</h2>
            <p className="text-slate-500 mb-6">Analyze a repo to see it here.</p>
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl"
            >
              Analyze a Repo
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <button
                key={i}
                onClick={() => analyzeRepo(entry.url)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-cyan-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{entry.repoName}</div>
                    <div className="text-sm text-slate-500">
                      {entry.language} • ⭐ {entry.stars?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}