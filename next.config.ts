import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder. The home dir has its own lockfile,
  // and without this Next/Turbopack may infer the wrong root and mis-resolve.
  turbopack: {
    root: path.join(__dirname),
  },
  // Our own brand mark is an SVG served via next/image — allow it.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
};

export default nextConfig;
