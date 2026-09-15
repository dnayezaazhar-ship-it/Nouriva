import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function parseEnvLine(line: string): [string, string] | undefined {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return undefined;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return [match[1], value];
}

async function loadLocalEnv(): Promise<void> {
  try {
    const contents = await readFile(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (parsed && process.env[parsed[0]] === undefined) process.env[parsed[0]] = parsed[1];
    }
  } catch {
    // CI and production commonly inject the variables without a local file.
  }
}

function printSeedSummary(summary: Record<string, { inserted: number; updated: number }>): void {
  console.log("Firebase seed complete");
  for (const [collection, counts] of Object.entries(summary)) {
    console.log(`  ${collection}: ${counts.inserted} inserted, ${counts.updated} updated`);
  }
}

async function main(): Promise<void> {
  await loadLocalEnv();
  const { seedAll } = await import("./seed");
  const { formatVerification, verifySeed } = await import("./verify");
  if (process.argv.includes("--verify")) {
    const verification = await verifySeed();
    console.log(formatVerification(verification));
    if (!verification.valid) process.exitCode = 1;
    return;
  }
  const summary = await seedAll();
  printSeedSummary(summary);
  if (process.argv.includes("--verify-after")) console.log(formatVerification(await verifySeed()));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
