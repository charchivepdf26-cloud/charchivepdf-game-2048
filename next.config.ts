import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // partialPrefetching: false, // Tắt hoặc xóa dòng này đi vì xung đột với export mode
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;