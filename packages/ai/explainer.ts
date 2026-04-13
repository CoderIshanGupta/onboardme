// packages/ai/explainer.ts

interface ExplainerInput {
    repoName: string;
    description: string;
    readme: string | null;
    packageJson: string | null;
    language: string;
    languages: Record<string, number>;
    topics: string[];
    homepage: string | null;
    tree: { path: string; type: string }[];
    stars: number;
    forks: number;
    license: string;
}

export function generateRepoExplanation(input: ExplainerInput): {
    whatItDoes: string;
    whyItExists: string;
    whoItsFor: string;
    howToGetStarted: string;
    keyComponents: string[];
    techStack: string[];
} {
    const {
        repoName,
        description,
        readme,
        packageJson,
        language,
        languages,
        topics,
        homepage,
        tree,
        stars,
        forks,
        license,
    } = input;

    const paths = tree.map((f) => f.path.toLowerCase());

    // ============================================
    // DETECT PROJECT TYPE & FRAMEWORK
    // ============================================
    const projectInfo = detectProjectType(paths, packageJson);

    // ============================================
    // 1. WHAT IT DOES
    // ============================================
    let whatItDoes = "";

    if (readme) {
        whatItDoes = extractFirstParagraph(readme);
    }

    if (!whatItDoes || whatItDoes.length < 30) {
        if (description && description !== "No description") {
            whatItDoes = description;
        }
    }

    // Enrich with detected info
    if (whatItDoes && whatItDoes.length < 100) {
        const enrichment = buildEnrichment(projectInfo, language);
        if (enrichment) {
            whatItDoes += ". " + enrichment;
        }
    }

    if (!whatItDoes || whatItDoes.length < 20) {
        whatItDoes = buildFallbackDescription(projectInfo, language, repoName);
    }

    whatItDoes = cleanMarkdown(whatItDoes);

    // ============================================
    // 2. WHY IT EXISTS
    // ============================================
    let whyItExists = "";

    if (readme) {
        // Try multiple section headers
        const whySections = [
            "why", "motivation", "about", "overview", "introduction",
            "background", "problem", "goals", "purpose", "philosophy",
        ];

        for (const section of whySections) {
            const extracted = extractSection(readme, section);
            if (extracted && extracted.length > 40) {
                whyItExists = cleanMarkdown(extracted);
                break;
            }
        }
    }

    if (!whyItExists || whyItExists.length < 30) {
        whyItExists = generateWhyFromContext(
            description,
            projectInfo,
            language,
            stars,
            forks,
            topics,
            readme
        );
    }

    // ============================================
    // 3. WHO IT'S FOR
    // ============================================
    let whoItsFor = "";

    if (readme) {
        const whoSections = ["who", "audience", "for whom", "target", "users"];
        for (const section of whoSections) {
            const extracted = extractSection(readme, section);
            if (extracted && extracted.length > 30) {
                whoItsFor = cleanMarkdown(extracted);
                break;
            }
        }
    }

    if (!whoItsFor || whoItsFor.length < 30) {
        whoItsFor = generateWhoFromContext(
            projectInfo,
            language,
            topics,
            description,
            readme
        );
    }

    // ============================================
    // 4. HOW TO GET STARTED
    // ============================================
    let howToGetStarted = "";

    if (readme) {
        const startSections = [
            "getting started", "installation", "setup", "quick start",
            "usage", "install", "development", "running locally",
            "local development", "run locally", "quickstart",
        ];

        for (const section of startSections) {
            const extracted = extractSection(readme, section, true);
            if (extracted && extracted.length > 30) {
                howToGetStarted = extracted.slice(0, 1000);
                break;
            }
        }
    }

    // If README didn't have clear instructions, build from package.json
    if (!howToGetStarted || howToGetStarted.length < 30) {
        howToGetStarted = buildSetupInstructions(paths, packageJson, projectInfo, language);
    }

    // ============================================
    // 5. KEY COMPONENTS
    // ============================================
    const keyComponents = detectKeyComponents(paths);

    // ============================================
    // 6. TECH STACK
    // ============================================
    const techStack = detectTechStack(paths, packageJson, languages, language);

    return {
        whatItDoes,
        whyItExists,
        whoItsFor,
        howToGetStarted,
        keyComponents,
        techStack,
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ProjectInfo {
    type: string;
    framework: string | null;
    isMonorepo: boolean;
    isLibrary: boolean;
    isApp: boolean;
    isCLI: boolean;
    isAPI: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasCI: boolean;
    packageManager: string | null;
    scripts: Record<string, string>;
}

function detectProjectType(paths: string[], packageJson: string | null): ProjectInfo {
    const info: ProjectInfo = {
        type: "Software Project",
        framework: null,
        isMonorepo: false,
        isLibrary: false,
        isApp: false,
        isCLI: false,
        isAPI: false,
        hasTests: false,
        hasDocker: false,
        hasCI: false,
        packageManager: null,
        scripts: {},
    };

    // Framework detection
    if (paths.some((p) => p.includes("next.config"))) { info.framework = "Next.js"; info.type = "Full-Stack Web Application"; }
    else if (paths.some((p) => p.includes("nuxt.config"))) { info.framework = "Nuxt.js"; info.type = "Full-Stack Web Application"; }
    else if (paths.some((p) => p.includes("remix.config") || p.includes("remix.env"))) { info.framework = "Remix"; info.type = "Full-Stack Web Application"; }
    else if (paths.some((p) => p.includes("astro.config"))) { info.framework = "Astro"; info.type = "Web Application"; }
    else if (paths.some((p) => p.includes("vite.config"))) { info.framework = "Vite"; info.type = "Frontend Application"; }
    else if (paths.some((p) => p.includes("angular.json"))) { info.framework = "Angular"; info.type = "Frontend Application"; }
    else if (paths.some((p) => p.includes("svelte.config"))) { info.framework = "SvelteKit"; info.type = "Web Application"; }
    else if (paths.some((p) => p === "cargo.toml")) { info.type = "Rust Project"; }
    else if (paths.some((p) => p === "go.mod")) { info.type = "Go Project"; }
    else if (paths.some((p) => p === "pyproject.toml" || p === "setup.py")) { info.type = "Python Project"; }

    // Structure detection
    info.isMonorepo = paths.some((p) => p.startsWith("packages/") || p.startsWith("apps/") || p === "pnpm-workspace.yaml" || p === "lerna.json");
    info.isLibrary = paths.some((p) => p.includes("dist/") || p.includes("lib/index") || (paths.includes("package.json") && !paths.some((pp) => pp.includes("app/") || pp.includes("pages/"))));
    info.isApp = paths.some((p) => p.includes("app/") || p.includes("pages/") || p.includes("src/main"));
    info.isCLI = paths.some((p) => p.includes("bin/") || p.includes("cli"));
    info.isAPI = paths.some((p) => p.includes("api/") || p.includes("routes/") || p.includes("server/"));
    info.hasTests = paths.some((p) => p.includes("test") || p.includes("spec") || p.includes("__tests__"));
    info.hasDocker = paths.some((p) => p.includes("dockerfile") || p.includes("docker-compose"));
    info.hasCI = paths.some((p) => p.includes(".github/workflows") || p.includes(".circleci") || p.includes(".travis"));

    // Package manager
    if (paths.includes("pnpm-lock.yaml") || paths.includes("pnpm-workspace.yaml")) info.packageManager = "pnpm";
    else if (paths.includes("yarn.lock")) info.packageManager = "yarn";
    else if (paths.includes("bun.lockb")) info.packageManager = "bun";
    else if (paths.includes("package-lock.json")) info.packageManager = "npm";

    // Parse scripts from package.json
    if (packageJson) {
        try {
            const pkg = JSON.parse(packageJson);
            info.scripts = pkg.scripts || {};
        } catch { }
    }

    if (info.isMonorepo) info.type = "Monorepo";

    return info;
}

function extractFirstParagraph(readme: string): string {
    const lines = readme.split("\n");
    const paragraphs: string[] = [];
    let currentParagraph = "";
    let passedTitle = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip title, badges, images, empty lines at start
        if (!passedTitle) {
            if (trimmed.startsWith("# ")) { passedTitle = true; continue; }
            if (trimmed.startsWith("![") || trimmed.startsWith("<img") || trimmed.startsWith("<p") ||
                trimmed.startsWith("<div") || trimmed.startsWith("[![") || trimmed.startsWith("<a") ||
                trimmed.startsWith("---") || trimmed.startsWith("===") || trimmed.length === 0) {
                continue;
            }
            passedTitle = true;
        }

        // Skip badges, images, HTML tags, headers after title
        if (trimmed.startsWith("![") || trimmed.startsWith("<img") || trimmed.startsWith("<br") ||
            trimmed.startsWith("[![") || trimmed.startsWith("<p align") || trimmed.startsWith("<div") ||
            trimmed.startsWith("---") || trimmed.startsWith("===") || trimmed.startsWith("```") ||
            trimmed.startsWith("|") || trimmed.match(/^#{2,}\s/)) {

            if (currentParagraph.length > 30) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = "";
            }
            if (paragraphs.length >= 2) break;
            continue;
        }

        if (trimmed.length === 0) {
            if (currentParagraph.length > 30) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = "";
            }
            if (paragraphs.length >= 2) break;
            continue;
        }

        currentParagraph += " " + trimmed;
    }

    if (currentParagraph.length > 30) {
        paragraphs.push(currentParagraph.trim());
    }

    const result = paragraphs.slice(0, 2).join(" ").trim();

    // Extract up to 3 sentences
    const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
    return sentences.slice(0, 3).join(" ").trim();
}

