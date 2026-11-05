import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = join(projectRoot, ".output");
const distributionDirectory = join(projectRoot, "dist");

if (process.env.NETLIFY === "true") {
  console.log("Netlify build detected; preserving Nitro's dist and function output.");
  process.exit(0);
}

if (!existsSync(outputDirectory)) {
  throw new Error("Build output .output is missing; run the Vite build before copying it.");
}

rmSync(distributionDirectory, { recursive: true, force: true });
cpSync(outputDirectory, distributionDirectory, { recursive: true });
