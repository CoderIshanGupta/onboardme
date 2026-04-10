// packages/ai/devcontainer.ts

interface DevContainerConfig {
  name: string;
  image: string;
  features: Record<string, any>;
  forwardPorts: number[];
  postCreateCommand: string;
  customizations: {
    vscode: {
      extensions: string[];
      settings: Record<string, any>;
    };
  };
}

export function generateDevcontainer(
  repoName: string,
  tree: { path: string; type: string }[],
  keyFiles: Record<string, string>
): { config: DevContainerConfig; dockerCompose: string | null } {
  const paths = tree.map((f) => f.path.toLowerCase());
  const extensions: string[] = [];
  const features: Record<string, any> = {};
  const ports: number[] = [];
  let image = "mcr.microsoft.com/devcontainers/universal:2";
  let postCreate = "";

  // Detect Node.js
  if (paths.some((p) => p === "package.json")) {
    image = "mcr.microsoft.com/devcontainers/javascript-node:20";
    features["ghcr.io/devcontainers/features/node:1"] = { version: "20" };
    extensions.push(
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
    );

    // Detect package manager
    if (paths.some((p) => p === "pnpm-lock.yaml" || p === "pnpm-workspace.yaml")) {
      postCreate = "pnpm install && pnpm dev";
      features["ghcr.io/devcontainers/features/node:1"] = { version: "20", pnpmVersion: "latest" };
    } else if (paths.some((p) => p === "yarn.lock")) {
      postCreate = "yarn install && yarn dev";
    } else {
      postCreate = "npm install && npm run dev";
    }
  }

  // Detect TypeScript
  if (paths.some((p) => p.includes("tsconfig"))) {
    image = "mcr.microsoft.com/devcontainers/typescript-node:20";
    extensions.push("ms-vscode.vscode-typescript-next");
  }

  // Detect Python
  if (paths.some((p) => p.endsWith(".py"))) {
    image = "mcr.microsoft.com/devcontainers/python:3.11";
    features["ghcr.io/devcontainers/features/python:1"] = { version: "3.11" };
    extensions.push("ms-python.python", "ms-python.vscode-pylance");

    if (paths.some((p) => p === "requirements.txt")) {
      postCreate = "pip install -r requirements.txt";
    } else if (paths.some((p) => p === "pyproject.toml")) {
      postCreate = "pip install -e .";
    }
  }

  // Detect Go
  if (paths.some((p) => p === "go.mod")) {
    image = "mcr.microsoft.com/devcontainers/go:1.21";
    extensions.push("golang.go");
    postCreate = "go mod download";
  }

  // Detect Rust
  if (paths.some((p) => p === "cargo.toml")) {
    image = "mcr.microsoft.com/devcontainers/rust:1";
    extensions.push("rust-lang.rust-analyzer");
    postCreate = "cargo build";
  }

  // Detect frameworks
  if (paths.some((p) => p.includes("next.config"))) {
    ports.push(3000);
    extensions.push("bradlc.vscode-tailwindcss");
  }

  if (paths.some((p) => p.includes("vite.config"))) {
    ports.push(5173);
  }

  // Detect databases
  if (paths.some((p) => p.includes("prisma"))) {
    extensions.push("Prisma.prisma");
    features["ghcr.io/devcontainers/features/docker-in-docker:2"] = {};
  }

  // Detect Docker
  let dockerCompose: string | null = null;
  if (paths.some((p) => p.includes("docker-compose"))) {
    extensions.push("ms-azuretools.vscode-docker");
  }

  // Detect Tailwind
  if (paths.some((p) => p.includes("tailwind"))) {
    extensions.push("bradlc.vscode-tailwindcss");
  }

  // Common extensions
  extensions.push(
    "GitHub.copilot",
    "eamodio.gitlens",
    "usernamehw.errorlens",
  );

  const config: DevContainerConfig = {
    name: repoName.split("/").pop() || "dev",
    image,
    features,
    forwardPorts: ports,
    postCreateCommand: postCreate || "echo 'Ready to code!'",
    customizations: {
      vscode: {
        extensions: [...new Set(extensions)],
        settings: {
          "editor.formatOnSave": true,
          "editor.defaultFormatter": "esbenp.prettier-vscode",
          "editor.tabSize": 2,
        },
      },
    },
  };

  return { config, dockerCompose };
}