// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages ke liye static export
  output: "export",

  // Image optimization off (Pages CDN nahi hota)
  images: { unoptimized: true },

  // IMPORTANT: repo ka naam yahan dalna hota hai
  // tumhara repo: fazal-portfolio
  basePath: "/fazal-portfolio",
  assetPrefix: "/fazal-portfolio/",
};

export default nextConfig;
