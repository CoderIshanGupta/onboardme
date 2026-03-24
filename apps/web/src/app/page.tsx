// apps/web/src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = () => {
    if (!url.trim()) return;
    setIsLoading(true);
    const clean = url.trim().replace(/\/$/, "");
    router.push(`/repo?url=${encodeURIComponent(clean)}`);
  };

  const tryExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setIsLoading(true);
    router.push(`/repo?url=${encodeURIComponent(exampleUrl)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25">
              O
            </div>
            <span className="font-bold text-xl text-slate-800">OnboardMe</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/history"
              className="text-sm text-slate-600 hover:text-cyan-600 font-medium hidden sm:block"
            >
              History
            </a>

            {session ? (
              <div className="flex items-center gap-3">
                <img
                  src={session.user?.image || ""}
                  alt=""
                  className="w-9 h-9 rounded-full border-2 border-white shadow-md"
                />
                <span className="text-sm text-slate-600 hidden sm:block font-medium">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-slate-900/25"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-purple-100 border border-cyan-200 rounded-full text-sm text-cyan-700 font-medium mb-8 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Understand any codebase instantly
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6 text-slate-900">
            Onboard to any codebase
            <br />
            <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              in under 5 minutes
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Paste any GitHub repo URL. Get a voice explanation, architecture diagram,
            dark secrets from commit history, and your first PR suggestions —
            <span className="text-slate-900 font-semibold"> all in seconds.</span>
          </p>

          {/* Main Input */}
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSubmit()}
                  placeholder="https://github.com/vercel/next.js"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all disabled:opacity-50 shadow-sm"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !url.trim()}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Onboard Me
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Quick Examples */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-slate-500">Try:</span>
              {[
                { name: "Next.js", url: "https://github.com/vercel/next.js" },
                { name: "React", url: "https://github.com/facebook/react" },
                { name: "Supabase", url: "https://github.com/supabase/supabase" },
                { name: "Shadcn UI", url: "https://github.com/shadcn-ui/ui" },
              ].map((example) => (
                <button
                  key={example.name}
                  onClick={() => tryExample(example.url)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-xl text-sm text-slate-600 hover:text-cyan-600 font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
            What you get in seconds
          </h2>
          <p className="text-slate-500 text-center mb-16 max-w-2xl mx-auto text-lg">
            Everything a senior engineer would tell you on your first day — extracted automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="🎙️" title="Voice Explanation" description="Audio walkthrough that explains what the project does, its architecture, and key patterns." gradient="from-cyan-500 to-blue-600" bgColor="bg-cyan-50" />
            <FeatureCard icon="📊" title="Architecture Diagram" description="Visual map of the codebase structure showing how components relate to each other." gradient="from-purple-500 to-indigo-600" bgColor="bg-purple-50" />
            <FeatureCard icon="📈" title="Development Insights" description="Late-night commits, panic fixes, contributor patterns — the tribal knowledge nobody writes down." gradient="from-red-500 to-orange-600" bgColor="bg-red-50" />
            <FeatureCard icon="💀" title="Cursed Files" description="High-churn files, deprecated code, god files — know what to avoid before you start." gradient="from-rose-500 to-pink-600" bgColor="bg-rose-50" />
            <FeatureCard icon="🔐" title="ENV Detector" description="Automatically detects required environment variables from project configuration." gradient="from-amber-500 to-yellow-600" bgColor="bg-amber-50" />
            <FeatureCard icon="📖" title="README Score" description="Quality score for documentation with actionable improvement suggestions." gradient="from-green-500 to-emerald-600" bgColor="bg-green-50" />
            <FeatureCard icon="🔌" title="API Endpoint Map" description="Detects all API routes and endpoints from the project structure." gradient="from-indigo-500 to-violet-600" bgColor="bg-indigo-50" />
            <FeatureCard icon="📦" title="DevContainer Config" description="Auto-generated devcontainer.json for instant development setup in Codespaces." gradient="from-sky-500 to-blue-600" bgColor="bg-sky-50" />
            <FeatureCard icon="📝" title="First PR Suggestions" description="Good first issues with context — know exactly where to start contributing." gradient="from-teal-500 to-cyan-600" bgColor="bg-teal-50" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-cyan-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-900">
            How it works
          </h2>

          <div className="space-y-8">
            <Step number="1" title="Paste any GitHub URL" description="Public or private (with login). Monorepos, legacy codebases, any language — we handle it all." />
            <Step number="2" title="AI analyzes the codebase" description="We read the README, file structure, commit history, PRs, and dependencies to understand the project deeply." />
            <Step number="3" title="Get instant understanding" description="Voice explanation, architecture diagram, development insights, tech stack detection, and actionable next steps." />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard value="30s" label="Average analysis time" />
            <StatCard value="15+" label="Analysis dimensions" />
            <StatCard value="5min" label="From paste to productive" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-cyan-500 to-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Stop wasting weeks on onboarding
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join developers who understand codebases in minutes, not months.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-10 py-5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xl rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Try it now — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              O
            </div>
            <span className="font-semibold text-white">OnboardMe</span>
          </div>
          <p className="text-sm text-slate-400">
            Built for developers who hate slow onboarding
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient, bgColor }: {
  icon: string; title: string; description: string; gradient: string; bgColor: string;
}) {
  return (
    <div className={`p-6 rounded-2xl ${bgColor} border border-slate-100 hover:shadow-xl hover:scale-105 transition-all group`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-black text-white text-2xl flex-shrink-0 shadow-lg shadow-purple-500/25">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50 border border-slate-100">
      <div className="text-5xl font-black bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-slate-500 font-medium">{label}</div>
    </div>
  );
}