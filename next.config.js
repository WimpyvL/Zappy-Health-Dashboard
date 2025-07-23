/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      "https://9000-firebase-studio-1752532656678.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev",
    ],
  },
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

    // Handle undici private fields syntax issue
    config.module.rules.push({
      test: /node_modules\/undici\/.*\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', { targets: 'defaults' }]],
          plugins: [
            ['@babel/plugin-transform-private-methods', { loose: true }],
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-private-property-in-object', { loose: true }]
          ]
        }
      }
    });

    return config;
  },
};

module.exports = nextConfig;
