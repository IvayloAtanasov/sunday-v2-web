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
    // Same for the MetaMask SDK's React Native storage, which it requires inside a try and only
    // on React Native.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      '@x402/core': false,
      '@x402/evm': false,
      '@x402/extensions': false,
      '@x402/svm': false,
    };
    return config;
  },
}
