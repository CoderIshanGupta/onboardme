// apps/web/src/app/repo/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function RepoPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();
        if (res.ok) setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [url]);

  // Extract voice mode from URL for display
  const getVoiceMode = () => {
    if (!url) return "theo";
    const match = url.toLowerCase().match(/voice[\/\-](theo|prime|indian|japanese|brutal|calm)/i);
    if (match) return match[1];
    if (url.toLowerCase().includes("mode-brutal")) return "brutal";
    return "theo";
  };

  const voiceMode = getVoiceMode();

  if (!url) return <WelcomeScreen />;
  if (loading) return <LoadingScreen />;
  if (!result) return <ErrorScreen />;

  const lastCommitAgo = result.lastCommitDate
    ? formatDistanceToNow(new Date(result.lastCommitDate), { addSuffix: true })
    : "never";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 pt-20 pb-32 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse">
              {result.repoFullName}
            </h1>
            <p className="text-4xl mt-6 text-cyan-300 font-bold">
              Analyzed in ⚡ {result.duration}s
            </p>
            <p className="text-3xl mt-4 text-purple-400 font-bold">
              Voice: <span className="uppercase tracking-wider">{voiceMode}</span>
            </p>
          </div>

          {/* Description */}
          {result.description && result.description !== "No description" && (
            <p className="text-2xl md:text-3xl text-center italic text-zinc-300 max-w-5xl mx-auto mb-20 leading-relaxed">
              “{result.description}”
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <StatGlow title="Last Commit" value={lastCommitAgo} subtitle="Still breathing" />
            <StatGlow title="Born" value={result.createdAt} subtitle="Entered the arena" />
            <StatGlow title="Language" value={result.language || "Secret"} subtitle="Weapon of choice" />
          </div>

          {/* THIS REPO IS */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/30 via-purple-900/30 to-pink-900/30 blur-3xl animate-pulse" />
            <div className="relative bg-black/80 backdrop-blur-2xl border-2 border-cyan-700/70 rounded-3xl p-16 text-center">
              <h2 className="text-6xl md:text-8xl font-black text-cyan-400 mb-10 tracking-tighter">
                THIS REPO IS
              </h2>
              <p className="text-3xl md:text-5xl leading-tight text-zinc-100 font-medium max-w-6xl mx-auto">
                {result.purpose}
              </p>
              <p className="text-2xl text-cyan-300 mt-8">Status: {result.status}</p>
            </div>
          </div>

          {/* Architecture Diagram */}
          {result.mermaid && (
            <div className="relative mb-20">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 blur-3xl animate-pulse" />
              <div className="relative bg-black/80 backdrop-blur-2xl border-2 border-emerald-700/70 rounded-3xl p-16">
                <h2 className="text-6xl md:text-8xl font-black text-emerald-400 mb-12 tracking-tighter text-center">
                  ARCHITECTURE
                </h2>
                <div className="bg-zinc-950/90 rounded-2xl p-8 overflow-x-auto border border-zinc-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, inline, className, children, ...props }) => (
                        <code className={`${className || ''} text-sm leading-relaxed`} {...props}>
                          {children}
                        </code>
                      )
                    }}
                  >
                    {result.mermaid}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Theo / Prime / Indian Engineer Speaks */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/30 to-red-900/30 blur-3xl animate-pulse" />
            <div className="relative bg-black/80 backdrop-blur-2xl border-2 border-orange-700/70 rounded-3xl p-16 text-center">
              <h2 className="text-6xl md:text-8xl font-black text-orange-400 mb-10 tracking-tighter">
                {voiceMode.toUpperCase()} SAYS
              </h2>
              {result.voiceUrl ? (
                <audio controls src={result.voiceUrl} className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl" autoPlay />
              ) : (
                <p className="text-3xl text-zinc-400">Voice generating... (this repo broke the AI)</p>
              )}
            </div>
          </div>

          {/* DARK SECRETS */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-purple-900/40 to-red-900/40 blur-3xl animate-pulse" />
            <div className="relative bg-black/70 backdrop-blur-2xl border-2 border-red-800/80 rounded-3xl p-16 text-center">
              <h2 className="text-6xl md:text-8xl font-black text-red-500 mb-10 tracking-tighter">
                DARK SECRETS
              </h2>
              <p className="text-3xl md:text-5xl leading-tight text-zinc-100 font-medium max-w-5xl mx-auto">
                {result.darkSecrets}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href={result.codespaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-24 py-16 bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-black text-6xl rounded-full hover:scale-110 transition-all shadow-2xl hover:shadow-purple-500/80 animate-pulse"
            >
              OPEN IN CODESPACES → PERFECT SETUP
            </a>
            <p className="text-zinc-400 mt-8 text-2xl">devcontainer.json auto-generated • works first try</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components (keep these)
function StatGlow({ title, value, subtitle }: any) {
  return (
    <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-1 rounded-3xl">
      <div className="bg-black/90 rounded-3xl p-12 text-center border border-cyan-500/30">
        <h3 className="text-3xl font-bold text-cyan-400">{title}</h3>
        <p className="text-6xl font-black text-white mt-4">{value}</p>
        <p className="text-zinc-500 mt-4 text-xl">{subtitle}</p>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-8">
      <div className="text-center">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          OnboardMe
        </h1>
        <p className="text-4xl text-zinc-400 mt-10">
          Paste any GitHub repo URL to begin
        </p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const quotes = [
    "Detecting 3AM commits...",
    "Finding who wrote the cursed file...",
    "Extracting tribal knowledge from PRs...",
    "Talking to the ghost of the original author...",
    "Reading the 'sorry' commits...",
    "Analyzing Friday deploys...",
    "Locating the file that broke production in 2022...",
    "Cloning the soul of the repo...",
    "This codebase has seen things...",
    "Hold tight, legends are being uncovered...",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % quotes.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border-4 border-cyan-500/30 rounded-full animate-ping" />
        <div className="w-80 h-80 border-4 border-purple-500/40 rounded-full animate-ping delay-300 absolute" />
        <div className="w-64 h-64 border-4 border-pink-500/50 rounded-full animate-ping delay-700 absolute" />
      </div>

      <div className="text-center z-10">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-pulse">
          {quotes[index]}
        </h1>
        <div className="mt-20 text-9xl animate-bounce">FIRE</div>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-black text-red-500">ERROR</h1>
        <p className="text-4xl text-zinc-400 mt-10">Failed to analyze repo. Try again.</p>
      </div>
    </div>
  );
}