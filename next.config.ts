import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run build:node` emits a portable Node.js server bundle under dist/standalone.
  ...(process.env.AS_HOSTING_TARGET === "node" ? { output: "standalone" } : {}),
};

export default nextConfig;