function extractSection(readme: string, sectionName: string, keepFormatting: boolean = false): string | null {
    // Match section headers like ## Getting Started, ### Installation, etc.
    const regex = new RegExp(
        `(?:^|\\n)#{1,4}\\s*(?:${sectionName})[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,4}\\s|$)`,
        "i"
    );

    const match = readme.match(regex);
    if (!match || !match[1]) return null;

    let content = match[1].trim();

    if (!keepFormatting) {
        // Clean up for text display
        content = content
            .split("\n")
            .filter((l) => {
                const t = l.trim();
                return t.length > 0 && !t.startsWith("<!--") && !t.startsWith("<img");
            })
            .slice(0, 8)
            .join(" ")
            .trim();
    } else {
        // Keep formatting but limit length
        content = content
            .split("\n")
            .filter((l) => !l.trim().startsWith("<!--"))
            .slice(0, 15)
            .join("\n")
            .trim();
    }

    return content.length > 20 ? content : null;
}

function cleanMarkdown(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
        .replace(/`([^`]+)`/g, "$1") // `code` → code
        .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold
        .replace(/\*([^*]+)\*/g, "$1") // *italic* → italic
        .replace(/~~([^~]+)~~/g, "$1") // ~~strike~~ → strike
        .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
        .replace(/<[^>]+>/g, "") // Remove HTML tags
        .replace(/\s+/g, " ")
        .trim();
}

function buildEnrichment(info: ProjectInfo, language: string): string {
    const parts: string[] = [];

    if (info.framework) parts.push(`Built with ${info.framework}`);
    if (info.isMonorepo) parts.push("organized as a monorepo");
    if (info.isCLI) parts.push("includes a CLI interface");
    if (info.isAPI) parts.push("provides API endpoints");

    return parts.length > 0 ? parts.join(", ") : "";
}

function buildFallbackDescription(info: ProjectInfo, language: string, repoName: string): string {
    let desc = `${repoName} is a ${info.type.toLowerCase()}`;

    if (info.framework) desc += ` built with ${info.framework}`;
    if (language) desc += ` using ${language}`;
    desc += ".";

    if (info.isMonorepo) desc += " It uses a monorepo architecture with multiple packages.";
    if (info.isCLI) desc += " It provides a command-line interface.";
    if (info.isAPI) desc += " It includes API endpoints.";
    if (info.isLibrary) desc += " It's designed to be used as a dependency in other projects.";

    return desc;
}

function generateWhyFromContext(
    description: string,
    info: ProjectInfo,
    language: string,
    stars: number,
    forks: number,
    topics: string[],
    readme: string | null
): string {
    const reasons: string[] = [];

    // Extract purpose from description
    if (description && description !== "No description" && description.length > 20) {
        // Check if description implies a problem being solved
        if (description.match(/\b(fast|simple|easy|lightweight|modern|alternative|replacement)\b/i)) {
            reasons.push(
                `This project was created as ${description.toLowerCase().startsWith("a ") || description.toLowerCase().startsWith("an ") ? "" : "a "}${description.toLowerCase()}.`
            );
        } else {
            reasons.push(`The project's goal: ${description}.`);
        }
    }

    // Community adoption
    if (stars > 50000) {
        reasons.push(`With ${stars.toLocaleString()} stars and ${forks.toLocaleString()} forks, this is one of the most popular ${language || "open source"} projects. It solves a fundamental problem that tens of thousands of developers face.`);
    } else if (stars > 10000) {
        reasons.push(`With ${stars.toLocaleString()} stars, this is a widely-adopted solution. The large community suggests it addresses a significant gap in the ${language || "developer"} ecosystem.`);
    } else if (stars > 1000) {
        reasons.push(`The project has gained meaningful adoption with ${stars.toLocaleString()} stars, indicating it provides real value to the developer community.`);
    } else if (stars > 100) {
        reasons.push(`A growing project with ${stars} stars, working to establish itself in the ${language || "developer"} ecosystem.`);
    }

    // From topics
    if (topics.length > 0) {
        const topicStr = topics.slice(0, 4).join(", ");
        reasons.push(`It's part of the ${topicStr} space.`);
    }

    // From project type
    if (info.isMonorepo) {
        reasons.push("The monorepo structure suggests this is a comprehensive solution with multiple interconnected packages.");
    }

    if (info.isCLI) {
        reasons.push("The CLI interface makes it accessible directly from the terminal, optimizing developer workflow.");
    }

    // Try to extract motivation from README content
    if (readme) {
        const motivationKeywords = [
            /(?:we built|created|designed|developed) (?:this|it) (?:to|because|for|as)/i,
            /(?:the goal|our goal|this project aims) (?:is|was) to/i,
            /(?:tired of|frustrated with|needed a|wanted a)/i,
        ];

        const readmeLines = readme.split("\n");
        for (const line of readmeLines) {
            for (const pattern of motivationKeywords) {
                if (pattern.test(line) && line.trim().length > 30 && line.trim().length < 300) {
                    reasons.push(cleanMarkdown(line.trim()));
                    break;
                }
            }
            if (reasons.length >= 3) break;
        }
    }

    if (reasons.length === 0) {
        return `This project addresses a specific need in the ${language || "software development"} space. Based on the codebase structure, it provides ${info.type === "Monorepo" ? "a comprehensive multi-package solution" : info.isLibrary ? "reusable functionality as a library" : info.isApp ? "a ready-to-deploy application" : "tooling for developers"}.`;
    }

    return reasons.join(" ");
}

