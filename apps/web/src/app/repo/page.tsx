// apps/web/src/app/repo/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import MermaidDiagram from "@/components/MermaidDiagram";
import FileTree from "@/components/FileTree";
import VoicePlayer from "@/components/VoicePlayer";

export default function RepoPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();
        if (res.ok) {
          setResult(data);

          // Save to history
          try {
            const stored = localStorage.getItem("onboardme_history");
            const history = stored ? JSON.parse(stored) : [];
            const entry = {
              url,
              repoName: data.repoFullName,
              timestamp: Date.now(),
              language: data.language,
              stars: data.stars,
            };
            const filtered = history.filter((h: any) => h.url !== url);
            filtered.unshift(entry);
            localStorage.setItem("onboardme_history", JSON.stringify(filtered.slice(0, 20)));
          } catch { }
        } else {
          setError(data.error || "Failed to analyze repo");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [url]);

  const getVoiceMode = () => {
    if (!url) return "professional";
    const match = url.toLowerCase().match(/voice[\/\-](professional|casual|technical|beginner|brutal)/i);
    if (match) return match[1];
    return "professional";
  };

  const voiceMode = getVoiceMode();

  if (!url) return <WelcomeScreen />;
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!result) return <ErrorScreen message="No data received" />;

  const lastCommitAgo = result.lastCommitDate
    ? formatDistanceToNow(new Date(result.lastCommitDate), { addSuffix: true })
    : "Unknown";

  const mermaidCode = result.mermaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25">
              O
            </div>
            <span className="font-bold text-xl text-slate-800">OnboardMe</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/history" className="text-sm text-slate-600 hover:text-cyan-600 font-medium hidden sm:block">History</a>
            <a href="/" className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-cyan-600 font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Analyze another
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Analyzed in {result.duration}s
            {result.fromCache && <span className="text-green-500 ml-1">(cached)</span>}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 break-words">
            {result.repoFullName}
          </h1>

          {result.description && result.description !== "No description" && (
            <p className="text-xl text-slate-500 max-w-3xl mx-auto">{result.description}</p>
          )}

          {result.homepage && (
            <a href={result.homepage} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-cyan-600 hover:text-cyan-700 text-sm font-medium">
              🌐 {result.homepage}
            </a>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">

          {/* ============================================ */}
          {/* ABOUT THE REPOSITORY */}
          {/* ============================================ */}
          <SectionCard icon="🎯" title="About This Repository" gradient="from-cyan-500 to-blue-600">
            <div className="space-y-6">
              {/* Description from README */}
              <p className="text-lg text-slate-700 leading-relaxed">
                {result.whatItDoes || result.purpose || result.description}
              </p>

              {/* Status */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl text-sm font-medium">
                <span className={`w-2 h-2 rounded-full ${result.status?.includes("Active") || result.status?.includes("Very") ? "bg-green-500" :
                    result.status?.includes("Maintained") ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                {result.status}
              </div>

              {/* Repository Stats — SINGLE place for all stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <QuickStat icon="⭐" label="Stars" value={result.stars?.toLocaleString() || "0"} />
                <QuickStat icon="🔱" label="Forks" value={result.forks?.toLocaleString() || "0"} />
                <QuickStat icon="💻" label="Language" value={result.language || "Unknown"} />
                <QuickStat icon="📅" label="Last Commit" value={lastCommitAgo} />
                <QuickStat icon="📜" label="License" value={result.license || "None"} />
                <QuickStat icon="🎂" label="Created" value={result.createdAt} />
              </div>

              {/* Topics */}
              {result.topics && result.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  {result.topics.slice(0, 12).map((topic: string) => (
                    <span key={topic} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Why It Exists */}
          {result.whyItExists && (
            <SectionCard icon="💡" title="Why This Project Exists" gradient="from-amber-500 to-orange-600">
              <p className="text-lg text-slate-700 leading-relaxed">{result.whyItExists}</p>
            </SectionCard>
          )}

          {/* Who It's For */}
          {result.whoItsFor && (
            <SectionCard icon="🎯" title="Who It's For" gradient="from-green-500 to-emerald-600">
              <p className="text-lg text-slate-700 leading-relaxed">{result.whoItsFor}</p>
            </SectionCard>
          )}

          {/* ============================================ */}
          {/* TECH STACK — SINGLE consolidated section */}
          {/* ============================================ */}
          {result.detectedTechStack && result.detectedTechStack.length > 0 && (
            <SectionCard icon="🛠️" title="Tech Stack & Key Components" gradient="from-blue-500 to-indigo-600">
              <div className="space-y-6">
                {/* Tech Stack */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Detected Technologies
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.detectedTechStack.map((tech: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Components */}
                {result.keyComponents && result.keyComponents.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Key Components
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {result.keyComponents.map((component: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                          <span className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 font-medium text-sm">{component}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Voice Walkthrough */}
          <SectionCard icon="🎙️" title="Voice Walkthrough" gradient="from-orange-500 to-red-600">
            <VoicePlayer
              voiceUrl={result.voiceUrl || ""}
              transcript={result.voiceText}
              initialMode={result.voiceMode || "professional"}
            />
          </SectionCard>

          {/* Architecture Diagram */}
          {mermaidCode && (
            <SectionCard icon="📊" title="Architecture Diagram" gradient="from-purple-500 to-indigo-600">
              <div className="bg-slate-900 rounded-2xl p-6 overflow-auto">
                <MermaidDiagram chart={mermaidCode} />
              </div>
            </SectionCard>
          )}

          {/* Project Structure */}
          {result.fileTree && result.fileTree.length > 0 && (
            <SectionCard icon="📂" title="Project Structure" gradient="from-amber-500 to-orange-600">
              <FileTree files={result.fileTree} />
            </SectionCard>
          )}

          {/* Language Breakdown */}
          {result.languages && Object.keys(result.languages).length > 0 && (
            <SectionCard icon="📊" title="Language Breakdown" gradient="from-rose-500 to-pink-600">
              <div className="space-y-3">
                {(() => {
                  const total = Object.values(result.languages as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
                  return Object.entries(result.languages as Record<string, number>)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([lang, bytes]) => {
                      const percentage = Math.round(((bytes as number) / total) * 100);
                      if (percentage < 1) return null;
                      const colors: Record<string, string> = {
                        TypeScript: "bg-blue-500", JavaScript: "bg-yellow-500", Python: "bg-green-500",
                        Rust: "bg-orange-500", Go: "bg-cyan-500", Java: "bg-red-500", CSS: "bg-purple-500",
                        HTML: "bg-orange-400", Shell: "bg-slate-500", Ruby: "bg-red-400", "C++": "bg-blue-600",
                        C: "bg-blue-400", Swift: "bg-orange-500", Kotlin: "bg-purple-600",
                      };
                      return (
                        <div key={lang} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{lang}</span>
                            <span className="text-slate-500">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[lang] || "bg-slate-400"}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                })()}
              </div>
            </SectionCard>
          )}

          {/* ============================================ */}
          {/* TOP CONTRIBUTORS — with GitHub profile links */}
          {/* ============================================ */}
          {result.contributors && result.contributors.length > 0 && (
            <SectionCard icon="👥" title="Top Contributors" gradient="from-blue-500 to-cyan-600">
              <div className="space-y-3">
                {result.contributors.slice(0, 10).map((c: any, i: number) => (
                  <a
                    key={i}
                    href={c.profileUrl || `https://github.com/${c.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    {/* Rank */}
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${i === 0 ? "bg-yellow-500" :
                        i === 1 ? "bg-slate-400" :
                          i === 2 ? "bg-amber-700" :
                            "bg-slate-300"
                      }`}>
                      {i + 1}
                    </span>

                    {/* Avatar */}
                    {c.avatarUrl && (
                      <img
                        src={c.avatarUrl}
                        alt={c.login}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 group-hover:text-cyan-600 transition-colors truncate">
                        {c.login}
                      </div>
                      <div className="text-sm text-slate-500">
                        {c.contributions} contributions ({c.percentage}%)
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="hidden md:block w-32">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Development Insights */}
          {result.darkSecrets && !result.darkSecrets.includes("Unable to") && (
            <SectionCard icon="📈" title="Development Insights" gradient="from-violet-500 to-indigo-600">
              <div className="space-y-4">
                {result.darkSecrets.split(". ").filter(Boolean).map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-700 leading-relaxed">{insight.trim().replace(/\.$/, "")}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Cursed Files */}
          {result.cursedFiles && result.cursedFiles.length > 0 && (
            <SectionCard icon="💀" title="Cursed Files" gradient="from-red-500 to-rose-600">
              <p className="text-sm text-slate-500 mb-4">Files that may need attention based on naming, size, and history.</p>
              <div className="space-y-3">
                {result.cursedFiles.map((file: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border ${file.severity === "critical" ? "bg-red-50 border-red-200" :
                      file.severity === "high" ? "bg-orange-50 border-orange-200" :
                        file.severity === "medium" ? "bg-yellow-50 border-yellow-200" :
                          "bg-slate-50 border-slate-200"
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono text-slate-800 break-all">{file.path}</code>
                        <ul className="mt-2 space-y-1">
                          {file.reasons.map((reason: string, j: number) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5">•</span>{reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex-shrink-0 ${file.severity === "critical" ? "bg-red-500 text-white" :
                          file.severity === "high" ? "bg-orange-500 text-white" :
                            file.severity === "medium" ? "bg-yellow-500 text-white" :
                              "bg-slate-400 text-white"
                        }`}>{file.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* README Score */}
          {result.readmeScore && (
            <SectionCard icon="📖" title="README Quality Score" gradient="from-emerald-500 to-green-600">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white ${result.readmeScore.grade === "A+" || result.readmeScore.grade === "A" ? "bg-green-500" :
                      result.readmeScore.grade === "B" ? "bg-cyan-500" :
                        result.readmeScore.grade === "C" ? "bg-yellow-500" : "bg-red-500"
                    }`}>{result.readmeScore.grade}</div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{result.readmeScore.total}/{result.readmeScore.maxScore}</div>
                    <div className="text-slate-500">Quality Score</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.readmeScore.checks.map((check: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${check.passed ? "bg-green-50" : "bg-red-50"}`}>
                      <span className="text-lg">{check.passed ? "✅" : "❌"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700">{check.name}</div>
                        {!check.passed && <div className="text-xs text-slate-500">{check.tip}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* First Issues */}
          {result.firstIssues && result.firstIssues.length > 0 && (
            <SectionCard icon="📝" title="Your First PRs" gradient="from-green-500 to-emerald-600">
              <ul className="space-y-4">
                {result.firstIssues.map((issue: string, i: number) => (
                  <li key={i} className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                    <span className="w-8 h-8 rounded-lg bg-green-500 text-white font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-slate-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* API Endpoints */}
          {result.endpoints && result.endpoints.length > 0 && (
            <SectionCard icon="🔌" title="API Endpoints" gradient="from-indigo-500 to-violet-600">
              <div className="space-y-2">
                {result.endpoints.map((ep: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl font-mono text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ep.method === "GET" ? "bg-green-100 text-green-700" :
                        ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                          ep.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                            ep.method === "DELETE" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                      }`}>{ep.method}</span>
                    <span className="text-slate-700 truncate">{ep.path}</span>
                    <span className="ml-auto text-xs text-slate-400 truncate hidden md:block">{ep.source}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ENV Variables */}
          {result.envVars && result.envVars.length > 0 && (
            <SectionCard icon="🔐" title="Required Environment Variables" gradient="from-amber-500 to-yellow-600">
              <p className="text-sm text-slate-500 mb-4">
                Detected from .env.example files, project dependencies, and configuration.
              </p>
              <div className="bg-slate-900 rounded-xl p-4 space-y-1 font-mono text-sm overflow-auto">
                {result.envVars.map((v: any, i: number) => (
                  <div key={i} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.required ? "bg-red-400" : "bg-yellow-400"}`}
                        title={v.required ? "Required" : "Optional"}
                      />
                      <span className="text-cyan-400 font-medium">{v.name}</span>
                      <span className="text-slate-600">=</span>
                      <span className="text-slate-500 text-xs truncate">
                        {v.required ? "required" : "optional"}
                      </span>
                    </div>
                    {v.description && (
                      <div className="ml-5 mt-1 text-xs text-slate-500 font-sans">
                        {v.description} <span className="text-slate-600">({v.source})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> Required</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full" /> Optional</span>
              </div>
            </SectionCard>
          )}

          {/* How to Get Started */}
          {result.howToGetStarted && (
            <SectionCard icon="🚀" title="How to Get Started" gradient="from-teal-500 to-cyan-600">
              <div className="bg-slate-900 rounded-xl p-6 overflow-auto">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{result.howToGetStarted}</pre>
              </div>
            </SectionCard>
          )}

          {/* DevContainer */}
          {result.devcontainer && (
            <SectionCard icon="📦" title="DevContainer Configuration" gradient="from-sky-500 to-blue-600">
              <p className="text-sm text-slate-500 mb-4">Auto-generated for instant Codespaces setup.</p>
              <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-[400px]">
                <pre className="text-sm text-slate-300 font-mono">{JSON.stringify(result.devcontainer, null, 2)}</pre>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(result.devcontainer, null, 2))}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-all"
              >
                📋 Copy devcontainer.json
              </button>
            </SectionCard>
          )}

          {/* Open in Codespaces CTA */}
          <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to dive in?</h3>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Open this repo in GitHub Codespaces with a perfectly configured dev environment.
            </p>
            <a
              href={result.codespaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-2xl hover:scale-105 transition-all shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Open in Codespaces
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// HELPER COMPONENTS
// =============================================

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-800 truncate">{value}</div>
    </div>
  );
}

function SectionCard({ icon, title, gradient, children }: {
  icon: string; title: string; gradient: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent mb-6">OnboardMe</h1>
        <p className="text-xl text-slate-500 mb-8">Paste any GitHub repo URL to begin</p>
        <a href="/" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg">Go to Home</a>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const quotes = [
    "Fetching repository metadata...",
    "Scanning file structure...",
    "Analyzing commit history...",
    "Reading the README...",
    "Detecting tech stack...",
    "Finding top contributors...",
    "Extracting development patterns...",
    "Building architecture diagram...",
    "Scoring documentation quality...",
    "Almost there...",
  ];

  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const q = setInterval(() => setIndex((i) => (i + 1) % quotes.length), 3000);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { clearInterval(q); clearInterval(t); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="relative w-32 h-32 mx-auto mb-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
          <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🔍</div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 min-h-[80px]">{quotes[index]}</h2>
        <p className="text-slate-400 text-sm mb-2">{elapsed}s elapsed</p>
        <p className="text-slate-500">
          {elapsed < 20 ? "Analyzing the codebase..." :
            elapsed < 40 ? "Processing repository..." :
              "Almost done — larger repos take longer"}
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Oops! Something went wrong</h1>
        <p className="text-lg text-slate-500 mb-8">{message}</p>
        <a href="/" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg">Try Again</a>
      </div>
    </div>
  );
}