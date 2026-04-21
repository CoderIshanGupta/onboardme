// packages/voice/script.ts

interface RepoData {
  fullName: string;
  description: string;
  language: string;
  stars?: number;
  purpose: string; // Now contains whatItDoes from README
  status: string;
  summary?: string; // Now contains whyItExists
  darkSecrets: string;
  fileTree: string[];
  framework?: string | null;
  techStack?: string[];
  features?: string[];
}

export function generateVoiceScript(data: RepoData, mode: string = "professional"): string {
  const {
    fullName,
    description,
    language,
    purpose,
    status,
    summary,
    darkSecrets,
    fileTree,
    stars,
    techStack = [],
    features = [],
  } = data;

  const sections: string[] = [];

  // Introduction
  const intros: Record<string, string> = {
    professional: `Welcome to the overview of ${fullName}.`,
    technical: `Technical overview for ${fullName}.`,
    beginner: `Let me walk you through ${fullName} step by step.`,
    casual: `Let's take a look at ${fullName}.`,
    brutal: `Here's ${fullName}. Let's get to it.`,
  };

  sections.push(intros[mode] || intros.professional);

  // What it does (from README)
  if (purpose && purpose.length > 20) {
    sections.push(purpose);
  } else if (description && description !== "No description") {
    sections.push(description);
  }

  // Why it exists
  if (summary && summary.length > 20) {
    sections.push(summary);
  }

  // Tech stack
  if (techStack.length > 0) {
    sections.push(`The technology stack includes ${techStack.slice(0, 5).join(", ")}.`);
  }

  // Key components
  if (features.length > 0) {
    sections.push(`Key components include ${features.slice(0, 4).join(", ")}.`);
  }

  // Status and activity
  sections.push(`Current status: ${status}.`);

  // Stars context
  if (stars && stars > 10000) {
    sections.push(
      `With over ${Math.floor(stars / 1000)}k stars, this is a well-established project in the community.`
    );
  } else if (stars && stars > 1000) {
    sections.push(`The project has ${stars.toLocaleString()} stars and growing.`);
  }

  // Development insights (cleaned up)
  if (darkSecrets && !darkSecrets.includes("Unable to") && !darkSecrets.includes("clean and straightforward")) {
    sections.push(`Development insights: ${darkSecrets}`);
  }

  // Outro
  const outros: Record<string, string> = {
    professional: "For detailed setup instructions, refer to the Getting Started section below.",
    technical: "Review the architecture diagram and project structure for deeper understanding.",
    beginner: "Start with the README file and explore the project structure to get familiar with the codebase.",
    casual: "Check out the project structure and dive in whenever you're ready.",
    brutal: "Everything you need is below. Start reading.",
  };

  sections.push(outros[mode] || outros.professional);

  return sections.join(" ");
}