// packages/ai/envdetector.ts

interface EnvVar {
  name: string;
  source: string;
  required: boolean;
  description?: string;
}

export function detectEnvVars(
  tree: { path: string; type: string }[],
  keyFiles: Record<string, string>
): EnvVar[] {
  const envVars: EnvVar[] = [];
  const seen = new Set<string>();

  const addVar = (name: string, source: string, required: boolean = true, description?: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      envVars.push({ name, source, required, description });
    }
  };

  // ============================================
  // 1. Parse .env.example / .env.template / .env.sample files
  //    This is the MOST RELIABLE source
  // ============================================
  const envFileKeys = [
    ".env.example",
    ".env.local.example",
    ".env.template",
    ".env.sample",
  ];

  for (const key of envFileKeys) {
    const content = keyFiles[key];
    if (!content) continue;

    const lines = content.split("\n");
    let currentComment = "";

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Track comments as descriptions for the next variable
      if (trimmed.startsWith("#")) {
        currentComment = trimmed.replace(/^#+\s*/, "").trim();
        return;
      }

      if (trimmed.length === 0) {
        currentComment = "";
        return;
      }

      // Match KEY=value or KEY= or KEY (without value)
      const match = trimmed.match(/^([A-Z][A-Z0-9_]+)\s*=?\s*(.*)/);
      if (match) {
        const name = match[1];
        const value = match[2]?.trim().replace(/^["']|["']$/g, "") || "";

        // Determine if required based on context
        const isOptional =
          currentComment.toLowerCase().includes("optional") ||
          value.toLowerCase().includes("optional") ||
          value === "" && currentComment.toLowerCase().includes("not required");

        // Use comment as description, or generate from value
        let desc = currentComment || "";
        if (!desc && value) {
          if (value.startsWith("your_") || value.startsWith("sk_") || value.startsWith("pk_")) {
            desc = "Replace with your actual value";
          } else if (value === "true" || value === "false") {
            desc = `Boolean flag (default: ${value})`;
          } else if (value.startsWith("http")) {
            desc = `URL endpoint`;
          }
        }

        addVar(name, key, !isOptional, desc || undefined);
        currentComment = "";
      }
    });
  }

  // ============================================
  // 2. Parse package.json dependencies
  // ============================================
  const packageJson = keyFiles["package.json"];
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps) {
        detectFromDependencies(allDeps, addVar);
      }

      // Check scripts for env references
      const scriptsStr = JSON.stringify(pkg.scripts || {});
      const envMatches = scriptsStr.match(/\$\{?([A-Z][A-Z0-9_]+)\}?/g) || [];
      envMatches.forEach((m) => {
        const name = m.replace(/[${}]/g, "");
        addVar(name, "Referenced in package.json scripts", true);
      });
    } catch {}
  }

  // ============================================
  // 3. Detect from file structure
  // ============================================
  const paths = tree.map((f) => f.path.toLowerCase());

  if (paths.some((p) => p.includes("prisma/schema.prisma"))) {
    addVar("DATABASE_URL", "Required by Prisma schema", true, "Database connection string");
  }

  if (paths.some((p) => p.includes(".github/workflows"))) {
    addVar("GITHUB_TOKEN", "Used in CI/CD workflows", false, "Auto-provided in GitHub Actions");
  }

  return envVars;
}

