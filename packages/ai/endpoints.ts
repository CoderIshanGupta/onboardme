// packages/ai/endpoints.ts

interface Endpoint {
  method: string;
  path: string;
  source: string;
}

export function detectEndpoints(
  tree: { path: string; type: string }[]
): Endpoint[] {
  const endpoints: Endpoint[] = [];

  tree.forEach((file) => {
    if (file.type !== "blob") return;
    const path = file.path;

    // Next.js App Router API routes
    if (path.match(/app\/api\/.*\/route\.(ts|js)$/)) {
      const routePath = path
        .replace(/^(src\/)?app/, "")
        .replace(/\/route\.(ts|js)$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1");

      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      methods.forEach((method) => {
        endpoints.push({ method, path: routePath, source: file.path });
      });
    }

    // Next.js Pages Router API routes
    if (path.match(/pages\/api\/.*\.(ts|js)$/)) {
      const routePath = path
        .replace(/^(src\/)?pages/, "")
        .replace(/\.(ts|js)$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1")
        .replace(/\/index$/, "");

      endpoints.push({ method: "ALL", path: routePath || "/api", source: file.path });
    }

    // Express-style routes
    if (path.match(/routes?\/.*\.(ts|js)$/) && !path.includes("app/")) {
      const routeName = path.split("/").pop()?.replace(/\.(ts|js)$/, "") || "";
      if (routeName && routeName !== "index") {
        endpoints.push({ method: "ALL", path: `/api/${routeName}`, source: file.path });
      }
    }

    // Python Flask/FastAPI routes
    if (path.match(/routes?\/.*\.py$/)) {
      const routeName = path.split("/").pop()?.replace(".py", "") || "";
      if (routeName && routeName !== "__init__") {
        endpoints.push({ method: "ALL", path: `/${routeName}`, source: file.path });
      }
    }
  });

  // Deduplicate
  const unique = endpoints.filter(
    (ep, i) => endpoints.findIndex((e) => e.path === ep.path && e.method === ep.method) === i
  );

  return unique.sort((a, b) => a.path.localeCompare(b.path));
}