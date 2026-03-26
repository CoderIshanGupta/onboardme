// apps/web/src/components/FileTree.tsx
"use client";

import { useState, useMemo, useEffect } from "react";

interface FileItem {
    path: string;
    type: "blob" | "tree";
}

interface FileNode {
    name: string;
    isFile: boolean;
    path: string;
    children: FileNode[];
}

interface FileTreeProps {
    files: FileItem[] | string[];
}

export default function FileTree({ files }: FileTreeProps) {
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandAll, setExpandAll] = useState(false);
    // This key forces re-render of all TreeNodes when expand/collapse is toggled
    const [treeKey, setTreeKey] = useState(0);

    const normalizedFiles: FileItem[] = useMemo(() => {
        return files.map((f) => {
            if (typeof f === "string") {
                // If it's just a string, guess type
                const hasExtension = f.split("/").pop()?.includes(".");
                return { path: f, type: (hasExtension ? "blob" : "tree") as "blob" | "tree" };
            }
            // If it already has path and type, use directly
            if (f && typeof f === "object" && "path" in f && "type" in f) {
                return { path: f.path, type: f.type };
            }
            return { path: String(f), type: "blob" as const };
        });
    }, [files]);

    const tree = useMemo(() => buildTree(normalizedFiles), [normalizedFiles]);
    const treeText = useMemo(() => generateTreeText(tree, ""), [tree]);

    const filteredTree = useMemo(() => {
        if (!searchQuery.trim()) return tree;
        return filterTree(tree, searchQuery.toLowerCase());
    }, [tree, searchQuery]);

    const stats = useMemo(() => {
        let fileCount = 0;
        let folderCount = 0;
        normalizedFiles.forEach((f) => {
            if (f.type === "blob") fileCount++;
            else folderCount++;
        });
        return { fileCount, folderCount };
    }, [normalizedFiles]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(treeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = treeText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleToggleAll = () => {
        setExpandAll((prev) => !prev);
        setTreeKey((prev) => prev + 1); // Force re-render
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${copied
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                            Copy Structure
                        </>
                    )}
                </button>

                <button
                    onClick={handleToggleAll}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-all active:scale-95"
                >
                    {expandAll ? "📁 Collapse All" : "📂 Expand All"}
                </button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-slate-500">
                <span>📁 {stats.folderCount} folders</span>
                <span>📄 {stats.fileCount} files</span>
            </div>

            {/* Tree */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                <div className="p-4 overflow-auto max-h-[600px] font-mono text-sm" key={treeKey}>
                    {filteredTree.length > 0 ? (
                        filteredTree.map((node, i) => (
                            <TreeNode
                                key={`${node.path}-${i}-${treeKey}`}
                                node={node}
                                depth={0}
                                searchQuery={searchQuery}
                                defaultOpen={expandAll || searchQuery.length > 0}
                            />
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-8">
                            {searchQuery ? "No files match your search" : "No files to display"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function TreeNode({
    node,
    depth,
    searchQuery,
    defaultOpen,
}: {
    node: FileNode;
    depth: number;
    searchQuery: string;
    defaultOpen: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen || depth < 1);

    // React to defaultOpen changes
    useEffect(() => {
        setIsOpen(defaultOpen || depth < 1);
    }, [defaultOpen, depth]);

    // Open when searching
    useEffect(() => {
        if (searchQuery.length > 0) setIsOpen(true);
    }, [searchQuery]);

    const hasChildren = !node.isFile && node.children.length > 0;
    const paddingLeft = depth * 20 + 12;

    const highlightMatch = (text: string) => {
        if (!searchQuery) return text;
        const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
        if (index === -1) return text;
        return (
            <>
                {text.slice(0, index)}
                <span className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
                    {text.slice(index, index + searchQuery.length)}
                </span>
                {text.slice(index + searchQuery.length)}
            </>
        );
    };

    // File
    if (node.isFile) {
        return (
            <div
                className="flex items-center gap-2 py-2 px-3 text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors select-text"
                style={{ paddingLeft }}
            >
                <FileIcon name={node.name} />
                <span className="truncate">{highlightMatch(node.name)}</span>
            </div>
        );
    }

    // Folder
    return (
        <div>
            <button
                onClick={() => hasChildren && setIsOpen(!isOpen)}
                className="flex items-center gap-2 py-2 px-3 w-full text-left text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors active:bg-slate-700/50 min-h-[40px]"
                style={{ paddingLeft }}
            >
                <span
                    className={`text-slate-500 transition-transform duration-200 text-xs w-4 text-center ${isOpen ? "rotate-90" : ""
                        }`}
                >
                    {hasChildren ? "▶" : "•"}
                </span>
                <span className="text-base">{isOpen && hasChildren ? "📂" : "📁"}</span>
                <span className="font-medium truncate">{highlightMatch(node.name)}</span>
                {hasChildren && (
                    <span className="ml-auto text-xs text-slate-600 pr-2 flex-shrink-0">
                        {node.children.length}
                    </span>
                )}
            </button>

            {isOpen && hasChildren && (
                <div className="animate-fadeIn">
                    {node.children.map((child, i) => (
                        <TreeNode
                            key={`${child.path}-${i}`}
                            node={child}
                            depth={depth + 1}
                            searchQuery={searchQuery}
                            defaultOpen={defaultOpen}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function FileIcon({ name }: { name: string }) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const baseName = name.toLowerCase();

    const specialIcons: Record<string, string> = {
        "package.json": "📦",
        "package-lock.json": "🔒",
        "pnpm-lock.yaml": "🔒",
        "yarn.lock": "🔒",
        "readme.md": "📖",
        license: "📜",
        "license.md": "📜",
        dockerfile: "🐳",
        "docker-compose.yml": "🐳",
        "docker-compose.yaml": "🐳",
        ".gitignore": "🙈",
        ".env": "🔐",
        ".env.local": "🔐",
        ".env.example": "🔐",
        "tsconfig.json": "🔷",
        "next.config.js": "▲",
        "next.config.mjs": "▲",
        "next.config.ts": "▲",
        "tailwind.config.js": "🎨",
        "tailwind.config.ts": "🎨",
    };

    if (specialIcons[baseName]) return <span className="text-base">{specialIcons[baseName]}</span>;

    const extIcons: Record<string, string> = {
        ts: "🔷", tsx: "⚛️", js: "🟨", jsx: "⚛️", json: "📋", md: "📝",
        mdx: "📝", css: "🎨", scss: "🎨", html: "🌐", py: "🐍", go: "🐹",
        rs: "🦀", java: "☕", rb: "💎", php: "🐘", swift: "🍎", yml: "⚙️",
        yaml: "⚙️", toml: "⚙️", sql: "🗃️", sh: "💻", svg: "🖼️", png: "🖼️",
        jpg: "🖼️", gif: "🖼️", ico: "🖼️", prisma: "🔺", lock: "🔒", txt: "📄",
    };

    return <span className="text-base">{extIcons[ext] || "📄"}</span>;
}

function buildTree(files: FileItem[]): FileNode[] {
    const nodeMap = new Map<string, FileNode>();

    // Minimal filtering — let users see as much as possible
    const filtered = files.filter((f) => {
        const p = f.path.toLowerCase();
        return (
            !p.includes("node_modules/") &&
            !p.includes(".git/") &&
            !p.includes(".next/") &&
            !p.includes(".turbo/") &&
            !p.includes("__pycache__/") &&
            !p.includes(".DS_Store")
        );
    });

    // First pass: create all folder nodes from folder entries
    filtered
        .filter((f) => f.type === "tree")
        .forEach((file) => {
            const parts = file.path.split("/");
            let currentPath = "";

            parts.forEach((part) => {
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!nodeMap.has(currentPath)) {
                    const node: FileNode = {
                        name: part,
                        isFile: false, // Explicitly a folder
                        path: currentPath,
                        children: [],
                    };
                    nodeMap.set(currentPath, node);

                    if (parentPath && nodeMap.has(parentPath)) {
                        const parent = nodeMap.get(parentPath)!;
                        if (!parent.children.some((c) => c.path === currentPath)) {
                            parent.children.push(node);
                        }
                    }
                }
            });
        });

    // Second pass: create all file nodes
    filtered
        .filter((f) => f.type === "blob")
        .forEach((file) => {
            const parts = file.path.split("/");
            let currentPath = "";

            parts.forEach((part, index) => {
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const isLast = index === parts.length - 1;

                if (!nodeMap.has(currentPath)) {
                    const node: FileNode = {
                        name: part,
                        isFile: isLast, // Only the last part is a file
                        path: currentPath,
                        children: [],
                    };
                    nodeMap.set(currentPath, node);

                    if (parentPath && nodeMap.has(parentPath)) {
                        const parent = nodeMap.get(parentPath)!;
                        if (!parent.children.some((c) => c.path === currentPath)) {
                            parent.children.push(node);
                        }
                    }
                }
            });
        });

    // Collect top-level nodes
    const topLevel: FileNode[] = [];
    nodeMap.forEach((node) => {
        if (!node.path.includes("/")) {
            topLevel.push(node);
        }
    });

    // Sort recursively: folders first, then files, alphabetically within each
    const sortRecursive = (nodes: FileNode[]): FileNode[] =>
        nodes
            .sort((a, b) => {
                if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
                return a.name.localeCompare(b.name);
            })
            .map((n) => ({ ...n, children: sortRecursive(n.children) }));

    return sortRecursive(topLevel);
}

function generateTreeText(nodes: FileNode[], prefix: string): string {
    let result = "";
    nodes.forEach((node, index) => {
        const isLast = index === nodes.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        result += prefix + connector + node.name + "\n";
        if (!node.isFile && node.children.length > 0) {
            result += generateTreeText(node.children, childPrefix);
        }
    });
    return result;
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
    return nodes
        .map((node) => {
            const nameMatches = node.name.toLowerCase().includes(query);
            if (node.isFile) return nameMatches ? node : null;
            const filteredChildren = filterTree(node.children, query);
            if (nameMatches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children };
            }
            return null;
        })
        .filter((n): n is FileNode => n !== null);
}