// packages/ai/issues.ts
import { Octokit } from "@octokit/rest";

export async function getFirstGoodIssues(
  owner: string,
  repo: string,
  token?: string
): Promise<string[]> {
  const octo = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    const { data } = await octo.issues.listForRepo({
      owner,
      repo,
      state: "open",
      labels: "good first issue,help wanted,beginner-friendly",
      per_page: 3,
      sort: "created",
      direction: "desc",
    });

    return data.map(issue => `#${issue.number}: ${issue.title} (${issue.html_url})`);
  } catch (e) {
    return ["No good first issues found (this repo gatekeeps newbies)"];
  }
}