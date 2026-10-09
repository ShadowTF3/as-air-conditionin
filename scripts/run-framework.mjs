import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [requestedCommand, ...args] = process.argv.slice(2);
const nodeBuild = requestedCommand === "build:node";
const nodeDev = requestedCommand === "dev:node";
const command = nodeBuild ? "build" : nodeDev ? "dev" : requestedCommand;
if (!["dev", "build"].includes(command)) throw new Error("Expected dev, dev:node, build, or build:node.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (nodeBuild || nodeDev) process.env.AS_HOSTING_TARGET = "node";

if (managedLinux && command === "build" && !nodeBuild) {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
const cliArgs = [fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];

if (nodeBuild) {
  const result = spawnSync(process.execPath, cliArgs, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
} else {
  // Import in this process so the preview owner retains its PID and signals.
  process.argv = [process.execPath, ...cliArgs];
  await import(cli.href);
}

if (nodeBuild) {
  const standalonePackageUrl = new URL("../dist/standalone/package.json", import.meta.url);
  const standalonePackage = JSON.parse(await readFile(standalonePackageUrl, "utf8"));
  standalonePackage.scripts = { ...standalonePackage.scripts, start: "node server.js" };
  await writeFile(standalonePackageUrl, `${JSON.stringify(standalonePackage, null, 2)}\n`);
}
