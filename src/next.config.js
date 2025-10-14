/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // External packages for better Node.js 22 compatibility
  // This prevents Next.js from bundling these packages, allowing them to use native Node.js fetch
  serverExternalPackages: [
    '@azure/ai-form-recognizer',
    '@azure/core-rest-pipeline',
    '@azure/core-client',
    '@azure/identity',
    '@azure/cosmos',
  ],
};

module.exports = nextConfig;
