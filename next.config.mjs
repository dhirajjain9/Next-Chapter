/** @type {import('next').NextConfig} */
const nextConfig = {
  // Research calls hit the Anthropic API with web search and can run long.
  // Vercel honors maxDuration per-route (set in the route files); nothing extra here.
};
export default nextConfig;
