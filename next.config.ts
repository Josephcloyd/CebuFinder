import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow other devices on the local network to use the dev server.
  allowedDevOrigins: ["192.168.110.31"],
};

export default nextConfig;