function detectFromDependencies(
  deps: Record<string, string>,
  addVar: (name: string, source: string, required?: boolean, description?: string) => void
) {
  const depKeys = Object.keys(deps);

  // Only add env vars that weren't already found in .env.example
  // (those are more accurate since they come from the project itself)

  const detections: { deps: string[]; vars: [string, string, boolean, string][] }[] = [
    {
      deps: ["prisma", "@prisma/client"],
      vars: [["DATABASE_URL", "Required by Prisma", true, "PostgreSQL/MySQL connection string"]],
    },
    {
      deps: ["drizzle-orm"],
      vars: [["DATABASE_URL", "Required by Drizzle ORM", true, "Database connection string"]],
    },
    {
      deps: ["mongoose", "mongodb"],
      vars: [["MONGODB_URI", "Required by MongoDB", true, "MongoDB connection string"]],
    },
    {
      deps: ["next-auth", "@auth/core"],
      vars: [
        ["NEXTAUTH_SECRET", "Required by NextAuth.js", true, "Random string for session encryption"],
        ["NEXTAUTH_URL", "Required by NextAuth.js", true, "Your app URL (http://localhost:3000)"],
      ],
    },
    {
      deps: ["@clerk/nextjs", "@clerk/clerk-js"],
      vars: [
        ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "Required by Clerk", true, "Clerk publishable key"],
        ["CLERK_SECRET_KEY", "Required by Clerk", true, "Clerk secret key"],
      ],
    },
    {
      deps: ["@supabase/supabase-js"],
      vars: [
        ["NEXT_PUBLIC_SUPABASE_URL", "Required by Supabase", true, "Supabase project URL"],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Required by Supabase", true, "Supabase anonymous key"],
      ],
    },
    {
      deps: ["stripe", "@stripe/stripe-js"],
      vars: [
        ["STRIPE_SECRET_KEY", "Required by Stripe", true, "Stripe secret key (sk_...)"],
        ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Required by Stripe", true, "Stripe publishable key (pk_...)"],
        ["STRIPE_WEBHOOK_SECRET", "Stripe webhook verification", false, "Stripe webhook signing secret"],
      ],
    },
    {
      deps: ["openai"],
      vars: [["OPENAI_API_KEY", "Required by OpenAI", true, "OpenAI API key (sk-...)"]],
    },
    {
      deps: ["@anthropic-ai/sdk"],
      vars: [["ANTHROPIC_API_KEY", "Required by Claude/Anthropic", true, "Anthropic API key"]],
    },
    {
      deps: ["resend"],
      vars: [["RESEND_API_KEY", "Required by Resend", true, "Resend email API key"]],
    },
    {
      deps: ["ioredis", "redis"],
      vars: [["REDIS_URL", "Required by Redis", true, "Redis connection URL"]],
    },
    {
      deps: ["@upstash/redis"],
      vars: [
        ["UPSTASH_REDIS_REST_URL", "Required by Upstash", true, "Upstash Redis REST URL"],
        ["UPSTASH_REDIS_REST_TOKEN", "Required by Upstash", true, "Upstash Redis REST token"],
      ],
    },
    {
      deps: ["@aws-sdk/client-s3", "aws-sdk"],
      vars: [
        ["AWS_ACCESS_KEY_ID", "Required by AWS", true, "AWS access key"],
        ["AWS_SECRET_ACCESS_KEY", "Required by AWS", true, "AWS secret key"],
        ["AWS_REGION", "Required by AWS", true, "AWS region (e.g., us-east-1)"],
      ],
    },
    {
      deps: ["cloudinary"],
      vars: [
        ["CLOUDINARY_CLOUD_NAME", "Required by Cloudinary", true, "Cloudinary cloud name"],
        ["CLOUDINARY_API_KEY", "Required by Cloudinary", true, "Cloudinary API key"],
        ["CLOUDINARY_API_SECRET", "Required by Cloudinary", true, "Cloudinary API secret"],
      ],
    },
    {
      deps: ["@sentry/nextjs", "@sentry/node"],
      vars: [["SENTRY_DSN", "Sentry error tracking", false, "Sentry DSN URL"]],
    },
    {
      deps: ["posthog-js", "posthog-node"],
      vars: [["NEXT_PUBLIC_POSTHOG_KEY", "PostHog analytics", false, "PostHog project API key"]],
    },
    {
      deps: ["nodemailer"],
      vars: [
        ["SMTP_HOST", "Required by Nodemailer", true, "SMTP server host"],
        ["SMTP_PORT", "Required by Nodemailer", true, "SMTP server port"],
        ["SMTP_USER", "Required by Nodemailer", true, "SMTP username"],
        ["SMTP_PASS", "Required by Nodemailer", true, "SMTP password"],
      ],
    },
    {
      deps: ["firebase", "firebase-admin"],
      vars: [
        ["FIREBASE_PROJECT_ID", "Required by Firebase", true, "Firebase project ID"],
      ],
    },
    {
      deps: ["uploadthing", "@uploadthing/react"],
      vars: [
        ["UPLOADTHING_SECRET", "Required by UploadThing", true, "UploadThing secret key"],
        ["UPLOADTHING_APP_ID", "Required by UploadThing", true, "UploadThing app ID"],
      ],
    },
  ];

  detections.forEach(({ deps: depPatterns, vars }) => {
    const hasAny = depPatterns.some((pattern) =>
      depKeys.some((d) => d === pattern || d.startsWith(pattern))
    );
    if (hasAny) {
      vars.forEach(([name, source, required, desc]) => {
        addVar(name, source, required, desc);
      });
    }
  });
}