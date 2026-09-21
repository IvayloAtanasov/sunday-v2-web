// next.config.mjs
export default {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: 'null-loader',
    });
    // RainbowKit imports every wagmi connector, and the server build of Base's connector reaches
    // Coinbase's x402 payment code, whose packages are optional peers nobody here installs. That
    // code is never called, so its imports resolve to nothing instead of failing the build.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/evm': false,
      '@x402/extensions': false,
      '@x402/svm': false,
    };
    return config;
  },
}
