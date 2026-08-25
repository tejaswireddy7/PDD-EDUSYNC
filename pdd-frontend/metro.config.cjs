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
  // Redirect the broken VirtualView codegen file to a plain mock to prevent Metro crash.
  if (
    moduleName.includes(VIRTUAL_VIEW_PATH) ||
    (context.originModulePath &&
      context.originModulePath.includes("VirtualViewExperimentalNativeComponent"))
  ) {
    return {
      filePath: path.resolve(__dirname, "metro-mocks/VirtualViewExperimentalNativeComponent.cjs"),
      type: "sourceFile",
    };
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
