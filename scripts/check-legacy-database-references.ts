import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";

type Rule = { token: string; allowed: RegExp[] };

const root = resolve(import.meta.dirname, "..");
const sourceRoots = ["tlora-platform/src", "tlora-subdomain/src"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".sql"]);
const rules: Rule[] = [
  {
    token: "studio_google_drive_connections",
    allowed: [
      /supabase[\\/](production-schema|studio-google-drive|optimize-schema)\.sql$/,
      /sql[\\/]20260716_refactor_platform_tlora_studio\.sql$/,
    ],
  },
  {
    token: '.from("albums")',
    allowed: [/app[\\/]api[\\/]tlora[\\/]albums[\\/]route\.ts$/],
  },
  {
    token: '.from("album_photos")',
    allowed: [],
  },
  {
    token: '"Build UI / UX"',
    allowed: [],
  },
  {
    token: '.is("studio_id", null)',
    allowed: [],
  },
  {
    token: '.is("customer_galleries.studio_id", null)',
    allowed: [],
  },
  {
    token: "studio_id: null",
    allowed: [],
  },
];

function filesUnder(path: string): string[] {
  const absolute = resolve(root, path);
  return readdirSync(absolute).flatMap((name) => {
    const child = resolve(absolute, name);
    return statSync(child).isDirectory() ? filesUnder(relative(root, child)) : [child];
  });
}

const violations: string[] = [];
for (const file of sourceRoots.flatMap(filesUnder)) {
  if (!extensions.has(extname(file))) continue;
  const path = relative(root, file);
  const content = readFileSync(file, "utf8");
  for (const rule of rules) {
    if (!content.includes(rule.token)) continue;
    if (!rule.allowed.some((pattern) => pattern.test(path))) {
      violations.push(`${path}: deprecated reference ${rule.token}`);
    }
  }
}

if (violations.length) {
  console.error("Legacy database reference check failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Legacy database reference check passed.");
