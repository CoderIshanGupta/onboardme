// packages/ai/github.ts
import { Octokit } from "@octokit/rest";

export type FileTree = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

const createClient = (token?: string) => {
  // Priority: user's OAuth token > server-side PAT > unauthenticated
  const authToken = token || process.env.GITHUB_TOKEN;
  return new Octokit(authToken ? { auth: authToken } : undefined);
};

export async function fetchRepoData(owner: string, repo: string, token?: string) {
  const octo = createClient(token);
  const { data } = await octo.repos.get({ owner, repo });

  return {
    fullName: data.full_name,
    description: data.description || "No description",
    stars: data.stargazers_count,
    forks: data.forks_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    defaultBranch: data.default_branch,
    size: data.size,
    language: data.language,
    openIssues: data.open_issues_count,
    license: data.license?.name || "None",
    topics: data.topics || [],
    homepage: data.homepage || null,
  };
}

export async function fetchRepoTree(owner: string, repo: string, token?: string) {
  const octo = createClient(token);
  const { data: repoData } = await octo.repos.get({ owner, repo });

  const { data: treeData } = await octo.git.getTree({
    owner,
    repo,
    tree_sha: repoData.default_branch,
    recursive: "true",
  });

  const allFiles = treeData.tree as FileTree[];

  const hardIgnore = [
    /node_modules\//,
    /\.git\//,
    /\.next\//,
    /\.turbo\//,
    /\.cache\//,
    /__pycache__\//,
    /\.DS_Store/,
  ];

  const filtered = allFiles.filter(
    (f) => !hardIgnore.some((p) => p.test(f.path))
  );

  return filtered.slice(0, 1000);
}

export async function fetchCommits(
  owner: string,
  repo: string,
  token?: string,
  limit = 100,
) {
  const octo = createClient(token);

  const { data } = await octo.repos.listCommits({
    owner,
    repo,
    per_page: Math.min(limit, 100),
    page: 1,
  });

  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author?.name || "Unknown",
    date: c.commit.author?.date || "",
    timeOfDay: new Date(c.commit.author?.date || "").getHours(),
  }));
}

// NEW: Fetch key files to understand what the repo actually does
export async function fetchKeyFiles(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, string>> {
  const octo = createClient(token);
  const keyFiles: Record<string, string> = {};

  const filesToFetch = [
    "README.md",
    "readme.md",
    "README",
    "package.json",
    ".env.example",
    ".env.local.example",
    ".env.template",
    ".env.sample",
    "Cargo.toml",
    "go.mod",
    "pyproject.toml",
    "setup.py",
    "requirements.txt",
    "pom.xml",
    "build.gradle",
    "Makefile",
    "docker-compose.yml",
    "docker-compose.yaml",
  ];

  // Fetch files in parallel with individual error handling
  const results = await Promise.allSettled(
    filesToFetch.map(async (path) => {
      try {
        const { data } = await octo.repos.getContent({
          owner,
          repo,
          path,
        });

        if ("content" in data && data.content) {
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          // Limit content size to save processing time
          return { path, content: content.slice(0, 5000) };
        }
      } catch {
        // File doesn't exist — that's fine
      }
      return null;
    })
  );

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      keyFiles[result.value.path] = result.value.content;
    }
  });

  return keyFiles;
}

// NEW: Fetch languages breakdown
export async function fetchLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number>> {
  const octo = createClient(token);
  try {
    const { data } = await octo.repos.listLanguages({ owner, repo });
    return data;
  } catch {
    return {};
  }
}

// Add this to packages/ai/github.ts

export async function fetchContributors(
  owner: string,
  repo: string,
  token?: string
): Promise<{
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}[]> {
  const octo = createClient(token);

  try {
    const { data } = await octo.repos.listContributors({
      owner,
      repo,
      per_page: 10,
    });

    return data
      .filter((c) => c.login && c.type === "User") // Exclude bots
      .map((c) => ({
        login: c.login || "unknown",
        avatarUrl: c.avatar_url || "",
        profileUrl: c.html_url || `https://github.com/${c.login}`,
        contributions: c.contributions || 0,
      }));
  } catch {
    return [];
  }
}