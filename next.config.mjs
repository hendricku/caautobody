/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/services/zeekr-approved-repairer-melbourne", destination: "/services/services-zeekr-approved-repairer-melbourne", permanent: true },
      { source: "/zeekr-approved-repairer-melbourne", destination: "/services/services-zeekr-approved-repairer-melbourne", permanent: true }
    ];
  }
};
export default nextConfig;
