/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  },
  async redirects() {
    return [
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/services/zeekr-approved-repairer-melbourne", destination: "/services/services-zeekr-approved-repairer-melbourne", permanent: true },
      { source: "/zeekr-approved-repairer-melbourne", destination: "/services/services-zeekr-approved-repairer-melbourne", permanent: true }
    ];
  }
};
export default nextConfig;
