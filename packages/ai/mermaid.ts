// packages/ai/mermaid.ts
import type { FileTree } from "./github";

export const generateMermaidDiagram = (tree: FileTree[]): string => {
  // Filter to only important directories and files
  const importantPatterns = [
    /^src\//,
    /^app\//,
    /^pages\//,
    /^components\//,
    /^lib\//,
    /^utils\//,
    /^hooks\//,
    /^api\//,
    /^server\//,
    /^client\//,
    /^packages\//,
    /^services\//,
    /^modules\//,
    /^core\//,
  ];

  const ignoredPatterns = [
    /node_modules/,
    /\.git/,
    /\.next/,
    /dist\//,
    /build\//,
    /coverage\//,
    /\.test\./,
    /\.spec\./,
    /__tests__/,
    /\.d\.ts$/,
    /\.map$/,
    /\.lock$/,
  ];

  // Get top-level structure
  const topLevelDirs = new Set<string>();
  const structure: Record<string, string[]> = {};

  tree.forEach((file) => {
    // Skip ignored files
    if (ignoredPatterns.some((p) => p.test(file.path))) return;

    const parts = file.path.split("/");

    if (parts.length >= 1) {
      const topLevel = parts[0];
      topLevelDirs.add(topLevel);

      if (parts.length >= 2 && file.type === "tree") {
        if (!structure[topLevel]) structure[topLevel] = [];
        if (!structure[topLevel].includes(parts[1]) && structure[topLevel].length < 6) {
          structure[topLevel].push(parts[1]);
        }
      }
    }
  });

  // Identify key directories
  const keyDirs = Array.from(topLevelDirs).filter((dir) => {
    const isImportant = importantPatterns.some((p) => p.test(dir + "/"));
    const isConfigFile = dir.includes(".") && !dir.startsWith(".");
    return isImportant || (!isConfigFile && !dir.startsWith("."));
  }).slice(0, 8);

  // Build Mermaid diagram
  let mermaid = `flowchart TB\n`;
  mermaid += `    classDef folder fill:#7c3aed,stroke:#a855f7,color:#fff,stroke-width:2px\n`;
  mermaid += `    classDef file fill:#0891b2,stroke:#22d3ee,color:#fff,stroke-width:2px\n`;
  mermaid += `    classDef root fill:#059669,stroke:#10b981,color:#fff,stroke-width:3px\n\n`;

  mermaid += `    ROOT[("📦 Repository")]:::root\n\n`;

  keyDirs.forEach((dir) => {
    const dirId = dir.replace(/[^a-zA-Z0-9]/g, "_");
    const icon = getDirIcon(dir);
    mermaid += `    ${dirId}["${icon} ${dir}"]:::folder\n`;
    mermaid += `    ROOT --> ${dirId}\n`;

    // Add subdirectories
    const subDirs = structure[dir] || [];
    subDirs.slice(0, 4).forEach((subDir) => {
      const subId = `${dirId}_${subDir.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const subIcon = getDirIcon(subDir);
      mermaid += `    ${subId}["${subIcon} ${subDir}"]:::file\n`;
      mermaid += `    ${dirId} --> ${subId}\n`;
    });

    mermaid += `\n`;
  });

  // Add config files section
  const configFiles = Array.from(topLevelDirs)
    .filter((f) => f.includes(".") && !f.startsWith("."))
    .slice(0, 5);

  if (configFiles.length > 0) {
    mermaid += `    CONFIG["⚙️ Config"]:::folder\n`;
    mermaid += `    ROOT --> CONFIG\n`;
    configFiles.forEach((file) => {
      const fileId = `config_${file.replace(/[^a-zA-Z0-9]/g, "_")}`;
      mermaid += `    ${fileId}["📄 ${file}"]:::file\n`;
      mermaid += `    CONFIG --> ${fileId}\n`;
    });
  }

  return mermaid;
};

function getDirIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("component")) return "🧩";
  if (lower.includes("page") || lower.includes("app")) return "📱";
  if (lower.includes("api") || lower.includes("server")) return "🔌";
  if (lower.includes("lib") || lower.includes("util")) return "🔧";
  if (lower.includes("hook")) return "🪝";
  if (lower.includes("style") || lower.includes("css")) return "🎨";
  if (lower.includes("test")) return "🧪";
  if (lower.includes("public") || lower.includes("static") || lower.includes("asset")) return "🖼️";
  if (lower.includes("config")) return "⚙️";
  if (lower.includes("type")) return "📝";
  if (lower.includes("service")) return "⚡";
  if (lower.includes("store") || lower.includes("state")) return "💾";
  if (lower.includes("route")) return "🛣️";
  if (lower.includes("middleware")) return "🔀";
  if (lower.includes("model") || lower.includes("schema")) return "📊";
  if (lower.includes("package")) return "📦";
  return "📁";
}