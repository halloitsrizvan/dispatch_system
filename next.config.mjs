/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Suppress hydration warnings for Leaflet map elements if necessary
  reactStrictMode: false,
};

export default nextConfig;
