import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for GitHub Pages
  output: "export",

  // Disable image optimizer (not available on static export)
  images: { unoptimized: true },

  // IMPORTANT: GitHub Pages repo name
  // Change BOTH if your repo name changes
  basePath: "/fazal-portfolio",
  assetPrefix: "/fazal-portfolio/",
};

export default nextConfig;
