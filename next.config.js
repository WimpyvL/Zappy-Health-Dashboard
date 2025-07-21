/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This allows requests from the Firebase Studio development environment.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
  webpack: (config, { isServer }) => {
    // Handle undici package compatibility issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore problematic packages in client-side builds
    config.externals = config.externals || [];
    config.externals.push({
      undici: 'undici',
    });

    return config;
  },
};

module.exports = nextConfig;