// packages/ai/contributors.ts

export interface ContributorData {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  percentage: number;
  rank: number;
}

export function processContributors(
  githubContributors: {
    login: string;
    avatarUrl: string;
    profileUrl: string;
    contributions: number;
  }[]
): ContributorData[] {
  if (githubContributors.length === 0) return [];

  const total = githubContributors.reduce((sum, c) => sum + c.contributions, 0);

  return githubContributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 10)
    .map((c, i) => ({
      ...c,
      percentage: Math.round((c.contributions / total) * 100),
      rank: i + 1,
    }));
}