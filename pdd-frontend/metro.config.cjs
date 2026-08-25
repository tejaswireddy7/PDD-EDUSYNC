const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@tanstack/router-core/isServer") {
    return {
      filePath: path.resolve(__dirname, "metro-mocks/isServer.cjs"),
      type: "sourceFile",
    };
  }
  if (moduleName === "@tanstack/router-core/scroll-restoration-script") {
    return {
      filePath: path.resolve(__dirname, "metro-mocks/scroll-restoration-script.cjs"),
      type: "sourceFile",
    };
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
