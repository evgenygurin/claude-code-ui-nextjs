/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-pty', 'ws'],
  webpack: (config, { isServer }) => {
    // Handle node-pty native module
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('node-pty');
    }

    // Handle WebSocket module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
  // Enable WebSocket support for development
  async rewrites() {
    return [
      {
        source: '/api/ws',
        destination: '/api/websocket',
      },
    ];
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Enable static optimization
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;