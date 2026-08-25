const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Use a custom transformer that skips @react-native/babel-plugin-codegen for
// VirtualViewExperimentalNativeComponent.js, which has nested Flow event types
// incompatible with the installed version of @react-native/codegen.
config.transformer.babelTransformerPath = require.resolve("./metro-transform.cjs");

// Custom module resolver for web-only platform modules
const VIRTUAL_VIEW_PATH =
  "react-native/src/private/components/virtualview/VirtualViewExperimentalNativeComponent";

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
  if (moduleName.startsWith("seroval-plugins")) {
    return {
      filePath: path.resolve(__dirname, "metro-mocks/empty.cjs"),
      type: "sourceFile",
    };
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

