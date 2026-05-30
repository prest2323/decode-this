import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder. The home dir has its own lockfile,
  // and without this Next/Turbopack may infer the wrong root and mis-resolve.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
