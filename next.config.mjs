/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Navbars link to /about but the page doesn't exist yet;
      // redirect home to avoid 404s until it's built
      { source: '/about', destination: '/', permanent: false },
    ]
  },
};

export default nextConfig;
