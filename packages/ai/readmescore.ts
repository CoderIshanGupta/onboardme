// packages/ai/readmescore.ts

interface ReadmeScore {
  total: number;
  maxScore: number;
  grade: string;
  checks: { name: string; passed: boolean; points: number; tip: string }[];
}

export function scoreReadme(readmeContent: string | null): ReadmeScore {
  const checks: { name: string; passed: boolean; points: number; tip: string }[] = [];

  if (!readmeContent) {
    return {
      total: 0,
      maxScore: 100,
      grade: "F",
      checks: [{ name: "README exists", passed: false, points: 0, tip: "Add a README.md file" }],
    };
  }

  const content = readmeContent.toLowerCase();
  const lines = readmeContent.split("\n");

  // Check 1: Has title (10pts)
  const hasTitle = lines.some((l) => l.startsWith("# "));
  checks.push({
    name: "Has a title",
    passed: hasTitle,
    points: hasTitle ? 10 : 0,
    tip: "Add a # Title at the top",
  });

  // Check 2: Has description (15pts)
  const hasDescription = content.length > 100;
  checks.push({
    name: "Has a description",
    passed: hasDescription,
    points: hasDescription ? 15 : 0,
    tip: "Add a paragraph explaining what the project does",
  });

  // Check 3: Has installation instructions (15pts)
  const hasInstall = /install|setup|getting started|quick start/i.test(content);
  checks.push({
    name: "Installation instructions",
    passed: hasInstall,
    points: hasInstall ? 15 : 0,
    tip: "Add a Getting Started or Installation section",
  });

  // Check 4: Has usage examples (10pts)
  const hasUsage = /usage|example|demo|how to use/i.test(content);
  checks.push({
    name: "Usage examples",
    passed: hasUsage,
    points: hasUsage ? 10 : 0,
    tip: "Add code examples showing how to use the project",
  });

  // Check 5: Has code blocks (10pts)
  const hasCodeBlocks = content.includes("```");
  checks.push({
    name: "Code snippets",
    passed: hasCodeBlocks,
    points: hasCodeBlocks ? 10 : 0,
    tip: "Add code blocks with examples",
  });

  // Check 6: Has badges (5pts)
  const hasBadges = content.includes("badge") || content.includes("shields.io") || content.includes("![");
  checks.push({
    name: "Badges",
    passed: hasBadges,
    points: hasBadges ? 5 : 0,
    tip: "Add status badges (build, coverage, npm version)",
  });

  // Check 7: Has contributing guide (10pts)
  const hasContributing = /contribut/i.test(content);
  checks.push({
    name: "Contributing guidelines",
    passed: hasContributing,
    points: hasContributing ? 10 : 0,
    tip: "Add a Contributing section",
  });

  // Check 8: Has license mention (5pts)
  const hasLicense = /license/i.test(content);
  checks.push({
    name: "License information",
    passed: hasLicense,
    points: hasLicense ? 5 : 0,
    tip: "Mention the license",
  });

  // Check 9: Has links (5pts)
  const hasLinks = content.includes("](http") || content.includes("](https");
  checks.push({
    name: "External links",
    passed: hasLinks,
    points: hasLinks ? 5 : 0,
    tip: "Add links to docs, demos, or related resources",
  });

  // Check 10: Good length (10pts)
  const goodLength = content.length > 500 && content.length < 50000;
  checks.push({
    name: "Appropriate length",
    passed: goodLength,
    points: goodLength ? 10 : 0,
    tip: content.length < 500 ? "README is too short" : "README might be too long",
  });

  // Check 11: Has table of contents (5pts)
  const hasTOC = /table of contents|toc/i.test(content) || (lines.filter((l) => l.startsWith("## ")).length > 4);
  checks.push({
    name: "Table of contents",
    passed: hasTOC,
    points: hasTOC ? 5 : 0,
    tip: "Add a table of contents for long READMEs",
  });

  const total = checks.reduce((sum, c) => sum + c.points, 0);
  const maxScore = 100;

  let grade = "F";
  if (total >= 90) grade = "A+";
  else if (total >= 80) grade = "A";
  else if (total >= 70) grade = "B";
  else if (total >= 60) grade = "C";
  else if (total >= 40) grade = "D";

  return { total, maxScore, grade, checks };
}