function generateWhoFromContext(
    info: ProjectInfo,
    language: string,
    topics: string[],
    description: string,
    readme: string | null
): string {
    // PRIORITY 1: Extract from README — the ACTUAL target audience
    if (readme) {
        // Try to find audience-related sections
        const audienceSections = [
            "who is this for",
            "who it's for",
            "target audience",
            "intended for",
            "designed for",
            "built for",
            "users",
            "use cases",
            "features",
        ];

        for (const section of audienceSections) {
            const extracted = extractSection(readme, section);
            if (extracted && extracted.length > 30) {
                return cleanMarkdown(extracted);
            }
        }

        // Try to extract from the first few paragraphs of README
        // Look for sentences that describe who uses it
        const readmeLines = readme.split("\n");
        const audienceKeywords = [
            /(?:designed|built|made|created|intended|perfect|ideal|great) for\s+([^.]+)/i,
            /(?:helps?|enables?|allows?|empowers?)\s+([^.]+?)(?:\s+to\s+)/i,
            /(?:researchers?|developers?|engineers?|scientists?|teams?|companies|organizations?|students?|educators?|writers?|designers?|analysts?|publishers?|creators?|marketers?)[^.]*(?:can|will|use|benefit)/i,
            /(?:if you(?:'re| are)\s+(?:a |an )?[^,]+)/i,
            /(?:whether you(?:'re| are)\s+[^.]+)/i,
        ];

        for (const line of readmeLines) {
            const trimmed = line.trim();
            if (trimmed.length < 20 || trimmed.length > 500) continue;
            if (trimmed.startsWith("#") || trimmed.startsWith("!") || trimmed.startsWith("<")) continue;

            for (const pattern of audienceKeywords) {
                const match = trimmed.match(pattern);
                if (match) {
                    return cleanMarkdown(trimmed);
                }
            }
        }
    }

    // PRIORITY 2: Extract from description
    if (description && description !== "No description" && description.length > 15) {
        // Check if description mentions target users
        const descLower = description.toLowerCase();
        const userKeywords = [
            "researcher", "publisher", "scientist", "developer", "engineer",
            "designer", "writer", "student", "educator", "team", "company",
            "analyst", "marketer", "creator", "operator", "administrator",
            "business", "enterprise", "startup",
        ];

        const mentionedUsers = userKeywords.filter((k) => descLower.includes(k));
        if (mentionedUsers.length > 0) {
            return `Based on the project description, this is designed for ${mentionedUsers.join(", ")}s and professionals in related fields. ${description}`;
        }

        // If description explains what it does, derive the audience from that
        return `This project serves users who need ${description.toLowerCase()}. The target audience includes anyone working in this domain, regardless of their technical background.`;
    }

    // PRIORITY 3: From topics (but focus on USE CASE topics, not tech topics)
    const useCaseTopics = topics.filter((t) => {
        const lower = t.toLowerCase();
        // Filter OUT tech topics, keep domain topics
        const techTopics = [
            "javascript", "typescript", "python", "react", "nextjs", "nodejs",
            "tailwindcss", "prisma", "docker", "kubernetes", "rust", "go",
            "vue", "angular", "svelte", "css", "html", "api", "graphql",
        ];
        return !techTopics.includes(lower);
    });

    if (useCaseTopics.length > 0) {
        return `This project is relevant for professionals and teams working with ${useCaseTopics.slice(0, 4).join(", ")}. Check the project documentation for specific use cases and integration guides.`;
    }

    // PRIORITY 4: Generic but useful (based on what the project DOES, not what it's BUILT with)
    if (info.isLibrary) {
        return "This is a library/package designed to be integrated into other projects. Developers can install it as a dependency to add its functionality to their applications.";
    }

    if (info.isApp) {
        return "This is a standalone application designed for end users. It can be deployed and used directly to solve a specific problem or workflow.";
    }

    if (info.isCLI) {
        return "This is a command-line tool designed for developers and technical users who prefer terminal-based workflows.";
    }

    return "This project serves a specific user base. Review the project description and documentation for detailed information about target audience and use cases.";
}

function buildSetupInstructions(
    paths: string[],
    packageJson: string | null,
    info: ProjectInfo,
    language: string
): string {
    const steps: string[] = [];

    // Clone step
    steps.push("# Clone the repository");
    steps.push(`git clone https://github.com/OWNER/REPO.git`);
    steps.push("cd REPO");
    steps.push("");

    // Node.js projects
    if (paths.includes("package.json")) {
        steps.push("# Install dependencies");

        if (info.packageManager === "pnpm") {
            steps.push("pnpm install");
        } else if (info.packageManager === "yarn") {
            steps.push("yarn");
        } else if (info.packageManager === "bun") {
            steps.push("bun install");
        } else {
            steps.push("npm install");
        }
        steps.push("");

        // Add setup steps if env is needed
        if (paths.some((p) => p.includes(".env.example"))) {
            steps.push("# Set up environment variables");
            steps.push("cp .env.example .env.local");
            steps.push("# Edit .env.local with your values");
            steps.push("");
        }

        // Add dev command from scripts
        const pm = info.packageManager || "npm";
        const runCmd = pm === "npm" ? "npm run" : pm;

        if (info.scripts.dev) {
            steps.push("# Start development server");
            steps.push(`${runCmd} dev`);
        } else if (info.scripts.start) {
            steps.push("# Start the application");
            steps.push(`${runCmd} start`);
        } else if (info.scripts.serve) {
            steps.push("# Start the server");
            steps.push(`${runCmd} serve`);
        } else if (info.scripts.develop) {
            steps.push("# Start development");
            steps.push(`${runCmd} develop`);
        }

        // Show other useful scripts
        const usefulScripts = ["build", "test", "lint", "format"];
        const available = usefulScripts.filter((s) => info.scripts[s]);
        if (available.length > 0) {
            steps.push("");
            steps.push("# Other useful commands");
            available.forEach((s) => {
                steps.push(`${runCmd} ${s}`);
            });
        }

        return steps.join("\n");
    }

    // Python
    if (paths.some((p) => p.endsWith(".py"))) {
        steps.push("# Create virtual environment");
        steps.push("python -m venv venv");
        steps.push("source venv/bin/activate  # or venv\\Scripts\\activate on Windows");
        steps.push("");

        if (paths.includes("requirements.txt")) {
            steps.push("# Install dependencies");
            steps.push("pip install -r requirements.txt");
        } else if (paths.includes("pyproject.toml")) {
            steps.push("# Install dependencies");
            steps.push("pip install -e .");
        } else if (paths.includes("setup.py")) {
            steps.push("# Install dependencies");
            steps.push("pip install -e .");
        }

        if (paths.some((p) => p === "manage.py")) {
            steps.push("");
            steps.push("# Run Django development server");
            steps.push("python manage.py migrate");
            steps.push("python manage.py runserver");
        } else if (paths.some((p) => p.includes("app.py") || p.includes("main.py"))) {
            steps.push("");
            steps.push("# Run the application");
            steps.push("python main.py");
        }

        return steps.join("\n");
    }

    // Rust
    if (paths.includes("cargo.toml")) {
        steps.push("# Build the project");
        steps.push("cargo build");
        steps.push("");
        steps.push("# Run the project");
        steps.push("cargo run");
        steps.push("");
        steps.push("# Run tests");
        steps.push("cargo test");
        return steps.join("\n");
    }

    // Go
    if (paths.includes("go.mod")) {
        steps.push("# Download dependencies");
        steps.push("go mod download");
        steps.push("");
        steps.push("# Build");
        steps.push("go build ./...");
        steps.push("");
        steps.push("# Run");
        steps.push("go run .");
        return steps.join("\n");
    }

    // Docker
    if (info.hasDocker) {
        steps.push("# Run with Docker");
        if (paths.some((p) => p.includes("docker-compose"))) {
            steps.push("docker-compose up -d");
        } else {
            steps.push("docker build -t app .");
            steps.push("docker run -p 3000:3000 app");
        }
        return steps.join("\n");
    }

    // Generic fallback with actual useful info
    steps.push(`# This is a ${language || "software"} project`);
    steps.push("# Check the README.md for specific setup instructions");
    if (paths.some((p) => p.includes("makefile"))) {
        steps.push("");
        steps.push("# A Makefile is available:");
        steps.push("make help  # or just 'make'");
    }

    return steps.join("\n");
}

function detectKeyComponents(paths: string[]): string[] {
    const components: string[] = [];

    const componentMap: [string, string][] = [
        ["src/", "Source code"],
        ["app/", "Application entry"],
        ["pages/", "Page routes"],
        ["components/", "UI components"],
        ["lib/", "Shared libraries"],
        ["utils/", "Utility functions"],
        ["hooks/", "Custom hooks"],
        ["api/", "API layer"],
        ["server/", "Server-side logic"],
        ["services/", "Service modules"],
        ["middleware/", "Middleware"],
        ["models/", "Data models"],
        ["schema/", "Schema definitions"],
        ["prisma/", "Database (Prisma)"],
        ["migrations/", "Database migrations"],
        ["tests/", "Test suite"],
        ["__tests__/", "Test suite"],
        ["docs/", "Documentation"],
        ["scripts/", "Build/automation scripts"],
        ["config/", "Configuration"],
        ["public/", "Static assets"],
        ["styles/", "Stylesheets"],
        ["packages/", "Monorepo packages"],
        ["apps/", "Monorepo applications"],
        ["plugins/", "Plugin system"],
        ["core/", "Core module"],
        ["cli/", "CLI interface"],
        ["bin/", "CLI executables"],
        ["types/", "Type definitions"],
        ["store/", "State management"],
        ["context/", "React context providers"],
        ["graphql/", "GraphQL schema/resolvers"],
        ["workers/", "Background workers"],
        ["jobs/", "Background jobs"],
        ["email/", "Email templates"],
        ["i18n/", "Internationalization"],
        ["locales/", "Translations"],
    ];

    componentMap.forEach(([dir, label]) => {
        if (paths.some((p) => p.startsWith(dir) || p.includes(`/${dir}`))) {
            if (!components.includes(label)) {
                components.push(label);
            }
        }
    });

    return components;
}

function detectTechStack(
    paths: string[],
    packageJson: string | null,
    languages: Record<string, number>,
    language: string
): string[] {
    const techStack: string[] = [];

    // From languages API
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
    if (totalBytes > 0) {
        Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([lang, bytes]) => {
                const pct = Math.round((bytes / totalBytes) * 100);
                if (pct > 5) techStack.push(`${lang} (${pct}%)`);
            });
    }

    // Framework and tool detection from files
    const detectors: [string, string][] = [
        ["next.config", "Next.js"],
        ["nuxt.config", "Nuxt.js"],
        ["remix.config", "Remix"],
        ["astro.config", "Astro"],
        ["vite.config", "Vite"],
        ["angular.json", "Angular"],
        ["svelte.config", "SvelteKit"],
        ["tailwind", "Tailwind CSS"],
        ["prisma/", "Prisma"],
        ["drizzle", "Drizzle ORM"],
        ["dockerfile", "Docker"],
        [".github/workflows", "GitHub Actions"],
        ["jest.config", "Jest"],
        ["vitest", "Vitest"],
        ["cypress", "Cypress"],
        ["playwright", "Playwright"],
        [".storybook", "Storybook"],
        ["graphql", "GraphQL"],
        ["supabase", "Supabase"],
        ["firebase", "Firebase"],
        ["turbo.json", "Turborepo"],
        ["nx.json", "Nx"],
        ["webpack", "Webpack"],
        ["rollup", "Rollup"],
        ["esbuild", "esbuild"],
    ];

    detectors.forEach(([pattern, name]) => {
        if (paths.some((p) => p.includes(pattern)) && !techStack.includes(name)) {
            techStack.push(name);
        }
    });

    // From package.json dependencies
    if (packageJson) {
        try {
            const pkg = JSON.parse(packageJson);
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (!allDeps) return techStack;

            const depDetectors: [string, string][] = [
                ["react", "React"],
                ["vue", "Vue"],
                ["svelte", "Svelte"],
                ["express", "Express"],
                ["fastify", "Fastify"],
                ["hono", "Hono"],
                ["koa", "Koa"],
                ["mongoose", "MongoDB"],
                ["typeorm", "TypeORM"],
                ["sequelize", "Sequelize"],
                ["socket.io", "Socket.IO"],
                ["stripe", "Stripe"],
                ["next-auth", "NextAuth"],
                ["@clerk", "Clerk"],
                ["@auth", "Auth.js"],
                ["zod", "Zod"],
                ["zustand", "Zustand"],
                ["@reduxjs", "Redux"],
                ["@tanstack/react-query", "TanStack Query"],
                ["@trpc", "tRPC"],
                ["@upstash", "Upstash"],
                ["ioredis", "Redis"],
                ["bull", "Bull Queue"],
                ["@sentry", "Sentry"],
                ["winston", "Winston Logger"],
                ["pino", "Pino Logger"],
                ["sharp", "Sharp (Image Processing)"],
                ["@aws-sdk", "AWS SDK"],
                ["@google-cloud", "Google Cloud"],
            ];

            depDetectors.forEach(([dep, name]) => {
                if (Object.keys(allDeps).some((d) => d.startsWith(dep) || d === dep)) {
                    if (!techStack.includes(name)) techStack.push(name);
                }
            });
        } catch { }
    }

    return [...new Set(techStack)];
}