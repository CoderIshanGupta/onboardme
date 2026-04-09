// packages/ai/cursed.ts

interface CursedFile {
  path: string;
  reasons: string[];
  severity: "low" | "medium" | "high" | "critical";
}

// Files that should NEVER be flagged
const SAFE_FILES = new Set([
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".prettierrc",
  ".prettierignore",
  ".eslintrc",
  ".eslintignore",
  ".npmrc",
  ".nvmrc",
  ".node-version",
  ".env.example",
  ".env.local.example",
  "license",
  "license.md",
  "license.txt",
  "readme.md",
  "readme",
  "changelog.md",
  "contributing.md",
  "code_of_conduct.md",
  "security.md",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "tsconfig.json",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "vite.config.ts",
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.js",
  "postcss.config.mjs",
  "jest.config.js",
  "jest.config.ts",
  "turbo.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "dockerfile",
  "makefile",
  ".dockerignore",
]);

// Directories that should never be flagged
const SAFE_DIRS = [
  ".github/",
  ".vscode/",
  ".husky/",
  "public/",
  "static/",
  "assets/",
  "docs/",
];

export function detectCursedFiles(
  tree: { path: string; type: string; size?: number }[],
  commits: { message: string; date: string; timeOfDay: number; sha: string }[]
): CursedFile[] {
  const cursedFiles: CursedFile[] = [];

  // Only check actual source files (blobs)
  const sourceFiles = tree.filter((f) => {
    if (f.type !== "blob") return false;

    const path = f.path.toLowerCase();
    const fileName = path.split("/").pop() || "";

    // Skip safe files
    if (SAFE_FILES.has(fileName)) return false;

    // Skip safe directories
    if (SAFE_DIRS.some((dir) => path.startsWith(dir))) return false;

    // Skip lock files, maps, minified files
    if (path.endsWith(".lock")) return false;
    if (path.endsWith(".map")) return false;
    if (path.endsWith(".min.js") || path.endsWith(".min.css")) return false;
    if (path.endsWith(".d.ts")) return false;
    if (path.endsWith(".svg") || path.endsWith(".png") || path.endsWith(".jpg")) return false;
    if (path.endsWith(".ico") || path.endsWith(".woff") || path.endsWith(".woff2")) return false;

    // Only check source code files
    const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb", ".php", ".c", ".cpp", ".cs"];
    return sourceExtensions.some((ext) => path.endsWith(ext));
  });

  sourceFiles.forEach((file) => {
    const path = file.path;
    const pathLower = path.toLowerCase();
    const fileName = pathLower.split("/").pop() || "";
    const reasons: string[] = [];

    // 1. Files with suspicious names (actual code smells)
    if (pathLower.includes("/deprecated/") || fileName.startsWith("deprecated_")) {
      reasons.push("Located in or marked as deprecated code");
    }

    if (pathLower.includes("/legacy/") || fileName.startsWith("legacy_")) {
      reasons.push("Legacy code that may need modernization");
    }

    if (fileName.includes("hack") || fileName.includes("workaround")) {
      reasons.push("Named as a hack or workaround — likely needs proper implementation");
    }

    if (fileName.startsWith("temp_") || fileName.startsWith("tmp_")) {
      reasons.push("Temporary file that was never cleaned up");
    }

    if (fileName.includes("_old") || fileName.includes("_backup") || fileName.includes("_copy")) {
      reasons.push("Old/backup copy of another file still in the codebase");
    }

    if (fileName.match(/^(.+)\.(bak|orig|save)$/)) {
      reasons.push("Backup/original file committed to source control");
    }

    // 2. God files (unusually large source files)
    if (file.size) {
      if (file.size > 200000) {
        reasons.push(`Very large file (${Math.round(file.size / 1024)}KB) — likely needs to be split into smaller modules`);
      } else if (file.size > 100000) {
        reasons.push(`Large file (${Math.round(file.size / 1024)}KB) — consider refactoring into smaller pieces`);
      }
    }

    // 3. Files with too many generic names suggesting poor architecture
    if (fileName === "utils.ts" || fileName === "utils.js" || fileName === "helpers.ts" || fileName === "helpers.js") {
      if (file.size && file.size > 50000) {
        reasons.push("Large utility file — may be a dumping ground for miscellaneous functions");
      }
    }

    // 4. Index files that are too large (barrel exports gone wrong)
    if ((fileName === "index.ts" || fileName === "index.js") && file.size && file.size > 30000) {
      reasons.push("Unusually large index file — may have too much logic for an entry point");
    }

    // Only add if we found real reasons
    if (reasons.length > 0) {
      const severity: CursedFile["severity"] =
        reasons.length >= 3 ? "critical" :
        reasons.length >= 2 ? "high" :
        reasons.some((r) => r.includes("deprecated") || r.includes("Very large")) ? "medium" : "low";

      cursedFiles.push({ path: file.path, reasons, severity });
    }
  });

  return cursedFiles
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 10);
}