'use client';

import { signIn } from "next-auth/react";

export default function Home() {
    return (
        <>
            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />

                <div className="relative z-10 text-center px-8 max-w-7xl mx-auto">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 leading-tight">
                        Onboard to any codebase<br />
                        in <span className="text-cyan-400">&lt;27 seconds</span>
                    </h1>

                    <p className="mt-8 text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto">
                        Paste any GitHub repo. Public or private.<br />
                        We read commits, PRs, issues, and tribal knowledge.<br />
                        Then speak to you like the senior dev who's been there 5 years.
                    </p>

                    <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <input
                            type="url"
                            placeholder="https://github.com/vercel/next.js"
                            className="w-full max-w-2xl px-8 py-6 text-lg bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const url = (e.target as HTMLInputElement).value;
                                    if (url.includes("github.com")) {
                                        window.location.href = `/repo?url=${encodeURIComponent(url)}`;
                                    }
                                }
                            }}
                        />
                        <button className="px-12 py-6 bg-cyan-400 text-black font-bold text-lg rounded-2xl hover:bg-cyan-300 transition-all duration-300 shadow-2xl hover:shadow-cyan-400/50 flex items-center gap-3">
                            <span>Onboard Me</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-zinc-500">
                        Press Enter ↵ after pasting · Private repos require GitHub login
                    </p>
                </div>
            </section>

            <button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="absolute top-8 right-8 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all font-medium flex items-center gap-3"
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
            </button>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-100px) rotate(180deg); }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .bg-grid-16 {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
        </>
    );
}