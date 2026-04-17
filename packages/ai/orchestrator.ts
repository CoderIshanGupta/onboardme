// packages/ai/orchestrator.ts
import { generateVoice } from "../voice/elevenlabs";
import { generateVoiceScript } from "../voice/script";
import { generateMermaidDiagram } from "./mermaid";
import { extractTribalKnowledge } from "./tribal";
import { getFirstGoodIssues } from "./issues";
import { analyzeCodebaseWithClaude } from "./claude";
import { generateRepoExplanation } from "./explainer";
import { detectCursedFiles } from "./cursed";
import { detectEnvVars } from "./envdetector";
import { detectEndpoints } from "./endpoints";
import { scoreReadme } from "./readmescore";
import { generateDevcontainer } from "./devcontainer";
import { getCached, setCache, getCacheKey } from "./cache";
import { fetchRepoData, fetchRepoTree, fetchCommits, fetchKeyFiles, fetchLanguages, fetchContributors } from "./github";
import { processContributors } from "./contributors";

function parseGitHubUrl(rawUrl: string): { owner: string; repo: string; voiceMode: string } {
  let url = rawUrl.trim();
  let voiceMode = "professional";

  const voiceMatch = url.match(/\/voice[\/\-](professional|casual|technical|beginner|brutal)/i);
  if (voiceMatch) voiceMode = voiceMatch[1].toLowerCase();

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

export async function onboardRepo(url: string, token?: string) {
  const start = Date.now();

  const { owner, repo, voiceMode } = parseGitHubUrl(url);
  const repoFullName = `${owner}/${repo}`;
  const cacheKey = getCacheKey(url);

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true,
      duration: "0.1",
    };
  }

  // PHASE 1: Fetch ALL data in parallel
  const [repoData, tree, commits, keyFiles, languages, rawContributors] = await Promise.all([
    fetchRepoData(owner, repo, token),
    fetchRepoTree(owner, repo, token),
    fetchCommits(owner, repo, token, 100),
    fetchKeyFiles(owner, repo, token),
    fetchLanguages(owner, repo, token),
    fetchContributors(owner, repo, token),
  ]);

  // PHASE 2: Run ALL analysis in parallel (all CPU-bound, no API calls)
  const explanation = generateRepoExplanation({
    repoName: repoFullName,
    description: repoData.description || "No description",
    readme: keyFiles["README.md"] || keyFiles["readme.md"] || keyFiles["README"] || null,
    packageJson: keyFiles["package.json"] || null,
    language: repoData.language || "Unknown",
    languages,
    topics: repoData.topics || [],
    homepage: repoData.homepage,
    tree: tree.map((f) => ({ path: f.path, type: f.type })),
    stars: repoData.stars,
    forks: repoData.forks,
    license: repoData.license,
  });

  const mermaid = generateMermaidDiagram(tree);
  const cursedFiles = detectCursedFiles(tree, commits);
  const contributors = processContributors(rawContributors);
  const envVars = detectEnvVars(tree, keyFiles);
  const endpoints = detectEndpoints(tree);
  const readmeScore = scoreReadme(keyFiles["README.md"] || keyFiles["readme.md"] || keyFiles["README"] || null);
  const devcontainer = generateDevcontainer(repoFullName, tree, keyFiles);

  // Determine status
  const lastCommit = commits[0];
  const daysSinceCommit = lastCommit
    ? Math.floor((Date.now() - new Date(lastCommit.date).getTime()) / 86400000)
    : 999;

  let status = "";
  if (daysSinceCommit === 0) status = "Very Active — commits today";
  else if (daysSinceCommit <= 7) status = "Active — updated this week";
  else if (daysSinceCommit <= 30) status = "Maintained — updated this month";
  else if (daysSinceCommit <= 180) status = "Slow — last update months ago";
  else status = "Inactive — no recent updates";

  // PHASE 3: Run API-dependent tasks in parallel
  const [tribalKnowledge, firstIssues, claudeAnalysis] = await Promise.all([
    extractTribalKnowledge(owner, repo, commits, token).catch(() => "Unable to extract development insights."),
    getFirstGoodIssues(owner, repo, token).catch(() => ["No beginner-friendly issues found."]),
    analyzeCodebaseWithClaude(repoFullName, tree, commits).catch(() => ""),
  ]);

  // PHASE 4: Generate voice
  const voiceText = generateVoiceScript(
    {
      fullName: repoFullName,
      description: repoData.description || "No description",
      language: repoData.language || "Unknown",
      purpose: explanation.whatItDoes,
      status,
      summary: explanation.whyItExists,
      darkSecrets: tribalKnowledge,
      fileTree: tree.map((f) => f.path),
      stars: repoData.stars,
      framework: null,
      techStack: explanation.techStack,
      features: explanation.keyComponents,
    },
    voiceMode
  );

  const voiceUrl = await generateVoice(voiceText, voiceMode as any).catch(() => "");

  // Commit frequency (last 100 commits by week)
  const commitFrequency: Record<string, number> = {};
  commits.forEach((c) => {
    const date = new Date(c.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split("T")[0];
    commitFrequency[key] = (commitFrequency[key] || 0) + 1;
  });

  const result = {
    repoFullName,
    description: repoData.description || "No description",
    whatItDoes: explanation.whatItDoes,
    whyItExists: explanation.whyItExists,
    whoItsFor: explanation.whoItsFor,
    howToGetStarted: explanation.howToGetStarted,
    keyComponents: explanation.keyComponents,
    detectedTechStack: explanation.techStack,
    status,
    voiceUrl,
    voiceText,
    voiceMode,
    mermaid,
    fileTree: tree
      .filter((f) => !f.path.toLowerCase().endsWith(".map") && !f.path.toLowerCase().endsWith(".min.js"))
      .slice(0, 800)
      .map((f) => ({ path: f.path, type: f.type })),
    lastCommitDate: commits[0]?.date ? new Date(commits[0].date) : null,
    createdAt: new Date(repoData.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    }),
    language: repoData.language || "Unknown",
    languages,
    stars: repoData.stars,
    forks: repoData.forks,
    license: repoData.license,
    topics: repoData.topics || [],
    homepage: repoData.homepage,
    darkSecrets: tribalKnowledge,
    cursedFiles,
    contributors,
    envVars,
    endpoints,
    readmeScore,
    devcontainer: devcontainer.config,
    commitFrequency,
    firstIssues,
    claudeAnalysis,
    duration: ((Date.now() - start) / 1000).toFixed(1),
    codespaceUrl: `https://github.com/codespaces/new?repo=${owner}/${repo}&ref=${repoData.defaultBranch}`,
    fromCache: false,
  };

  // Cache the result
  setCache(cacheKey, result);

  return result;
}