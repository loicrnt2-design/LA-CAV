/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "17mb" } },
};
