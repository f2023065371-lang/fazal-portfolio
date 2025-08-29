import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // 👇 GitHub Pages ke liye add karo
  basePath: "/fazal-portfolio",
  assetPrefix: "/fazal-portfolio/",
};

export default nextConfig;
