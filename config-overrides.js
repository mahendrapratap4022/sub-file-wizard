// config-overrides.js
const webpack = require("webpack");

module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      timers: require.resolve("timers-browserify"),
      // You can also add other polyfills if needed
      ...config.resolve.fallback,
    };

    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"], // Include this if you have Buffer usage as well
      }),
    ];

    config.resolve.fallback = {
      ...config.resolve.fallback, // Keep any existing fallbacks
      stream: require.resolve("stream-browserify"),
    };

    return config;
  },
};
