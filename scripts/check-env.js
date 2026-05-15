import { readFileSync, existsSync } from "fs";

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

// Load .env files if they exist (local dev)
const envFiles = [".env.local", ".env"];
envFiles.forEach((file) => {
  if (existsSync(file)) {
    const content = readFileSync(file, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length) {
          const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
          process.env[key.trim()] = value;
        }
      }
    });
  }
});

// Also check process.env (Netlify injects env vars directly)
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("\nBuild failed: missing environment variables\n");
  console.error("Set the following variables in your Netlify dashboard:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("");
  process.exit(1);
}
