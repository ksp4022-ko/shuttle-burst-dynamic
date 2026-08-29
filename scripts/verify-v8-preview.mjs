import { spawnSync } from "node:child_process";

const bootstrap = process.argv.includes("--bootstrap");

const commandParts = (command, args) => {
  if (process.platform === "win32" && command === "npm") {
    return { command: "cmd.exe", args: ["/d", "/s", "/c", "npm", ...args] };
  }

  return { command, args };
};

const run = (command, args) => {
  const parts = commandParts(command, args);
  const result = spawnSync(parts.command, parts.args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
  }

  return result.status === 0;
};

const capture = (command, args) => {
  const parts = commandParts(command, args);
  const result = spawnSync(parts.command, parts.args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `${command} ${args.join(" ")} failed`);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const unique = (items) => [...new Set(items)].sort();

const changedFiles = () =>
  unique([
    ...capture("git", ["diff", "--name-only"]),
    ...capture("git", ["diff", "--cached", "--name-only"]),
    ...capture("git", ["ls-files", "--others", "--exclude-standard"]),
  ]);

const allowedNormal = (file) =>
  file.startsWith("src/components/v8-preview/") ||
  file.startsWith("public/v8-preview/") ||
  file === "src/routes/v8_.preview.tsx" ||
  file === "src/routeTree.gen.ts";

const allowedBootstrap = (file) =>
  allowedNormal(file) ||
  file === "AGENTS.md" ||
  file === "package.json" ||
  file === "scripts/verify-v8-preview.mjs";

const isAllowed = bootstrap ? allowedBootstrap : allowedNormal;

console.log("V8 PREVIEW VERIFY");

const buildPass = run("npm", ["run", "build"]);
console.log(`build: ${buildPass ? "PASS" : "FAIL"}`);
if (!buildPass) {
  process.exit(1);
}

const files = changedFiles();
const forbidden = files.filter((file) => !isAllowed(file));
const scopePass = forbidden.length === 0;

console.log(`scope: ${scopePass ? "PASS" : "FAIL"}`);
console.log("changed files:");
if (files.length === 0) {
  console.log("- NONE");
} else {
  for (const file of files) {
    console.log(`- ${file}`);
  }
}

if (!scopePass) {
  console.log("forbidden changed files:");
  for (const file of forbidden) {
    console.log(`- ${file}`);
  }
  console.log("result: FAIL");
  process.exit(1);
}

console.log("result: PASS");
