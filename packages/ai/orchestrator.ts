// packages/ai/orchestrator.ts
import { fetchRepoData, fetchRepoTree, fetchCommits } from "./github";
import { generateVoice } from "../voice/elevenlabs";
import { generateMermaidDiagram } from "./mermaid";

function parseGitHubUrl(rawUrl: string): { owner: string; repo: string; voiceMode: string } {
  let url = rawUrl.trim();
  let voiceMode: string = "theo";

  // Support /voice theo, /mode brutal, etc.
  const voiceMatch = url.match(/\/voice[\/\-](theo|prime|indian|japanese|brutal|calm)/i);
  const modeMatch = url.match(/\/mode[\/\-](brutal)/i);
  if (voiceMatch) voiceMode = voiceMatch[1].toLowerCase();
  if (modeMatch) voiceMode = "brutal";

  // Clean URL
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  url = url.split("?")[0].split("#")[0].replace(/\/voice.*/, "").replace(/\/mode.*/, "");

  const u = new URL(url);
  if (!u.hostname.endsWith("github.com")) throw new Error("Must be github.com");

  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid GitHub URL");

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ""),
    voiceMode,
  };
}

function getRepoPurposeAndStatus(data: any, commits: any[], tree: any[]) {
  const name = data.fullName.toLowerCase();
  const desc = (data.description || "").toLowerCase();
  const lastCommit = commits[0];
  const daysSinceCommit = lastCommit ? Math.floor((Date.now() - new Date(lastCommit.date).getTime()) / (86400000)) : 999;

  if (name.includes("next") && name.includes("vercel")) {
    return {
      purpose: "The React framework that powers 60% of the internet. Built by Vercel. You are in the presence of royalty.",
      status: "Extremely active. New RFC every 3 hours.",
      theoSays: "Bro. This is literally the best framework ever made. If you're not using Next.js App Router in 2025, that's a skill issue.",
    };
  }

  if (name.includes("react")) {
    return {
      purpose: "The library that started everything. Dan Abramov is judging you right now.",
      status: "Mature. Changes are measured in years.",
      theoSays: "This repo is older than most juniors. Respect your elders.",
    };
  }

  if (daysSinceCommit > 365) {
    return {
      purpose: "Abandoned. Last commit over a year ago.",
      status: "Dead. Probably still works. Probably dangerous.",
      theoSays: "Bro... this repo is actually dead. Like legitimately dead.",
    };
  }

  return {
    purpose: "Solid open-source project. Does one thing and does it well.",
    status: "Healthy and maintained.",
    theoSays: "This is good code. I respect this maintainer.",
  };
}

export async function onboardRepo(url: string, token?: string) {
  const start = Date.now();

  const { owner, repo, voiceMode } = parseGitHubUrl(url);
  const repoFullName = `${owner}/${repo}`;

  const [repoData, tree, commits] = await Promise.all([
    fetchRepoData(owner, repo, token),
    fetchRepoTree(owner, repo, token),
    fetchCommits(owner, repo, token, 200),
  ]);

  const { purpose, status, theoSays } = getRepoPurposeAndStatus(repoData, commits, tree);
  const voiceText = voiceMode === "brutal" ? theoSays.toUpperCase() + " GET GOOD." : theoSays + " " + purpose;

  const [voiceUrl, mermaid] = await Promise.all([
    generateVoice(voiceText, voiceMode as any),
    generateMermaidDiagram(tree),
  ]);

  return {
    repoFullName,
    description: repoData.description || "No description",
    purpose,
    status,
    voiceUrl,
    mermaid,
    lastCommitDate: commits[0]?.date ? new Date(commits[0].date) : null,
    createdAt: new Date(repoData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    language: repoData.language || "Unknown",
    darkSecrets: "The original author left in 2022 after a 400-comment PR war. The file 'utils/deprecated.ts' is cursed. Never touch it.",
    duration: ((Date.now() - start) / 1000).toFixed(1),
    codespaceUrl: `https://github.com/codespaces/new?repo=${owner}/${repo}&ref=${repoData.defaultBranch}`,
  };
}