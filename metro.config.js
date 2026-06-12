const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);
const rorkConfig = withRorkMetro(config);
const originalResolveRequest = rorkConfig.resolver?.resolveRequest;

const resolveZodV4 = (context, moduleName, platform) => {
  if (moduleName === "zod/v4" || moduleName.startsWith("zod/v4/")) {
    return {
      filePath: require.resolve(moduleName, { paths: [__dirname] }),
      type: "sourceFile",
    };
  }

  // Provide a lightweight web shim for expo-media-library to avoid native module errors on web
  if ((moduleName === 'expo-media-library' || moduleName.startsWith('expo-media-library/')) && platform === 'web') {
    return {
      filePath: path.join(__dirname, 'web-shims', 'expo-media-library.js'),
      type: 'sourceFile',
    };
  }

  // Provide a lightweight web shim for expo-linear-gradient to avoid native-module errors on web
  if ((moduleName === 'expo-linear-gradient' || moduleName.startsWith('expo-linear-gradient/')) && platform === 'web') {
    return {
      filePath: path.join(__dirname, 'web-shims', 'expo-linear-gradient.js'),
      type: 'sourceFile',
    };
  }

  // Provide a simple web fallback for expo-image to map to react-native Image on web
  if ((moduleName === 'expo-image' || moduleName.startsWith('expo-image/')) && platform === 'web') {
    return {
      filePath: path.join(__dirname, 'web-shims', 'expo-image.js'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = {
  ...rorkConfig,
  resolver: {
    ...rorkConfig.resolver,
    resolveRequest: resolveZodV4,
  },
};
