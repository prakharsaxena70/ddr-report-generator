import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000", "0.0.0.0:3000"],
  turbopack: {
    resolveAlias: {
      "plotly.js": "plotly.js-dist-min",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "plotly.js": "plotly.js-dist-min",
      };
    }
    return config;
  },
};

export default nextConfig;
