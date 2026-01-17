// packages/ai/github.ts
import { Octokit } from "@octokit/rest";

export type FileTree = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

const createClient = (token?: string) => {
  // If user is logged in, we use their GitHub access token (from next-auth)
  // If not, we call the API unauthenticated (60 req/hour/IP for public repos)
  return new Octokit(token ? { auth: token } : undefined);
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
    size: data.size, // KB
    language: data.language,
    openIssues: data.open_issues_count,
    license: data.license?.name || "None",
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

  return treeData.tree as FileTree[];
}

export async function fetchCommits(
  owner: string,
  repo: string,
  token?: string,
  limit = 200,
) {
  const octo = createClient(token);

  const { data } = await octo.repos.listCommits({
    owner,
    repo,
    per_page: Math.min(limit, 100),
    page: 1,
  });

  return data.map(c => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author?.name || "Unknown",
    date: c.commit.author?.date || "",
    timeOfDay: new Date(c.commit.author?.date || "").getHours(),
  }));
}