// packages/ai/tribal.ts
import { Octokit } from "@octokit/rest";

export async function extractTribalKnowledge(
  owner: string,
  repo: string,
  commits: any[],
  token?: string
): Promise<string> {
  const octo = token || process.env.GITHUB_TOKEN
    ? new Octokit({ auth: token || process.env.GITHUB_TOKEN })
    : new Octokit();

  const insights: string[] = [];
  const totalCommits = commits.length;

  if (totalCommits === 0) {
    return "No commit data available for analysis.";
  }

  // ============================================
  // 1. COMMIT TIMING ANALYSIS
  // ============================================
  const lateNight = commits.filter((c) => c.timeOfDay >= 22 || c.timeOfDay <= 5);
  const earlyMorning = commits.filter((c) => c.timeOfDay >= 5 && c.timeOfDay <= 8);
  const businessHours = commits.filter((c) => c.timeOfDay >= 9 && c.timeOfDay <= 17);
  const evening = commits.filter((c) => c.timeOfDay >= 18 && c.timeOfDay <= 21);

  if (lateNight.length > totalCommits * 0.15) {
    insights.push(
      `${Math.round((lateNight.length / totalCommits) * 100)}% of commits occur between 10 PM and 5 AM, indicating significant after-hours development`
    );
  }

  if (businessHours.length > totalCommits * 0.7) {
    insights.push(
      "Most development happens during standard business hours (9 AM - 5 PM), suggesting a professional team with structured work hours"
    );
  }

  // ============================================
  // 2. COMMIT MESSAGE ANALYSIS
  // ============================================
  const fixCommits = commits.filter((c) =>
    /^fix[\s:(]/i.test(c.message)
  );
  const featCommits = commits.filter((c) =>
    /^feat[\s:(]/i.test(c.message)
  );
  const refactorCommits = commits.filter((c) =>
    /^refactor[\s:(]/i.test(c.message)
  );
  const docsCommits = commits.filter((c) =>
    /^docs[\s:(]/i.test(c.message)
  );
  const choreCommits = commits.filter((c) =>
    /^chore[\s:(]/i.test(c.message)
  );

  // Check if they use conventional commits
  const conventionalCount = fixCommits.length + featCommits.length + refactorCommits.length + docsCommits.length + choreCommits.length;
  if (conventionalCount > totalCommits * 0.5) {
    insights.push(
      "The team follows conventional commit standards, indicating structured development practices"
    );
  }

  if (fixCommits.length > totalCommits * 0.3) {
    insights.push(
      `${Math.round((fixCommits.length / totalCommits) * 100)}% of commits are bug fixes, suggesting the project is in a maintenance/stabilization phase`
    );
  }

  if (featCommits.length > totalCommits * 0.3) {
    insights.push(
      `${Math.round((featCommits.length / totalCommits) * 100)}% of commits introduce new features, indicating active feature development`
    );
  }

  if (refactorCommits.length > totalCommits * 0.1) {
    insights.push(
      "Regular refactoring commits show the team invests in code quality and technical debt reduction"
    );
  }

  // Urgent/emergency commits
  const urgentCommits = commits.filter((c) =>
    /urgent|emergency|critical|hotfix|hot-fix|asap|breaking/i.test(c.message)
  );

  if (urgentCommits.length > 3) {
    insights.push(
      `${urgentCommits.length} emergency/hotfix commits in recent history — there have been production incidents requiring immediate attention`
    );
  }

  // Revert commits
  const revertCommits = commits.filter((c) =>
    /^revert/i.test(c.message)
  );

  if (revertCommits.length > 2) {
    insights.push(
      `${revertCommits.length} reverted commits suggest some changes didn't work as expected and needed to be rolled back`
    );
  }

  // ============================================
  // 3. WEEKEND ANALYSIS
  // ============================================
  const weekendCommits = commits.filter((c) => {
    const day = new Date(c.date).getDay();
    return day === 0 || day === 6;
  });

  if (weekendCommits.length > totalCommits * 0.2) {
    insights.push(
      `${Math.round((weekendCommits.length / totalCommits) * 100)}% of commits are on weekends — this team ships on their own time`
    );
  } else if (weekendCommits.length === 0) {
    insights.push(
      "No weekend commits — the team maintains healthy work-life boundaries"
    );
  }

  // ============================================
  // 4. CONTRIBUTOR CONCENTRATION
  // ============================================
  const authorCounts = new Map<string, number>();
  commits.forEach((c) => {
    authorCounts.set(c.author, (authorCounts.get(c.author) || 0) + 1);
  });

  const sortedAuthors = Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1]);

  if (sortedAuthors.length > 0) {
    const topAuthorPct = Math.round((sortedAuthors[0][1] / totalCommits) * 100);

    if (sortedAuthors.length === 1) {
      insights.push(`Solo developer project — all commits are from ${sortedAuthors[0][0]}`);
    } else if (topAuthorPct > 80) {
      insights.push(
        `${sortedAuthors[0][0]} accounts for ${topAuthorPct}% of commits — the project has a strong bus factor risk (over-reliance on one contributor)`
      );
    } else if (sortedAuthors.length > 10) {
      insights.push(
        `Distributed development with ${sortedAuthors.length} contributors — no single point of failure`
      );
    }
  }

  // ============================================
  // 5. COMMIT FREQUENCY
  // ============================================
  if (commits.length >= 2) {
    const newest = new Date(commits[0].date).getTime();
    const oldest = new Date(commits[commits.length - 1].date).getTime();
    const daySpan = Math.max(1, (newest - oldest) / 86400000);
    const commitsPerDay = totalCommits / daySpan;

    if (commitsPerDay > 5) {
      insights.push(
        `Very high commit velocity at ${Math.round(commitsPerDay)} commits per day — this project moves fast`
      );
    } else if (commitsPerDay > 1) {
      insights.push(
        `Healthy commit velocity averaging ${commitsPerDay.toFixed(1)} commits per day`
      );
    } else if (commitsPerDay < 0.1) {
      insights.push(
        "Low commit frequency — development activity is sporadic or the project is mature"
      );
    }
  }

  // ============================================
  // 6. PR ANALYSIS (if possible)
  // ============================================
  try {
    const { data: prs } = await octo.pulls.list({
      owner,
      repo,
      state: "closed",
      per_page: 20,
      sort: "updated",
      direction: "desc",
    });

    const mergedPRs = prs.filter((pr) => pr.merged_at);
    const longRunning = mergedPRs.filter((pr) => {
      if (!pr.created_at || !pr.merged_at) return false;
      const days = (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / 86400000;
      return days > 7;
    });

    if (mergedPRs.length > 0) {
      const avgMergeDays = mergedPRs.reduce((sum, pr) => {
        if (!pr.created_at || !pr.merged_at) return sum;
        return sum + (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / 86400000;
      }, 0) / mergedPRs.length;

      if (avgMergeDays < 1) {
        insights.push("PRs are merged quickly (under 24 hours on average), suggesting efficient review processes");
      } else if (avgMergeDays > 7) {
        insights.push(
          `PRs take an average of ${Math.round(avgMergeDays)} days to merge — thorough review process or potential bottleneck`
        );
      }
    }

    if (longRunning.length > 5) {
      insights.push(
        `${longRunning.length} PRs took over a week to merge, which may indicate complex features or review bottlenecks`
      );
    }
  } catch {
    // Rate limited or private — skip
  }

  // ============================================
  // FINAL RESULT
  // ============================================
  if (insights.length === 0) {
    return "The repository has a clean and well-organized development history. Commit patterns suggest a structured and professional development process.";
  }

  return insights.join(". ") + ".";
}