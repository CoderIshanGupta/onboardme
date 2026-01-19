// packages/ai/mermaid.ts
import type { FileTree } from "./github";

export const generateMermaidDiagram = (tree: FileTree[]) => {
  const dirs = new Map<string, string[]>();

  tree.forEach(file => {
    if (file.type === "blob" && !file.path.includes("test") && !file.path.startsWith(".github")) {
      const parts = file.path.split("/");
      const filename = parts.pop()!;
      const dir = parts.join("/") || "root";

      if (!dirs.has(dir)) dirs.set(dir, []);
      dirs.get(dir)!.push(filename);
    }
  });

  let mermaid = "graph TD\n";
  mermaid += "    root[root]\n";

  const importantDirs = Array.from(dirs.keys())
    .filter(d => d !== "root")
    .sort((a, b) => dirs.get(b)!.length - dirs.get(a)!.length)
    .slice(0, 20);

  importantDirs.forEach(dir => {
    const id = dir.replace(/[^a-zA-Z0-9]/g, "_");
    mermaid += `    ${id}["📁 ${dir.split("/").pop() || dir}"]\n`;
    mermaid += `    root --> ${id}\n`;

    dirs.get(dir)!.slice(0, 8).forEach(file => {
      const fileId = (dir + "/" + file).replace(/[^a-zA-Z0-9]/g, "_");
      mermaid += `    ${fileId}["📄 ${file}"]\n`;
      mermaid += `    ${id} --> ${fileId}\n`;
    });
  });

  return "```mermaid\n" + mermaid + "\n```";
};